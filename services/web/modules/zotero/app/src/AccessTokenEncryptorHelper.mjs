import AccessTokenEncryptorClass from '@overleaf/access-token-encryptor'
import Settings from '@overleaf/settings'
import fs from 'node:fs'
import crypto from 'node:crypto'
import Path from 'node:path'

const CIPHER_KEY_FILE = '/var/lib/overleaf/data/.zotero-cipher-key'
const CIPHER_LABEL = '2024.1-v3'

let encryptorInstance = null

function _getStableCipherPassword() {
  if (process.env.ZOTERO_CIPHER_PASSWORD) {
    return process.env.ZOTERO_CIPHER_PASSWORD
  }
  try {
    const existing = fs.readFileSync(CIPHER_KEY_FILE, 'utf8').trim()
    if (existing.length >= 16) {
      return existing
    }
  } catch {
    // File does not exist yet. Generate one below.
  }
  const newKey = crypto.randomBytes(32).toString('base64')
  const dir = Path.dirname(CIPHER_KEY_FILE)
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(CIPHER_KEY_FILE, newKey, { mode: 0o600 })
  return newKey
}

function _getEncryptor() {
  if (!encryptorInstance) {
    const encryptorSettings =
      Settings.zotero?.encryptor || Settings.oauthProviders?.encryptor
    if (!encryptorSettings) {
      const cipherLabel = process.env.ZOTERO_CIPHER_LABEL || CIPHER_LABEL
      const cipherPassword = _getStableCipherPassword()
      encryptorInstance = new AccessTokenEncryptorClass({
        cipherLabel,
        cipherPasswords: {
          [cipherLabel]: cipherPassword,
        },
      })
    } else {
      encryptorInstance = new AccessTokenEncryptorClass(encryptorSettings)
    }
  }
  return encryptorInstance
}

export const AccessTokenEncryptor = {
  promises: {
    async encryptJson(json) {
      return await _getEncryptor().promises.encryptJson(json)
    },
    async decryptToJson(encryptedJson) {
      return await _getEncryptor().promises.decryptToJson(encryptedJson)
    },
  },
}
