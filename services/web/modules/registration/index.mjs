import RegisterRouter from './app/src/RegisterRouter.mjs'
let RegisterModule = {}

if (process.env.OVERLEAF_ALLOW_PUBLIC_REGISTRATION === 'true' || (process.env.OVERLEAF_ALLOW_PUBLIC_REGISTRATION != null && process.env.OVERLEAF_ALLOW_PUBLIC_REGISTRATION.startsWith('@'))) {
  RegisterModule = {
    router: RegisterRouter
  }
}

export default RegisterModule