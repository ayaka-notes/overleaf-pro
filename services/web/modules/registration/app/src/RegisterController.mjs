import Path from 'path'
import logger from '@overleaf/logger'
import UserRegistrationHandler from '../../../../app/src/Features/User/UserRegistrationHandler.mjs'


export default {
  registerPage(req, res, next) {
    // Check if the user is already logged in
    if (req.user != null) {
      return res.redirect(`/`)
    }

    // If not logged in, render the registration page
    const __dirname = Path.dirname(new URL(import.meta.url).pathname)
    res.render(Path.resolve(__dirname, '../views/user/register'))
  },

  // Deal with user registration requests via email
  // registerWithEmail(req, res, next) {
  //   const { email } = req.body
  //   if (email == null || email === '') {
  //     return res.sendStatus(422) // Unprocessable Entity
  //   }
  //   UserRegistrationHandler.registerNewUserAndSendActivationEmail(
  //     email,
  //     (error, user, setNewPasswordUrl) => {
  //       if (error != null) {
  //         return next(error)
  //       }
  //       res.json({
  //         email: user.email,
  //       })
  //     }
  //   )
  // },

  // Deal with user registration requests via username and password
  registerWithUsernameAndPassword(req, res, next) {
    const { email, password } = req.body
    if (email == null || email === '' || password == null || password === '') {
      return res.sendStatus(422) // Unprocessable Entity
    }

    const userDetails = {
      email: email,
      password: password,
    }

    UserRegistrationHandler.registerNewUser(
      userDetails,
      (error, user) => {
        if (error != null) {
          logger.debug({ err: error }, 'error registering user')
          // Sets like "Email already in use" are communicated back to the client
          return res.status(400).json({
            message: error.message,
          })
        }

        // Registration successful
        return res.json(
          {
            redir: '/login',
          }
        )
      }
    )

  }
}

