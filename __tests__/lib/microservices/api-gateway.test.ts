import { apiGateway } from '../../../lib/microservices/api-gateway'
import { serviceRegistry } from '../../../lib/microservices/service-registry'
import { SecurityUtils } from '../../../lib/utils/security'

// Helper to build a mock fetch Response-like object
function makeResponse({ status = 200, body = '', headers = {} as Record<string, string> }) {
  return {
    status,
    headers: new Map(Object.entries(headers)),
    text: async () => body,
  } as any
}

describe('APIGateway forwarding and circuit breaker', () => {
  const origFetch = global.fetch as any

  beforeEach(() => {
    jest.restoreAllMocks()
    ;(global as any).fetch = jest.fn()
  })

  afterAll(() => {
    ;(global as any).fetch = origFetch
  })

  test('routes to service and forwards request successfully (JSON body parse)', async () => {
    const spyDiscover = jest
      .spyOn(serviceRegistry, 'discoverService')
      .mockReturnValue({ protocol: 'http', host: 'svc.local', port: 8080 } as any)

    ;(global.fetch as jest.Mock).mockResolvedValue(
      makeResponse({ status: 201, body: JSON.stringify({ ok: true }), headers: { 'content-type': 'application/json' } })
    )

    const res = await apiGateway.handleRequest({
      method: 'POST',
      path: '/api/auth/login', // 跳过认证的路径
      headers: { host: 'gateway.local' },
      body: { username: 'a', password: 'b' },
    })

    expect(spyDiscover).toHaveBeenCalledWith('auth-service')
    // 注意：stripPath=true会去除"/api/auth/"前缀，当前实现不保留斜杠
    expect(global.fetch).toHaveBeenCalledWith('http://svc.local:8080/login', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ username: 'a', password: 'b' }),
    }))
    expect(res.status).toBe(201)
    expect(res.body).toEqual({ ok: true })
    expect(res.headers['content-type']).toBe('application/json')
  })

  test('returns 404 when route not found', async () => {
    const res = await apiGateway.handleRequest({
      method: 'GET',
      path: '/api/health/unknown', // 认证跳过，但路由不存在
      headers: {},
    })
    expect(res.status).toBe(404)
    expect(res.body).toEqual({ error: '路由未找到' })
  })

  test('returns 503 when service discovery fails', async () => {
    jest.spyOn(serviceRegistry, 'discoverService').mockReturnValue(null)

    // 新增一个在 /api/health/* 下的路由以跳过认证
    apiGateway.addRoute({
      path: '/api/health/*',
      serviceName: 'missing-service',
      methods: ['GET'],
      stripPath: true,
      preserveHost: false,
      timeout: 1000,
    })

    const res = await apiGateway.handleRequest({
      method: 'GET',
      path: '/api/health/ping',
      headers: {},
    })

    expect(res.status).toBe(503)
    expect(res.body).toEqual({ error: '服务不可用' })
  })

  test('circuit breaker opens after a failure and blocks subsequent requests', async () => {
    // 清理前一个 /api/health/* 路由，避免匹配遮蔽
    apiGateway.removeRoute('/api/health/*')

    // 在 /api/health/cb 路径下添加带熔断器的路由，认证跳过
    apiGateway.addRoute({
      path: '/api/health/cb',
      serviceName: 'cb-service',
      methods: ['GET'],
      stripPath: true,
      preserveHost: false,
      timeout: 1000,
      circuitBreaker: { failureThreshold: 1, timeout: 1000, resetTimeout: 60000 },
    })

    jest
      .spyOn(serviceRegistry, 'discoverService')
      .mockReturnValue({ protocol: 'http', host: 'ai.local', port: 9000 } as any)

    // 第一次请求：模拟网络失败，触发recordFailure()
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('network down'))
    const res1 = await apiGateway.handleRequest({
      method: 'GET',
      path: '/api/health/cb',
      headers: {},
    })
    expect(res1.status).toBe(502)
    expect(res1.body).toEqual({ error: '网关错误' })

    // 第二次请求：熔断器应处于open，直接返回503，且不调用fetch
    const res2 = await apiGateway.handleRequest({
      method: 'GET',
      path: '/api/health/cb',
      headers: {},
    })
    expect(res2.status).toBe(503)
    expect(res2.body).toEqual({ error: '服务熔断中' })
    expect(global.fetch).toHaveBeenCalledTimes(1)
  })

  test('timeout abort triggers 502 and failure recording', async () => {
    jest
      .spyOn(serviceRegistry, 'discoverService')
      .mockReturnValue({ protocol: 'http', host: 'svc.local', port: 8080 } as any)

    // 模拟因AbortController超时导致的fetch拒绝
    const abortErr = new Error('aborted')
    ;(abortErr as any).name = 'AbortError'
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(abortErr)

    const res = await apiGateway.handleRequest({
      method: 'POST',
      path: '/api/auth/login', // 跳过认证
      headers: {},
      body: { a: 1 },
    })

    expect(res.status).toBe(502)
    expect(res.body).toEqual({ error: '网关错误' })
  })

  test('non-JSON response body is returned as text', async () => {
    jest
      .spyOn(serviceRegistry, 'discoverService')
      .mockReturnValue({ protocol: 'http', host: 'svc.local', port: 8080 } as any)

    ;(global.fetch as jest.Mock).mockResolvedValue(
      makeResponse({ status: 200, body: 'plain-text', headers: { 'x-test': '1' } })
    )

    const res = await apiGateway.handleRequest({
      method: 'GET',
      path: '/api/auth/login',
      headers: {},
    })

    expect(res.status).toBe(200)
    expect(res.body).toBe('plain-text')
    expect(res.headers['x-test']).toBe('1')
  })
})