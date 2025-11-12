import { SecurityUtils } from '../../lib/utils/security'

describe('SecurityUtils', () => {
  test('generateSecureToken returns hex of expected length', () => {
    const token16 = SecurityUtils.generateSecureToken(16)
    expect(token16).toMatch(/^[0-9a-f]+$/)
    expect(token16.length).toBe(32) // 16 bytes -> 32 hex chars

    const token32 = SecurityUtils.generateSecureToken(32)
    expect(token32.length).toBe(64)
  })

  test('hashPassword + verifyPassword success and failure', async () => {
    const password = 'P@ssw0rd!'
    const hashed = await SecurityUtils.hashPassword(password)

    expect(hashed).toContain(':')

    const ok = await SecurityUtils.verifyPassword(password, hashed)
    expect(ok).toBe(true)

    const bad = await SecurityUtils.verifyPassword('wrong', hashed)
    expect(bad).toBe(false)
  })

  test('sanitizeHtml escapes dangerous characters', () => {
    const input = '<script>alert("x")</script>'
    const sanitized = SecurityUtils.sanitizeHtml(input)
    expect(sanitized).toBe('&lt;script&gt;alert(&quot;x&quot;)&lt;&#x2F;script&gt;')
  })

  test('generateCSRFToken returns 64-hex string', () => {
    const token = SecurityUtils.generateCSRFToken()
    expect(token).toMatch(/^[0-9a-f]{64}$/)
  })

  test('createRateLimiter enforces window limit and resets after window', () => {
    jest.useFakeTimers()
    const start = new Date('2024-01-01T00:00:00Z')
    jest.setSystemTime(start)

    const limiter = SecurityUtils.createRateLimiter(2, 50)

    // first two should pass
    expect(limiter('user-1')).toBe(true)
    expect(limiter('user-1')).toBe(true)

    // third within window should fail
    expect(limiter('user-1')).toBe(false)

    // advance the system time beyond window and try again
    jest.setSystemTime(new Date(start.getTime() + 60))
    expect(limiter('user-1')).toBe(true)

    jest.useRealTimers()
  })

  test('generateJWT + verifyJWT returns payload and rejects invalid', async () => {
    const secret = 'jwt-secret'
    const payload = { userId: 42, role: 'admin' }

    const token = SecurityUtils.generateJWT(payload, secret, '10') // 10 seconds
    const decoded = SecurityUtils.verifyJWT(token, secret)

    expect(decoded.userId).toBe(42)
    expect(decoded.role).toBe('admin')
    expect(typeof decoded.iat).toBe('number')
    expect(typeof decoded.exp).toBe('number')

    // tamper token -> invalid signature
    const tampered = token.slice(0, -1) + (token.slice(-1) === 'a' ? 'b' : 'a')
    expect(() => SecurityUtils.verifyJWT(tampered, secret)).toThrow('Invalid token')
  })

  test('verifyJWT throws when token expired', () => {
    jest.useFakeTimers()
    const start = new Date('2024-01-01T00:00:00Z')
    jest.setSystemTime(start)

    const secret = 'jwt-secret'
    const token = SecurityUtils.generateJWT({ userId: 1 }, secret, '1') // 1 second

    // advance beyond expiry
    jest.advanceTimersByTime(1100)

    expect(() => SecurityUtils.verifyJWT(token, secret)).toThrow('Invalid token')

    jest.useRealTimers()
  })
})
test('isValidIP validates IPv4, IPv6 and rejects invalid', () => {
  expect(SecurityUtils.isValidIP('127.0.0.1')).toBe(true)
  expect(SecurityUtils.isValidIP('2001:0db8:85a3:0000:0000:8a2e:0370:7334')).toBe(true)
  expect(SecurityUtils.isValidIP('999.0.0.1')).toBe(false)
})

test('generateJWT default 24h expiry branch', () => {
  const secret = 'jwt-secret'
  const payload = { userId: 7 }
  const token = SecurityUtils.generateJWT(payload, secret)
  const decoded = SecurityUtils.verifyJWT(token, secret)
  expect(decoded.userId).toBe(7)
  expect(decoded.exp - decoded.iat).toBe(24 * 60 * 60)
})
