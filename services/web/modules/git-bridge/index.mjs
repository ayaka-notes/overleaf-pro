import logger from '@overleaf/logger'
import { OauthApplication } from '../../app/src/models/OauthApplication.mjs'
import SecretsHelper from '../oauth2-server/app/src/SecretsHelper.js'
import GitBridgeRouter from './app/src/GitBridgeRouter.mjs'
import Modules from '../../app/src/infrastructure/Modules.mjs'

let GitBridgeModule = {}

if (process.env.GIT_BRIDGE_ENABLED === 'true') {
  // When a project is expired, we need to delete it from git-bridge as well
  const gitBridgeUrl = `http://${process.env.GIT_BRIDGE_HOST || 'git-bridge'}:${process.env.GIT_BRIDGE_PORT || 8000}`

  // Ensure that the OAuth application for git-bridge exists
  const ensureOauthApplication = async () => {
    const oauthClientName = 'Overleaf Git Bridge'
    const existing = await OauthApplication.findOne({ name: oauthClientName })
      .lean()
      .exec()
    if (existing) {
      logger.debug({ oauthClientName }, 'Git-bridge OAuth app already exists')
      return
    }

    await OauthApplication.create({
      id: SecretsHelper.createSecret(64).toLowerCase(),
      clientSecret: "v1." + SecretsHelper.createSecret(32).toString('base64'),
      grants: ['password'],
      name: oauthClientName,
      redirectUris: [],
      scopes: ['git_bridge'],
    })
    logger.info({ oauthClientName }, 'Created git-bridge OAuth app')
  }

  await ensureOauthApplication()

  Modules.hooks.attach('projectExpired', async projectId => {
    try {
      const res = await fetch(`${gitBridgeUrl}/api/projects/${projectId}`, {
        method: 'DELETE',
      })
      if (!res.ok && res.status !== 404) {
        throw new Error(`git-bridge delete failed: ${res.status}`)
      }
      logger.info({ projectId }, 'deleted project in git-bridge on expire')
    } catch (err) {
      logger.warn({ projectId, err }, 'failed deleting project in git-bridge')
    }
  })
  logger.debug({}, 'Enabling git-bridge module')
  GitBridgeModule = {
    router: GitBridgeRouter,
  }
}

export default GitBridgeModule

