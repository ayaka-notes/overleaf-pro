import OAuth2Server from '@node-oauth/oauth2-server'
import OAuth2Model from './OAuth2Model.js'

const { Request, Response } = OAuth2Server

/**
 * OAuth2 Server configuration
 */
const serverOptions = {
  model: OAuth2Model,
  accessTokenLifetime: 60 * 60 * 24 * 365, // 1 year for personal access tokens
  refreshTokenLifetime: 60 * 60 * 24 * 365 * 2, // 2 years
  allowBearerTokensInQueryString: true,
  allowExtendedTokenAttributes: true,
}

const server = new OAuth2Server(serverOptions)

/**
 * Export the OAuth2Server components
 */
export default {
  Request,
  Response,
  server,
  OAuth2Server,
}