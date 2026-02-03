import logger from '@overleaf/logger'
import AuthenticationController from "../../../../app/src/Features/Authentication/AuthenticationController.mjs"
import AuthorizationMiddleware from "../../../../app/src/Features/Authorization/AuthorizationMiddleware.mjs"
import GitBridgeApiController from "./GitBridgeApiController.mjs"

export default {
    apply(webRouter, privateApiRouter, publicApiRouter) {
        const r = privateApiRouter || webRouter

        logger.debug({}, 'Init git-bridge router')

        // Git Bridge API v0
        r.get('/api/v0/docs/:project_id',
            AuthenticationController.requireOauth('git_bridge'),
            AuthorizationMiddleware.ensureUserCanReadProject,
            GitBridgeApiController.getDoc
        )
        r.get(
            '/api/v0/docs/:project_id/saved_vers',
            AuthenticationController.requireOauth('git_bridge'),
            AuthorizationMiddleware.ensureUserCanReadProject,
            GitBridgeApiController.getSavedVers
        )
        r.get(
            '/api/v0/docs/:project_id/snapshots/:version',
            AuthenticationController.requireOauth('git_bridge'),
            AuthorizationMiddleware.ensureUserCanReadProject,
            GitBridgeApiController.getSnapshot
        )
        r.post(
            '/api/v0/docs/:project_id/snapshots',
            AuthenticationController.requireOauth('git_bridge'),
            AuthorizationMiddleware.ensureUserCanWriteProjectContent,
            GitBridgeApiController.postSnapshot
        )
    }
}