import logger from '@overleaf/logger'
import RateLimiterMiddleware from '../../../../../app/src/Features/Security/RateLimiterMiddleware.mjs'
import CaptchaMiddleware from '../../../../../app/src/Features/Captcha/CaptchaMiddleware.mjs'
import { overleafLoginRateLimiter } from '../../../../../app/src/infrastructure/RateLimiter.mjs'
import LDAPAuthenticationController from './LDAPAuthenticationController.mjs'

export default {
  apply(webRouter) {
    logger.debug({}, 'Init LDAP router')
    webRouter.post('/ldap/login',
      RateLimiterMiddleware.rateLimit(overleafLoginRateLimiter), // rate limit IP (20 / 60s)
      RateLimiterMiddleware.loginRateLimitEmail('login'), // rate limit email (10 / 120s)
      CaptchaMiddleware.validateCaptcha('login'),
      LDAPAuthenticationController.passportLogin,
    )
  },
}
