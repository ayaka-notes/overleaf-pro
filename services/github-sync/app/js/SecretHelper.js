import AccessTokenEncryptor from '@overleaf/access-token-encryptor'
import logger from '@overleaf/logger'

const accessTokenEncryptor = new AccessTokenEncryptor({
  cipherPasswords: {
    [process.env.CIPHER_LABEL || "2042.1-v3"]: process.env.CIPHER_PASSWORD, 
  },
  cipherLabel: process.env.CIPHER_LABEL || "2042.1-v3",
})

const SecretsHelper = {
  async encryptAccessToken(accessToken) {
    let tokenEncrypted = ""
    try {
      tokenEncrypted = await accessTokenEncryptor.promises.encryptJson(accessToken)
    } catch (err) {
      logger.error({ err }, 'Error encrypting GitHub access token')
      return "" // Return empty string on encryption failure
    }
    return tokenEncrypted
  },

  async decryptAccessToken(tokenEncrypted) {
    let tokenDecrypted = ""
    try {
      tokenDecrypted = await accessTokenEncryptor.promises.decryptToJson(tokenEncrypted)
    } catch (err) {
      logger.error({ err }, 'Error decrypting GitHub access token')
      return "" // Return empty string on decryption failure
    }
    return tokenDecrypted
  }
}

export default SecretsHelper