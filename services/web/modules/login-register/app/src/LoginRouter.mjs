import logger from '@overleaf/logger'
import AuthenticationController from '../../../../app/src/Features/Authentication/AuthenticationController.mjs'
import LoginController from "./LoginController.mjs"
import Settings from "@overleaf/settings"

export default  {
  apply(webRouter) {
    logger.debug({}, 'Init Login module')

    // remove default login router
    webRouter.stack = webRouter.stack.filter(layer => {
      return !(layer.route && layer.route.path === '/login' && layer.route.methods.get)
    })

    webRouter.get('/login', LoginController.loginPage)
    AuthenticationController.addEndpointToLoginWhitelist('/login')

    if (Settings.ldap && Settings.ldap.enable) {
      webRouter.get('/ldap/login', LoginController.ldapLoginPage)
      AuthenticationController.addEndpointToLoginWhitelist('/ldap/login')
    }
  },
}
