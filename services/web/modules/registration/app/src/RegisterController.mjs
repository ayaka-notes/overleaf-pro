import Path from 'path'
import logger from '@overleaf/logger'
import UserRegistrationHandler from '../../../../app/src/Features/User/UserRegistrationHandler.mjs'
import EmailHelper from '../../../../app/src/Features/Helpers/EmailHelper.mjs'


export default {
  registerPage(req, res, next) {
    // Check if the user is already logged in
    if (req.user != null) {
      return res.redirect(`/`)
    }

    const showPasswordField = process.env.OVERLEAF_ALLOW_PUBLIC_REGISTRATION === 'true'

    // If not logged in, render the registration page
    const __dirname = Path.dirname(new URL(import.meta.url).pathname)
    res.render(Path.resolve(__dirname, '../views/user/register'), {
      showPasswordField,  
    })
  },

  // Deal with user registration requests via email
  registerWithEmail(req, res, next) {
    const { email } = req.body
    if (email == null || email === '') {
      return res.sendStatus(422) // Unprocessable Entity
    }

    const domain = EmailHelper.getDomain(email)
    if (domain == null || domain !== process.env.OVERLEAF_ALLOW_PUBLIC_REGISTRATION.slice(1)) {
      return res.status(400).json({
        message: 'Email domain not allowed for registration',
      })
    }

    UserRegistrationHandler.registerNewUserAndSendActivationEmail(
      email,
      (error, user, setNewPasswordUrl) => {
        if (error != null) {
          return next(error)
        }
        return res.status(200).json({
          message: 'Registration successful. Please check your email to activate your account.',
        })
      }
    )
  },

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

