import logger from '@overleaf/logger'
import Settings from '@overleaf/settings'
import LearnProxyController from './LearnProxy.mjs'


export default {
  apply(webRouter) {
    if (!Settings.proxyLearn) {
      logger.debug({}, 'Learn proxy disabled via Settings.proxyLearn')
      return
    }

    webRouter.get('/learn', LearnProxyController.learnPage)
    webRouter.use('/learn/latex', LearnProxyController.learnPage)
  },
}