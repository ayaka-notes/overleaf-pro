import logger from '@overleaf/logger'
import AuthenticationController from '../../../../app/src/Features/Authentication/AuthenticationController.mjs'
import OAuthPersonalAccessTokenController from './OAuthPersonalAccessTokenController.mjs'


export default {
    apply(webRouter, privateApiRouter, publicApiRouter) {
        logger.debug({}, 'Init Oauth2-Server router')

        // We must expose this endpoint on the public API router
        // And Git Bridge uses it to validate PATs
        publicApiRouter.get('/oauth/token/info', 
            OAuthPersonalAccessTokenController.checkPersonalAccessToken
        )

        webRouter.get('/oauth/personal-access-tokens',
            AuthenticationController.requireLogin(),
            OAuthPersonalAccessTokenController.getUserPersonalAccessTokens
        )

        webRouter.post('/oauth/personal-access-tokens',
            AuthenticationController.requireLogin(),
            OAuthPersonalAccessTokenController.createPersonalAccessToken
        )

        webRouter.delete('/oauth/personal-access-tokens/:token_id',
            AuthenticationController.requireLogin(),
            OAuthPersonalAccessTokenController.deletePersonalAccessToken
        )
    }
}
