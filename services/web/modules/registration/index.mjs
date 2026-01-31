import RegisterRouter from './app/src/RegisterRouter.mjs'
let RegisterModule = {}

if (process.env.OVERLEAF_ALLOW_PUBLIC_REGISTRATION === 'true') {
  RegisterModule = {
    router: RegisterRouter
  }
}

export default RegisterModule