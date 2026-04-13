import AuthenticationController from '../../../../app/src/Features/Authentication/AuthenticationController.mjs'
import ZoteroController from './ZoteroController.mjs'

export default {
  apply(webRouter) {
    webRouter.get(
      '/zotero/groups',
      AuthenticationController.requireLogin(),
      ZoteroController.getGroups
    )

    webRouter.post(
      '/zotero/link',
      AuthenticationController.requireLogin(),
      ZoteroController.link
    )

    webRouter.post(
      '/zotero/unlink',
      AuthenticationController.requireLogin(),
      ZoteroController.unlink
    )
  },
}
