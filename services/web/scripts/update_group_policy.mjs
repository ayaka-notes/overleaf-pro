import fs from 'node:fs'
import minimist from 'minimist'
import { ObjectId } from '../app/src/infrastructure/mongodb.mjs'
import GroupPoliciesHandler from '../modules/group-settings/app/src/GroupPoliciesHandler.mjs'
import { scriptRunner } from './lib/ScriptRunner.mjs'

// Imported to ensure policies are registered before we attempt to update them
import '../modules/group-settings/app/src/managed-users/ManagedUsersPolicy.mjs'
import '../modules/institutions/app/src/InstitutionsPolicy.mjs'

const USAGE = `Usage:
  node scripts/update_group_policy.mjs --subscription-id=<id> --policy-name=<name> --policy-value=<true|false>
  node scripts/update_group_policy.mjs --file=<path> --policy-name=<name> --policy-value=<true|false>

Options:
  --subscription-id  The id of a single subscription to update
  --file             Path to a file with one subscription _id per line (ignored when --subscription-id is present)
  --policy-name      The policy name to update (e.g. userCannotUseAIFeatures)
  --policy-value     The policy value (true or false)
  --dry-run          Perform the search but only log the count of subscriptions to update. Defaults to true
  --initiator-id     The user id of the person running the script (for audit logs)
  --verbose          Log each subscription id being updated
  --help             Show this help message`

function printUsageAndExit(code) {
  console.log(USAGE)
  process.exit(code)
}

const argv = minimist(process.argv.slice(2), {
  string: [
    'subscription-id',
    'policy-name',
    'policy-value',
    'initiator-id',
    'file',
  ],
  boolean: ['dry-run', 'help', 'verbose'],
  default: { 'dry-run': true, verbose: false },
})

if (argv.help) {
  printUsageAndExit(0)
}

async function main() {
  const subscriptionId = argv['subscription-id']
  const policyName = argv['policy-name']
  const policyValue = argv['policy-value']
  const filePath = argv.file
  const dryRun = argv['dry-run']
  const initiatorId = argv['initiator-id']
  const verbose = argv.verbose

  if (!policyName) {
    console.error('Missing --policy-name argument')
    printUsageAndExit(1)
  }
  if (!subscriptionId && !filePath) {
    console.error(
      'Missing --subscription-id or --file argument, one must be provided'
    )
    printUsageAndExit(1)
  }
  if (!policyValue) {
    console.error('Missing --policy-value argument')
    printUsageAndExit(1)
  }
  if (policyValue !== 'true' && policyValue !== 'false') {
    console.error('--policy-value must be "true" or "false"')
    printUsageAndExit(1)
  }
  if (initiatorId && !ObjectId.isValid(initiatorId)) {
    console.error(`Invalid ObjectId for --initiator-id: ${initiatorId}`)
    printUsageAndExit(1)
  }

  const policies = { [policyName]: policyValue === 'true' }
  const auditLogInfo = {
    initiatorId: initiatorId ? new ObjectId(initiatorId) : undefined,
    ipAddress: '0.0.0.0',
  }

  let subscriptionIds
  if (subscriptionId) {
    subscriptionIds = [subscriptionId]
  } else {
    const fileContent = fs.readFileSync(filePath, 'utf8')
    subscriptionIds = fileContent
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
  }

  const invalidIds = subscriptionIds.filter(id => !ObjectId.isValid(id))
  if (invalidIds.length > 0) {
    console.error(`Invalid ObjectId: ${invalidIds.join(', ')}`)
    printUsageAndExit(1)
  }

  console.log(
    `${dryRun ? 'Dry run: would update' : 'Updating'} policy ${policyName}=${policyValue}. Total subscriptions to update: ${subscriptionIds.length}`
  )

  const failedSubscriptions = []
  for (const id of subscriptionIds) {
    if (dryRun) {
      if (verbose) {
        console.log(`  Dry run: would update subscription ${id}`)
      }
    } else {
      if (verbose) {
        console.log(`  Updating subscription ${id}`)
      }
      try {
        await GroupPoliciesHandler.promises.updateGroupPolicies(
          new ObjectId(id),
          policies,
          auditLogInfo
        )
      } catch (error) {
        console.error(`  Subscription ${id} update failed`)
        console.error(error)
        failedSubscriptions.push(id)
      }
    }
  }

  console.log(
    `Total subscriptions ${dryRun ? 'found' : 'updated'}: ${subscriptionIds.length - failedSubscriptions.length}`
  )
  if (failedSubscriptions.length) {
    console.log(`Total subscriptions failed: ${failedSubscriptions.length}:`)
    failedSubscriptions.forEach(id => console.log(`  ${id}`))
  }
}

try {
  await scriptRunner(main)
  console.log('Done.')
  process.exit(0)
} catch (error) {
  console.error(error)
  process.exit(1)
}
