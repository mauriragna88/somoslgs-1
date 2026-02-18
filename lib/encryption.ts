import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12
const AUTH_TAG_LENGTH = 16

function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY
  if (!key || key.length !== 64) {
    throw new Error(
      'ENCRYPTION_KEY must be set as a 64-character hex string (32 bytes). Generate with: openssl rand -hex 32'
    )
  }
  return Buffer.from(key, 'hex')
}

/**
 * Encrypt plaintext using AES-256-GCM
 * @returns `iv:authTag:ciphertext` (all hex-encoded)
 */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey()
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)

  let encrypted = cipher.update(plaintext, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  const authTag = cipher.getAuthTag()

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
}

/**
 * Decrypt an `iv:authTag:ciphertext` string produced by encrypt()
 */
export function decrypt(encrypted: string): string {
  const key = getEncryptionKey()
  const [ivHex, authTagHex, ciphertext] = encrypted.split(':')

  if (!ivHex || !authTagHex || !ciphertext) {
    throw new Error('Invalid encrypted value format. Expected iv:authTag:ciphertext')
  }

  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')
  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(ciphertext, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}

/**
 * Encrypt a value only if it's a non-empty string.
 * Returns null if the value is null/undefined/empty.
 */
export function encryptIfPresent(value: string | null | undefined): string | null {
  if (!value || value.trim() === '') return null
  return encrypt(value)
}

/**
 * Decrypt a value only if it's a non-empty string.
 * Returns null if the value is null/undefined/empty.
 */
export function decryptIfPresent(value: string | null | undefined): string | null {
  if (!value || value.trim() === '') return null
  return decrypt(value)
}

/**
 * Check if a value looks like it's already encrypted (iv:authTag:ciphertext format)
 */
export function isEncrypted(value: string): boolean {
  const parts = value.split(':')
  if (parts.length !== 3) return false
  // IV = 12 bytes = 24 hex chars, AuthTag = 16 bytes = 32 hex chars
  return parts[0].length === 24 && parts[1].length === 32 && parts[2].length > 0
}
