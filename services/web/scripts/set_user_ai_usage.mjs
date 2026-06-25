// Set a user's aiFeatureUsage or aiWorkbench (token) usage to a specific value.
//
// Mirrors the period-reset behaviour of:
//   app/src/infrastructure/rate-limiters/AiFeatureUsageRateLimiter.mjs
//   app/src/infrastructure/rate-limiters/TokenUsageRateLimiter.mjs
// i.e. if the existing period (24h from periodStart) has expired, periodStart
// is reset to NOW before the new usage value is written. Otherwise periodStart
// is preserved.
//
// Usage:
//
//   node scripts/set_user_ai_usage.mjs \
//     --user-id <userId> \
//     --feature <aiFeatureUsage|aiWorkbench> \
//     --usage <number> \
//     [--commit]
//
// Or, to put the user one use below their tier's quota:
//
//   node scripts/set_user_ai_usage.mjs \
//     --user-id <userId> \
//     --edge <free|basic|standard|unlimited|token> \
//     [--commit]
//
// Without --commit the script is a dry run.

import minimist from 'minimist'
import {
  db,
  ObjectId,
  READ_PREFERENCE_PRIMARY,
} from '../app/src/infrastructure/mongodb.mjs'
import { UserFeatureUsage } from '../app/src/models/UserFeatureUsage.mjs'
import { scriptRunner } from './lib/ScriptRunner.mjs'

const VALID_FEATURES = ['aiFeatureUsage', 'aiWorkbench']
const PERIOD_HOURS = 24

// Each value puts the user 1 below the limit for that tier.
const EDGE_PRESETS = {
  free: { feature: 'aiFeatureUsage', usage: 4 },
  basic: { feature: 'aiFeatureUsage', usage: 4 },
  standard: { feature: 'aiFeatureUsage', usage: 9 },
  unlimited: { feature: 'aiFeatureUsage', usage: 299 },
  token: { feature: 'aiWorkbench', usage: 7_999_999 },
}

const argv = minimist(process.argv.slice(2), {
  string: ['user-id', 'feature', 'edge'],
  boolean: ['commit', 'help'],
  alias: { 'user-id': 'userId', h: 'help' },
})

const HELP_TEXT = `\
Set a user's AI usage (aiFeatureUsage) or token usage (aiWorkbench) to a
specific value, mirroring the 24h period-reset behaviour of the production
rate limiters. Intended for staging QA of the Shared AI Quota system —
paywalls, near-quota warnings, period-reset behaviour, and token-limit
headers — without grinding a real account through the UI.

Usage:
  node scripts/set_user_ai_usage.mjs --user-id <id> [--commit] (
      --feature <aiFeatureUsage|aiWorkbench> --usage <number>
    | --edge <free|basic|standard|unlimited|token>
  )

Options:
  --user-id <id>      Target user's Mongo _id (required).
  --feature <name>    aiFeatureUsage (use count) or aiWorkbench (tokens).
  --usage <number>    Non-negative number to set features.<feature>.usage to.
  --edge <tier>       Shortcut: set the user 1 below their tier's limit.
                      Implies --feature and --usage; cannot be combined with
                      either. Tiers:
                        free       aiFeatureUsage = 4
                        basic      aiFeatureUsage = 4
                        standard   aiFeatureUsage = 9
                        unlimited  aiFeatureUsage = 299
                        token      aiWorkbench    = 7,999,999
  --commit            Apply the write. Without this flag the script is a
                      dry run and only prints the current value.
  -h, --help          Show this help and exit.

Examples:
  # Dry run — show what's currently recorded for a user, no write
  node scripts/set_user_ai_usage.mjs \\
    --user-id 5f9a2c8e1b3d4f0012abcd34 \\
    --feature aiFeatureUsage --usage 4

  # Put a Free user one use away from the AI paywall
  node scripts/set_user_ai_usage.mjs \\
    --user-id 5f9a2c8e1b3d4f0012abcd34 \\
    --edge free --commit

  # Put a Standard user one use away from the AI paywall
  node scripts/set_user_ai_usage.mjs \\
    --user-id 5f9a2c8e1b3d4f0012abcd34 \\
    --edge standard --commit

  # Put a Workbench user one token below the token limit
  node scripts/set_user_ai_usage.mjs \\
    --user-id 5f9a2c8e1b3d4f0012abcd34 \\
    --edge token --commit

  # Reset a user's AI usage back to 0
  node scripts/set_user_ai_usage.mjs \\
    --user-id 5f9a2c8e1b3d4f0012abcd34 \\
    --feature aiFeatureUsage --usage 0 --commit
`

