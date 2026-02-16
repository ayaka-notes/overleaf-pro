import RegisterRouter from './app/src/RegisterRouter.mjs'
import LoginRouter from './app/src/LoginRouter.mjs'

let RegisterModule = {}

if (process.env.OVERLEAF_ALLOW_PUBLIC_REGISTRATION === 'true' || (process.env.OVERLEAF_ALLOW_PUBLIC_REGISTRATION != null && process.env.OVERLEAF_ALLOW_PUBLIC_REGISTRATION.startsWith('@'))) {
  RegisterModule = {
    router: RegisterRouter
  }
}

// merge the login router in regardless of registration being enabled, as login is still needed for existing users
RegisterModule.router = {
  ...RegisterModule.router,
  ...LoginRouter
}

export default RegisterModule