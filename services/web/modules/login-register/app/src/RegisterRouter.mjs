import logger from "@overleaf/logger"
import RegisterController from './RegisterController.mjs'
import AuthenticationController from '../../../../app/src/Features/Authentication/AuthenticationController.mjs'

import RateLimiterMiddleware from "../../../../app/src/Features/Security/RateLimiterMiddleware.mjs"
import { RateLimiter } from "../../../../app/src/infrastructure/RateLimiter.mjs"

// Limit registration attempts to 3 per minute per IP
const registrationRateLimiters = {
  postRegister: new RateLimiter('postRegister', {
    points: 3,
    duration: 60,
  }),
}

export default  {
  apply(webRouter) {
    logger.debug({}, 'Init Registration module')

    // remove default registration router if it exists
    if (process.env.OVERLEAF_ALLOW_PUBLIC_REGISTRATION === 'true' || 
      (process.env.OVERLEAF_ALLOW_PUBLIC_REGISTRATION != null && 
        process.env.OVERLEAF_ALLOW_PUBLIC_REGISTRATION.startsWith('@'))) 
    {
      webRouter.stack = webRouter.stack.filter(layer => {
        return !(layer.route && layer.route.path === '/register' && layer.route.methods.get)
      })
    }


    webRouter.get(
      '/register',
      RegisterController.registerPage
    )

    const allowedRegistrationDomain =
      process.env.OVERLEAF_ALLOW_PUBLIC_REGISTRATION

    // If set to 'true', allow registration via username and password
    // If set to an email domain (e.g., '@example.com'), allow registration via email only for that domain
    if (allowedRegistrationDomain != null && allowedRegistrationDomain == 'true') {
      webRouter.post(
        '/register',
        RateLimiterMiddleware.rateLimit(registrationRateLimiters.postRegister),
        RegisterController.registerWithUsernameAndPassword
      )
    }
    else if (allowedRegistrationDomain != null && allowedRegistrationDomain.startsWith('@')) {
      webRouter.post(
        '/register',
        RateLimiterMiddleware.rateLimit(registrationRateLimiters.postRegister),
        RegisterController.registerWithEmail
      )
    }
    AuthenticationController.addEndpointToLoginWhitelist('/register')
  },
}