if (argv.help) {
  console.log(HELP_TEXT)
  process.exit(0)
}

const userIdArg = argv['user-id']
const edgeArg = argv.edge
const COMMIT = argv.commit === true

if (!userIdArg) throw new Error('missing --user-id (use --help for usage)')
if (!ObjectId.isValid(userIdArg)) {
  throw new Error(`invalid --user-id: ${userIdArg}`)
}

let feature
let usage
if (edgeArg !== undefined) {
  if (argv.feature !== undefined || argv.usage !== undefined) {
    throw new Error('--edge cannot be combined with --feature or --usage')
  }
  const preset = EDGE_PRESETS[edgeArg]
  if (!preset) {
    throw new Error(
      `invalid --edge ${JSON.stringify(edgeArg)}; expected one of ${Object.keys(EDGE_PRESETS).join(', ')}`
    )
  }
  feature = preset.feature
  usage = preset.usage
} else {
  feature = argv.feature
  if (!VALID_FEATURES.includes(feature)) {
    throw new Error(
      `invalid --feature ${JSON.stringify(feature)}; expected one of ${VALID_FEATURES.join(', ')}`
    )
  }
  usage = Number(argv.usage)
  if (!Number.isFinite(usage) || usage < 0) {
    throw new Error(`invalid --usage: ${argv.usage}`)
  }
}

const userId = new ObjectId(userIdArg)

async function main() {
  const user = await db.users.findOne(
    { _id: userId },
    {
      projection: { _id: 1, email: 1 },
      readPreference: READ_PREFERENCE_PRIMARY,
    }
  )
  if (!user) {
    throw new Error(`user not found: ${userIdArg}`)
  }

  const before = await UserFeatureUsage.findOne({ _id: userId }).lean().exec()
  console.log('Before:', {
    userId: userIdArg,
    email: user.email,
    feature,
    current: before?.features?.[feature] ?? null,
  })

  if (!COMMIT) {
    console.warn(`Dry run: would set features.${feature}.usage = ${usage}`)
    console.warn('Re-run with --commit to apply.')
    return
  }

  const updated = await UserFeatureUsage.findOneAndUpdate(
    { _id: userId },
    [
      // reset periodStart/usage if the previous period (24h) has elapsed
      {
        $set: {
          features: {
            [feature]: {
              $cond: {
                if: {
                  $lte: [
                    {
                      $dateAdd: {
                        startDate: `$features.${feature}.periodStart`,
                        unit: 'hour',
                        amount: PERIOD_HOURS,
                      },
                    },
                    '$$NOW',
                  ],
                },
                then: { usage: 0, periodStart: '$$NOW' },
                else: `$features.${feature}`,
              },
            },
          },
        },
      },
      // overwrite usage with the requested value, preserving periodStart
      {
        $set: {
          [`features.${feature}.usage`]: usage,
        },
      },
    ],
    { new: true, upsert: true }
  )
    .lean()
    .exec()

  console.log('After:', {
    userId: userIdArg,
    feature,
    current: updated?.features?.[feature] ?? null,
  })
}

try {
  await scriptRunner(main, {
    userId: userIdArg,
    feature,
    usage,
    edge: edgeArg,
    commit: COMMIT,
  })
  console.error('Done.')
  process.exit(0)
} catch (error) {
  console.error({ error })
  process.exit(1)
}
