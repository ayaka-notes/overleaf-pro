import logger from '@overleaf/logger'

import GitHubSyncController from './GitHubSyncController.mjs'
import AuthenticationController from '../../../../app/src/Features/Authentication/AuthenticationController.mjs'
import AuthorizationMiddleware from '../../../../app/src/Features/Authorization/AuthorizationMiddleware.mjs'

export default {
  apply(webRouter) {
    logger.debug({}, 'Init github-sync router')
    // Check user's GitHub Auth Status
    webRouter.get(
      '/user/github-sync/status',
      AuthenticationController.requireLogin(),
      GitHubSyncController.getStatus
    )

    // OAuth redirect endpoint for GitHub Auth flow
    webRouter.get(
      '/github-sync/beginAuth',
      AuthenticationController.requireLogin(),
      GitHubSyncController.beginAuth
    )

    // Get user's Github org
    webRouter.get(
      '/user/github-sync/orgs',
      AuthenticationController.requireLogin(),
      GitHubSyncController.listOrgs
    )


    // OAuth callback for GitHub registration flow
    webRouter.get(
      '/github-sync/completeRegistration',
      AuthenticationController.requireLogin(),
      GitHubSyncController.completeRegistration
    ) 

    // Unlink GitHub account
    webRouter.post(
      '/github-sync/unlink',
      AuthenticationController.requireLogin(),
      GitHubSyncController.unlink
    )


    // Repository listing (import github project)
    webRouter.get(
      '/user/github-sync/repos',
      AuthenticationController.requireLogin(),
      GitHubSyncController.listRepos
    )

    // Need to be owner of that project to configure GitHub Sync
    // Export a existing project to GitHub
    webRouter.post(
      '/project/:Project_id/github-sync/export',
      AuthenticationController.requireLogin(),
      AuthorizationMiddleware.ensureUserCanWriteProjectContent,
      GitHubSyncController.exportProject
    )

    
    webRouter.get(
      '/project/:Project_id/github-sync/status',
      AuthenticationController.requireLogin(),
      AuthorizationMiddleware.ensureUserCanReadProject,
      GitHubSyncController.getProjectStatus
    )

    webRouter.get(
      '/project/:Project_id/github-sync/commits/unmerged',
      AuthenticationController.requireLogin(),
      AuthorizationMiddleware.ensureUserCanWriteProjectContent,
      GitHubSyncController.getUnmergedCommits
    )



    // 
    webRouter.post(
      '/project/:Project_id/github-sync/merge',
      AuthenticationController.requireLogin(),
      AuthorizationMiddleware.ensureUserCanWriteProjectContent,
      GitHubSyncController.mergeFromGitHub
    )

    webRouter.post(
      '/project/new/github-sync',
      AuthenticationController.requireLogin(),
      GitHubSyncController.importRepo
    )
  },
}