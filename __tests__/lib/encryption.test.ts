import { EncryptionUtils } from '../../lib/utils/encryption'

describe('EncryptionUtils', () => {
  test('encrypt + decrypt round trip', () => {
    const secret = 'super-secret-key'
    const data = 'hello, 世界 🌟 with symbols !@#$%^&*()'

    const encrypted = EncryptionUtils.encrypt(data, secret)
    expect(typeof encrypted).toBe('string')
    expect(encrypted).not.toEqual(data)

    const decrypted = EncryptionUtils.decrypt(encrypted, secret)
    expect(decrypted).toEqual(data)
  })

  test('decrypt with wrong secret throws', () => {
    const data = 'sensitive content'
    const encrypted = EncryptionUtils.encrypt(data, 'secret-1')

    expect(() => EncryptionUtils.decrypt(encrypted, 'secret-2')).toThrow('Failed to decrypt data')
  })

  test('hash produces 64-hex and verifyIntegrity works', () => {
    const msg = 'abc123'
    const hash = EncryptionUtils.hash(msg)

    expect(hash).toMatch(/^[0-9a-f]{64}$/)
    expect(EncryptionUtils.verifyIntegrity(msg, hash)).toBe(true)
    expect(EncryptionUtils.verifyIntegrity(msg + 'x', hash)).toBe(false)
  })

  test('generateKey is deterministic for same password and salt', () => {
    const salt = Buffer.alloc(16, 1) // fixed salt for determinism
    const key1 = EncryptionUtils.generateKey('password', salt)
    const key2 = EncryptionUtils.generateKey('password', salt)

    expect(key1.equals(key2)).toBe(true)
    expect(key1.length).toBe(32)
  })

  test('secureCompare returns true for equal strings and false otherwise', () => {
    expect(EncryptionUtils.secureCompare('abc', 'abc')).toBe(true)
    expect(EncryptionUtils.secureCompare('abc', 'abd')).toBe(false)
  })

  test('generateRandomKey returns 64-hex string', () => {
    const key = EncryptionUtils.generateRandomKey()
    expect(key).toMatch(/^[0-9a-f]{64}$/)
  })
})