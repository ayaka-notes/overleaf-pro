// import { db } from '../../../../app/src/infrastructure/mongodb.js'
// import { OauthAccessToken } from '../../../../app/src/models/OauthAccessToken.js'

// const TokenManager = {
//     async verifyToken(accessToken) {
//         let query = {
//             accessToken: accessToken
//         }
//         let token = await db.oauthAccessTokens.findOne(query)
//         if (!token) {
//             return null
//         }

//         // New access token instance
//         let tokenInstance = new OauthAccessToken(token)
        
//         // Check if the token is expired
//         let now = new Date()
//         if (tokenInstance.accessTokenExpiresAt < now) {
//             return null
//         }

//         // Update lastUsedAt
//         tokenInstance.lastUsedAt = now

//         // Update database
//         await db.oauthAccessTokens.updateOne({ _id: tokenInstance._id }, { $set: { lastUsedAt: now } })
        
//         return tokenInstance
//     }
// }

// export default TokenManager