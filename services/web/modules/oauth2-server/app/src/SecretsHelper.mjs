import crypto from 'crypto';

const contents = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

const SecretsHelper = {
    hashSecret(secret) {
        if (!secret) {
            throw new Error('Secret is required for hashing')
        }
        return crypto.createHash('sha256').update(secret).digest('hex')
        // return secret
    },

    // Verify a secret against a hashed secret
    verifySecret(secret, hashedSecret) {
        if (!secret || !hashedSecret) {
            return false
        }
        const hashedInput = this.hashSecret(secret)
        return crypto.timingSafeEqual(
            Buffer.from(hashedInput, 'utf-8'),
            Buffer.from(hashedSecret, 'utf-8')
        )
    },

    // Generate a random secret of specified length
    createSecret(length) {
        let secret = ''
        
        for (let i = 0; i < length; i++) {
            secret += contents.charAt(crypto.randomInt(contents.length));
        }
        return secret
    }
}

export default SecretsHelper