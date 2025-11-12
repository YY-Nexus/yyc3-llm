import { serviceRegistry } from '../../../lib/microservices/service-registry'

// Mock global fetch for health checks
const originalFetch = global.fetch

describe('ServiceRegistry health, discovery, and pruning', () => {
  beforeEach(() => {
    // reset fetch mock
    global.fetch = jest.fn()

    // clear existing services in singleton
    const all = serviceRegistry.getAllServices()
    for (const [name, instances] of all.entries()) {
      for (const inst of instances) {
        serviceRegistry.deregisterService(inst.id)
      }
    }
  })

  afterEach(() => {
    jest.clearAllTimers()
    jest.useRealTimers()
  })

  afterAll(() => {
    global.fetch = originalFetch as any
  })

  test('register without healthCheckUrl marks instance healthy and discover succeeds', () => {
    const id = serviceRegistry.registerService({
      name: 'user-service',
      version: '1.0.0',
      host: '127.0.0.1',
      port: 8081,
      protocol: 'http',
      // no healthCheckUrl -> healthy by default
    })

    const services = serviceRegistry.getAllServices()
    const instances = services.get('user-service')!
    expect(instances.length).toBe(1)
    expect(instances[0].id).toBe(id)
    expect(instances[0].status).toBe('healthy')

    const discovered = serviceRegistry.discoverService('user-service')
    expect(discovered).not.toBeNull()
    expect(discovered!.id).toBe(id)
  })

  test('consecutive health check failures transition instance to unhealthy', async () => {
    jest.useFakeTimers()
    ;(global.fetch as jest.Mock).mockRejectedValue(new Error('down'))

    serviceRegistry.registerService({
      name: 'search-service',
      version: '1.0.0',
      host: '127.0.0.1',
      port: 8082,
      protocol: 'http',
      healthCheckUrl: 'http://127.0.0.1:8082/health',
    })

    // advance timers to trigger 3 consecutive failed checks (threshold = 3)
    jest.advanceTimersByTime(30000) // first scheduled check
    await Promise.resolve()
    jest.advanceTimersByTime(30000) // second
    await Promise.resolve()
    jest.advanceTimersByTime(30000) // third
    await Promise.resolve()

    const health = serviceRegistry.getServiceHealth('search-service')
    expect(health.totalInstances).toBe(1)
    expect(health.unhealthyInstances).toBe(1)
    expect(health.status).toBe('unavailable')

    const discovered = serviceRegistry.discoverService('search-service')
    expect(discovered).toBeNull()
  })

  test('round-robin selects alternating healthy instances', () => {
    // register two instances without health check -> healthy
    const id1 = serviceRegistry.registerService({
      name: 'auth-service',
      version: '1.0.0',
      host: 'svc.local',
      port: 9001,
      protocol: 'http',
    })
    const id2 = serviceRegistry.registerService({
      name: 'auth-service',
      version: '1.0.0',
      host: 'svc.local',
      port: 9002,
      protocol: 'http',
    })

    const s1 = serviceRegistry.discoverService('auth-service')!
    const s2 = serviceRegistry.discoverService('auth-service')!
    const s3 = serviceRegistry.discoverService('auth-service')!
    const s4 = serviceRegistry.discoverService('auth-service')!

    expect([s1.id, s2.id, s3.id, s4.id]).toEqual([id1, id2, id1, id2])
  })

  test('cleanupExpiredInstances removes instances with stale heartbeat', () => {
    jest.useFakeTimers()

    const id = serviceRegistry.registerService({
      name: 'report-service',
      version: '1.0.0',
      host: '127.0.0.1',
      port: 8070,
      protocol: 'http',
    })

    // set lastHeartbeat to 10 minutes ago to exceed 5min threshold
    const all = serviceRegistry.getAllServices()
    const inst = all.get('report-service')![0]
    inst.lastHeartbeat = Date.now() - 10 * 60 * 1000

    // directly invoke private cleanup to avoid timer flakiness
    ;(serviceRegistry as any).cleanupExpiredInstances()

    const after = serviceRegistry.getAllServices()
    const remain = after.get('report-service') || []
    expect(remain.length).toBe(0)

    // ensure deregisterService on stale ID returns false (already removed)
    expect(serviceRegistry.deregisterService(id)).toBe(false)
  })

  // 新增：加权轮询、最少连接和随机策略的覆盖
  test('weighted-round-robin favors heavier weight', () => {
    const idLight = serviceRegistry.registerService({
      name: 'lb-service',
      version: '1.0.0',
      host: 'svc.local',
      port: 9101,
      protocol: 'http',
      weight: 10,
    })
    const idHeavy = serviceRegistry.registerService({
      name: 'lb-service',
      version: '1.0.0',
      host: 'svc.local',
      port: 9102,
      protocol: 'http',
      weight: 90,
    })

    // 切换策略到加权轮询
    serviceRegistry.setLoadBalancingStrategy('weighted-round-robin')

    let heavyCount = 0
    let lightCount = 0
    for (let i = 0; i < 200; i++) {
      const picked = serviceRegistry.discoverService('lb-service')!
      if (picked.id === idHeavy) heavyCount++
      if (picked.id === idLight) lightCount++
    }

    // 统计上重权应显著更多（避免随机波动，要求至少2倍）
    expect(heavyCount).toBeGreaterThan(lightCount * 2)
  })

  test('least-connections chooses instance with fewer active connections', () => {
    const idA = serviceRegistry.registerService({
      name: 'conn-service',
      version: '1.0.0',
      host: 'svc.local',
      port: 9201,
      protocol: 'http',
    })
    const idB = serviceRegistry.registerService({
      name: 'conn-service',
      version: '1.0.0',
      host: 'svc.local',
      port: 9202,
      protocol: 'http',
    })

    // 更新连接数元数据
    serviceRegistry.updateServiceMetadata(idA, { connections: 100 })
    serviceRegistry.updateServiceMetadata(idB, { connections: 5 })

    // 切换策略到最少连接
    serviceRegistry.setLoadBalancingStrategy('least-connections')

    const picked = serviceRegistry.discoverService('conn-service')!
    expect(picked.id).toBe(idB)
  })

  test('random strategy yields varying instances across calls', () => {
    const ids: string[] = []
    ids.push(
      serviceRegistry.registerService({ name: 'rand-service', version: '1.0.0', host: 'svc.local', port: 9301, protocol: 'http' }),
    )
    ids.push(
      serviceRegistry.registerService({ name: 'rand-service', version: '1.0.0', host: 'svc.local', port: 9302, protocol: 'http' }),
    )
    ids.push(
      serviceRegistry.registerService({ name: 'rand-service', version: '1.0.0', host: 'svc.local', port: 9303, protocol: 'http' }),
    )

    serviceRegistry.setLoadBalancingStrategy('random')

    const seen = new Set<string>()
    for (let i = 0; i < 30; i++) {
      const picked = serviceRegistry.discoverService('rand-service')
      if (picked) seen.add(picked.id)
    }

    // 随机策略应至少出现多个不同实例
    expect(seen.size).toBeGreaterThanOrEqual(2)
  })
})