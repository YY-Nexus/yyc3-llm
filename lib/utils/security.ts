/**
 * 安全工具
 * 提供应用安全相关的功能
 */

import crypto from 'crypto'

export class SecurityUtils {
  // 生成安全的随机字符串
  static generateSecureToken(length = 32): string {
    return crypto.randomBytes(length).toString('hex')
  }

  // 哈希密码
  static async hashPassword(password: string): Promise<string> {
    const salt = crypto.randomBytes(16).toString('hex')
    const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex')
    return `${salt}:${hash}`
  }

  // 验证密码
  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    const [salt, hash] = hashedPassword.split(':')
    const verifyHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex')
    return hash === verifyHash
  }

  // 清理 XSS
  static sanitizeHtml(input: string): string {
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
  }

  // 验证 CSRF Token
  static generateCSRFToken(): string {
    return crypto.randomBytes(32).toString('hex')
  }

  // 速率限制检查
  static createRateLimiter(maxRequests: number, windowMs: number) {
    const requests = new Map<string, number[]>()

    return (identifier: string): boolean => {
      const now = Date.now()
      const userRequests = requests.get(identifier) || []
      
      // 清理过期请求
      const validRequests = userRequests.filter(time => now - time < windowMs)
      
      if (validRequests.length >= maxRequests) {
        return false
      }

      validRequests.push(now)
      requests.set(identifier, validRequests)
      return true
    }
  }

  // JWT Token 验证（增强版）
  static verifyJWT(token: string, secret: string): any {
    // 验证密钥强度
    if (!secret || secret.length < 16) {
      throw new Error('Invalid secret key: must be at least 16 characters')
    }
    
    try {
      // 验证token格式
      if (!token || !token.includes('.')) {
        throw new Error('Invalid token format')
      }
      
      const [header, payload, signature] = token.split('.')
      
      // 验证是否有三个部分
      if (!header || !payload || !signature) {
        throw new Error('Invalid token structure')
      }
      
      // 验证签名
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(`${header}.${payload}`)
        .digest('base64url')

      if (signature !== expectedSignature) {
        throw new Error('Invalid signature')
      }

      // 解析载荷
      const decodedPayload = JSON.parse(Buffer.from(payload, 'base64url').toString())
      
      // 检查过期时间
      if (decodedPayload.exp && decodedPayload.exp < Date.now() / 1000) {
        throw new Error('Token expired')
      }
      
      // 检查颁发时间（防止将来的token）
      if (decodedPayload.iat && decodedPayload.iat > Date.now() / 1000 + 30) {
        throw new Error('Token issued in future')
      }

      return decodedPayload
    } catch (error: any) {
      throw new Error(`Token verification failed: ${error.message || 'Unknown error'}`)
    }
  }

  // 生成 JWT Token（增强版）
  static generateJWT(payload: any, secret: string, expiresIn = '24h'): string {
    // 验证密钥强度
    if (!secret || secret.length < 16) {
      throw new Error('Invalid secret key: must be at least 16 characters')
    }
    
    const header = {
      alg: 'HS256',
      typ: 'JWT'
    }

    const now = Math.floor(Date.now() / 1000)
    
    // 安全处理过期时间
    let exp: number
    if (expiresIn === '24h') {
      exp = now + 24 * 60 * 60 // 24小时
    } else {
      // 解析数值过期时间（秒）
      const expSeconds = parseInt(expiresIn)
      if (isNaN(expSeconds) || expSeconds <= 0) {
        throw new Error('Invalid expiresIn value')
      }
      // 限制最大过期时间为7天
      exp = now + Math.min(expSeconds, 7 * 24 * 60 * 60)
    }

    // 确保不覆盖关键字段
    const jwtPayload = {
      ...payload,
      iat: now,
      exp: exp,
      // 添加jti (JWT ID)防止重放攻击
      jti: this.generateSecureToken(16)
    }

    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url')
    const encodedPayload = Buffer.from(JSON.stringify(jwtPayload)).toString('base64url')
    
    const signature = crypto
      .createHmac('sha256', secret)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64url')

    return `${encodedHeader}.${encodedPayload}.${signature}`
  }

  // IP 地址验证
  static isValidIP(ip: string): boolean {
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/
    return ipv4Regex.test(ip) || ipv6Regex.test(ip)
  }
}
