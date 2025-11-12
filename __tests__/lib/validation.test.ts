import { z } from 'zod'
import { Validator, envSchema, userRegistrationSchema, projectCreateSchema } from '../../lib/utils/validation'

describe('lib/utils/validation', () => {
  const originalEnv = { ...process.env }

  afterEach(() => {
    process.env = { ...originalEnv }
    jest.restoreAllMocks()
  })

  test('validateEnv succeeds with minimal required envs', () => {
    process.env.NEXT_PUBLIC_OLLAMA_URL = 'http://localhost:11434'
    ;(process.env as any).NODE_ENV = 'test'
    process.env.NEXT_PUBLIC_APP_NAME = 'YanYu'
    process.env.NEXT_PUBLIC_APP_VERSION = '1.0.0'
    process.env.NEXT_PUBLIC_API_BASE_URL = 'http://localhost:3001/api'

    const result = Validator.validateEnv()
    expect(result.NEXT_PUBLIC_OLLAMA_URL).toBe('http://localhost:11434')
    expect(result.NODE_ENV).toBe('test')
  })

  test('validateEnv throws with invalid URL and logs error', () => {
    process.env.NEXT_PUBLIC_OLLAMA_URL = 'http://localhost:11434'
    ;(process.env as any).NODE_ENV = 'test'
    process.env.NEXT_PUBLIC_APP_NAME = 'YanYu'
    process.env.NEXT_PUBLIC_APP_VERSION = '1.0.0'
    process.env.NEXT_PUBLIC_API_BASE_URL = 'not-a-url'

    const spy = jest.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => Validator.validateEnv()).toThrowError('环境变量配置不正确')
    expect(spy).toHaveBeenCalled()
  })

  test('validateInput passes valid user registration', () => {
    const valid = {
      email: 'user@example.com',
      password: '12345678',
      name: '张三',
      terms: true,
    }
    const parsed = Validator.validateInput(userRegistrationSchema, valid)
    expect(parsed.email).toBe('user@example.com')
  })

  test('validateInput throws with aggregated messages', () => {
    const invalid = {
      email: 'invalid-email',
      password: '123',
      name: 'A',
      terms: false,
    }
    try {
      Validator.validateInput(userRegistrationSchema, invalid)
      throw new Error('should have thrown')
    } catch (err: any) {
      expect(err.message).toMatch('输入验证失败')
      expect(err.message).toMatch('请输入有效的邮箱地址')
      expect(err.message).toMatch('密码至少需要8个字符')
      expect(err.message).toMatch('姓名至少需要2个字符')
      expect(err.message).toMatch('请同意服务条款')
    }
  })

  test('isValidUrl validates URL format', () => {
    expect(Validator.isValidUrl('https://example.com/path')).toBe(true)
    expect(Validator.isValidUrl('not-a-url')).toBe(false)
  })

  test('sanitizeString trims and strips angle brackets', () => {
    expect(Validator.sanitizeString('  <script>bad</script>  ')).toBe('scriptbad/script')
    expect(Validator.sanitizeString('\n  <bad>value</bad>  ')).toBe('badvalue/bad')
  })

  test('projectCreateSchema minimal valid project', () => {
    const data = { name: '项目A', type: 'web' }
    const parsed = Validator.validateInput(projectCreateSchema, data)
    expect(parsed.type).toBe('web')
  })

  test('envSchema shape includes optional API keys', () => {
    const schema = envSchema
    // optional keys exist and are optional
    const parsed = schema.parse({
      NEXT_PUBLIC_OLLAMA_URL: 'http://localhost:11434',
      NODE_ENV: 'development',
      NEXT_PUBLIC_APP_NAME: 'YanYu',
      NEXT_PUBLIC_APP_VERSION: '1.0.0',
      NEXT_PUBLIC_API_BASE_URL: 'http://localhost:3001/api',
    })
    expect(parsed.NODE_ENV).toBe('development')
    expect(parsed.OPENAI_API_KEY).toBeUndefined()
  })
})