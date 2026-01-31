import Settings from '@overleaf/settings'
import AdminAuthorizationHelper from '../../../../app/src/Features/Helpers/AdminAuthorizationHelper.mjs'
import HttpErrorHandler from '../../../../app/src/Features/Errors/HttpErrorHandler.mjs'

const { hasAdminAccess } = AdminAuthorizationHelper

// Middleware to ensure the user can manage templates
async function ensureUserCanManageTemplates(req, res, next) {
  const user = SessionManager.getSessionUser(req.session)
  const userId = SessionManager.getLoggedInUserId(req.session)
  const isAdminOrTemplateOwner = hasAdminAccess(user) || Settings.templates?.user_id === userId

  if (isAdminOrTemplateOwner) {
    return next()
  }
  
  HttpErrorHandler.forbidden(req, res)
}

export default {
  ensureUserCanManageTemplates,
}