import logger from '@overleaf/logger'
import SAMLAuthenticationController from './SAMLAuthenticationController.mjs'

export default {
  apply(webRouter) {
    logger.debug({}, 'Init SAML NonCsrfRouter')
    webRouter.post('/saml/login/callback', SAMLAuthenticationController.passportLoginCallback)
    webRouter.get ('/saml/logout/callback', SAMLAuthenticationController.passportLogoutCallback)
    webRouter.post('/saml/logout/callback', SAMLAuthenticationController.passportLogoutCallback)
  },
}
