// import TokenManager from "./TokenManager.js";

// const TokenController = {
//     checkOAuthToken(req, res, next) {
//         // Parse bearer token from req
//         let token = req.headers['authorization'];
//         if (!token) {
//             return res.status(401).json({
//                 error: 'Unauthorized',
//                 error_description: 'Unauthorized request: no authentication given'
//             })
//         }

//         // Get token information
//         if (token.startsWith('Bearer ')) {
//             token = token.slice(7);
//         } else {
//             return res.status(401).json({
//                 error: 'Unauthorized',
//                 error_description: 'Unauthorized request: no legal authentication given'
//             })
//         }

//         // Check if the token is valid
//         TokenManager.verifyToken(token).then((tokenInstance) => {
//             if (!tokenInstance) {
//                 return res.status(401).json({
//                     error: 'Unauthorized',
//                     error_description: 'Unauthorized request: invalid token'
//                 })
//             }

//             // Return token info
//             return res.json({
//                 accessToken: tokenInstance.accessToken,
//                 accessTokenExpiresAt: tokenInstance.accessTokenExpiresAt,
//                 scope: tokenInstance.scope
//             })
//         })
//     },
// }

// export default TokenController