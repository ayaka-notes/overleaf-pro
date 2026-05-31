import Modules from '../../app/src/infrastructure/Modules.mjs'
import logger from '@overleaf/logger'
/** @import { WebModule } from "../../types/web-module" */


let GitHubSyncModule = {}
if (process.env.GITHUB_SYNC_ENABLED === 'true') {
  logger.debug({}, 'Enabling GitHub Sync module')
  const [{ default: GitHubSyncRouter }, { default: GitHubSyncHandler }] =
    await Promise.all([
      import('./app/src/GitHubSyncRouter.mjs'),
      import('./app/src/GitHubSyncHandler.mjs'),
    ])

  // Notes, this is only triggered in hard delete, no soft delete.
  // Hard delete have some time delay, usually 30 or more days after soft delete.
  Modules.hooks.attach('projectExpired', async projectId => {
    try {
      await GitHubSyncHandler.promises.deleteProjectGitHubSyncStatus(projectId)
      logger.debug({ projectId }, 'Deleted GitHub sync status for expired project')
    } catch (err) {
      logger.warn({ projectId, err }, 'failed deleting project in github sync.')
    }
  })
  
  GitHubSyncModule = {
    router: GitHubSyncRouter,
  }
}

export default GitHubSyncModule
