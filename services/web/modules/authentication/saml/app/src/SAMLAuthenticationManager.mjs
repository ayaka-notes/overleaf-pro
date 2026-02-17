import Settings from '@overleaf/settings'
import UserCreator from '../../../../../app/src/Features/User/UserCreator.mjs'
import { ParallelLoginError } from '../../../../../app/src/Features/Authentication/AuthenticationErrors.mjs'
import SAMLIdentityManager from '../../../../../app/src/Features/User/SAMLIdentityManager.mjs'
import { User } from '../../../../../app/src/models/User.mjs'

const SAMLAuthenticationManager = {
  async findOrCreateUser(profile, auditLog) {
    const {
      attUserId,
      attEmail,
      attFirstName,
      attLastName,
      attAdmin,
      valAdmin,
      updateUserDetailsOnLogin,
    } = Settings.saml
    const externalUserId = profile[attUserId]
    const email = Array.isArray(profile[attEmail])
                    ? profile[attEmail][0].toLowerCase()
                    : profile[attEmail].toLowerCase()
    const firstName = attFirstName ? profile[attFirstName] : ""
    const lastName  = attLastName  ? profile[attLastName] : email
    let isAdmin = false
    if (attAdmin && valAdmin) {
      isAdmin = (Array.isArray(profile[attAdmin]) ? profile[attAdmin].includes(valAdmin) :
                                                    profile[attAdmin] === valAdmin)
    }
    const providerId = '1' // for now, only one fixed IdP is supported
// We search for a SAML user, and if none is found, we search for a user with the given email. If a user is found,
// we update the user to be a SAML user, otherwise, we create a new SAML user with the given email. In the case of
// multiple SAML IdPs, one would have to do something similar, or possibly report an error like
// 'the email is associated with the wrong IdP'
    let user = await SAMLIdentityManager.getUser(providerId, externalUserId, attUserId)
    if (!user) {
      user = await User.findOne({ 'email': email }).exec()
      if (!user) {
        user = await UserCreator.promises.createNewUser(
          {
            email: email,
            first_name: firstName,
            last_name: lastName,
            isAdmin: isAdmin,
            holdingAccount: false,
            samlIdentifiers: [{ providerId: providerId }],
          }
        )
      }
      // cannot use SAMLIdentityManager.linkAccounts because affilations service is not there
      await User.updateOne(
        { _id: user._id },
        {
          $set : {
           'emails.0.confirmedAt': Date.now(), //email of saml user is confirmed
           'emails.0.samlProviderId': providerId,
           'samlIdentifiers.0.providerId': providerId,
           'samlIdentifiers.0.externalUserId': externalUserId,
           'samlIdentifiers.0.userIdAttribute': attUserId,
          },
        }
      ).exec()
    }
    let userDetails = updateUserDetailsOnLogin ? { first_name : firstName, last_name: lastName } : {}
    if (attAdmin && valAdmin) {
      user.isAdmin = isAdmin
      userDetails.isAdmin = isAdmin
    }
    const result = await User.updateOne(
      { _id: user._id, loginEpoch: user.loginEpoch },
      {
        $inc: { loginEpoch: 1 },
        $set: userDetails,
        $unset: { hashedPassword: "" },
      },
    ).exec()
    if (result.modifiedCount !== 1) {
      throw new ParallelLoginError()
    }
    return user
  },
}

export default {
  promises: SAMLAuthenticationManager,
}
