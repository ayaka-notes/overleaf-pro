import Settings from '@overleaf/settings'
import logger from '@overleaf/logger'
import GitBridgeApiController from './app/src/GitBridgeApiController.mjs'
import GitBridgeRouter from './app/src/GitBridgeRouter.mjs'
import Modules from '../../app/src/infrastructure/Modules.mjs'

let GitBridgeModule = {}

if (process.env.GIT_BRIDGE_ENABLED === 'true') {
  // When a project is expired, we need to delete it from git-bridge as well
  const gitBridgeUrl = `http://${process.env.GIT_BRIDGE_HOST || 'git-bridge'}:${process.env.GIT_BRIDGE_PORT || 8000}`

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

