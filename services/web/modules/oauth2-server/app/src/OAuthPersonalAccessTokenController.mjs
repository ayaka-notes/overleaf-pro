import OAuthPersonalAccessTokenManager from './OAuthPersonalAccessTokenManager.mjs'
import SessionManager from '../../../../app/src/Features/Authentication/SessionManager.mjs'
import logger from '@overleaf/logger'

const MAX_PAT_COUNT = 10

const PersonalAccessTokenController = {
    // Retrieve user's personal access tokens
    // GET: /oauth/personal-access-tokens
    async getUserPersonalAccessTokens(req, res, next){
        const user = SessionManager.getSessionUser(req.session)
        if (!user) {
            return res.status(401).json({ message: 'Unauthorized' })
        }

        const userId = user._id
        let personalAccessTokens = await OAuthPersonalAccessTokenManager.listTokens(
            userId
        )
        return res.json(personalAccessTokens)
    },

    // Create a new personal access token
    // POST: /oauth/personal-access-tokens
    // {"accessToken":"olp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"}
    async createPersonalAccessToken(req, res, next){
        const user = SessionManager.getSessionUser(req.session)
        if (!user) {
            return res.status(401).json({ message: 'Unauthorized' })
        }

        // Check if user has reached max PAT count
        const num = await OAuthPersonalAccessTokenManager.getUserTokenNums(user._id)
        if (num >= MAX_PAT_COUNT) {
            return res.status(400).json({ message: 'Personal access token count limit reached' })
        }

        const userId = user._id
        let accessToken = await OAuthPersonalAccessTokenManager.createToken(userId)
        return res.json({
            accessToken: accessToken
        })
    },

    // deletePersonalAccessToken
    // Delete a personal access token
    // DELETE: /oauth/personal-access-tokens/{token_id}
    async deletePersonalAccessToken(req, res, next){
        const user = SessionManager.getSessionUser(req.session)
        if (!user) {
            return res.status(401).json({ message: 'Unauthorized' })
        }

        const tokenId = req.params.token_id
        if (!tokenId) {
            return res.status(400).json({ message: 'Token id is required' })
        }

        await OAuthPersonalAccessTokenManager.removeToken(tokenId)

        return res.json({ 
            message: 'Token deleted',
        })
    },

    // Verify a personal access token
    // Check if the token is valid
    // 
    async checkPersonalAccessToken(req, res, next) {
        // Parse bearer token from req
        let token = req.headers['authorization'];
        if (!token) {
            return res.status(401).json({
                error: 'Unauthorized',
                error_description: 'Unauthorized request: no authentication given'
            })
        }

        // Get token information
        if (token.startsWith('Bearer ')) {
            token = token.slice(7);
        } else {
            return res.status(401).json({
                error: 'Unauthorized',
                error_description: 'Unauthorized request: no legal authentication given'
            })
        }

        let tokenInstance = await OAuthPersonalAccessTokenManager.verifyToken(token)

        if (!tokenInstance) {
            logger.debug({}, 'Personal access token is invalid for NULL')
            return res.status(401).json({
                error: 'Unauthorized',
                error_description: 'Unauthorized request: invalid token'
            })
        }

        // Return token info
        logger.debug({ tokenInstance }, 'Personal access token valid')

        return res.json({
            accessToken: tokenInstance.accessToken,
            accessTokenExpiresAt: tokenInstance.accessTokenExpiresAt,
            scope: tokenInstance.scope
        })
    },


}

export default PersonalAccessTokenController