import logger from '@overleaf/logger'
import AuthenticationController from '../../../../../app/src/Features/Authentication/AuthenticationController.mjs'
import UserController from '../../../../../app/src/Features/User/UserController.mjs'
import SAMLAuthenticationController from './SAMLAuthenticationController.mjs'
import logout from '../../../logout.mjs'

export default {
  apply(webRouter) {
    logger.debug({}, 'Init SAML router')
    webRouter.get('/saml/login', SAMLAuthenticationController.passportLogin)
    AuthenticationController.addEndpointToLoginWhitelist('/saml/login')
    webRouter.get('/saml/meta', SAMLAuthenticationController.getSPMetadata)
    AuthenticationController.addEndpointToLoginWhitelist('/saml/meta')
    webRouter.post('/logout', logout, UserController.logout)
  },
}
