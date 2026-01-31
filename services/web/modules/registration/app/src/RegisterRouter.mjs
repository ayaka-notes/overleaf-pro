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

    webRouter.get(
      '/register',
      RegisterController.registerPage
    )

    webRouter.post(
      '/register',
      RateLimiterMiddleware.rateLimit(registrationRateLimiters.postRegister),
      RegisterController.registerWithUsernameAndPassword
    )

    AuthenticationController.addEndpointToLoginWhitelist('/register')
  },
}
