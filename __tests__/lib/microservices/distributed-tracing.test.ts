jest.mock('../../../lib/microservices/distributed-tracing', () => jest.requireActual('../../../lib/microservices/distributed-tracing'))

const tracingModule = require('../../../lib/microservices/distributed-tracing')

describe('DistributedTracing trace lifecycle and context', () => {
  const dt = tracingModule.distributedTracing

  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {})
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => {
    ;(console.log as jest.Mock).mockRestore()
    ;(console.error as jest.Mock).mockRestore()
  })

  test('startTrace creates root span; finishSpan(error) sets trace status error and exports', () => {
    const trace = dt.startTrace('op-A')
    expect(trace.traceId).toBeDefined()
    expect(trace.spans.length).toBe(1)

    // create child span and mark error
    const child = dt.createChildSpan(trace.spans[0], 'child-op')
    expect(child.parentSpanId).toBe(trace.spans[0])

    dt.finishSpan(child.spanId, {
      status: 'error',
      error: new Error('boom'),
      tags: { severity: 'high' },
      logs: [{ level: 'error', message: 'fail', timestamp: Date.now() }],
    })

    // finish root span to complete trace; exporter logs are mocked
    dt.finishSpan(trace.spans[0])

    // getTraceDetails should be null after export + cleanup
    const details = dt.getTraceDetails(trace.traceId)
    expect(details).toBeNull()
  })

  test('inject/extract http headers and text map', () => {
    const span = dt.startSpan('op-B')

    const headers: Record<string, string> = {}
    dt.inject(span, 'http_headers', headers)
    const ctx1 = dt.extract('http_headers', headers)!
    expect(ctx1.traceId).toBe(span.traceId)
    expect(ctx1.spanId).toBe(span.spanId)
    expect(ctx1.parentSpanId).toBeNull()

    const map: any = {}
    dt.inject(span, 'text_map', map)
    const ctx2 = dt.extract('text_map', map)!
    expect(ctx2.traceId).toBe(span.traceId)
    expect(ctx2.spanId).toBe(span.spanId)

    dt.finishSpan(span.spanId)
  })

  test('service map builds cross-service connections via parent-child spans', () => {
    // force different service names by tweaking private config between span creations
    const anyDT = dt as any
    const originalServiceName = anyDT.config.serviceName

    // set service A for root
    anyDT.config.serviceName = 'svc-A'
    const trace = dt.startTrace('op-C')
    const rootSpanId = trace.spans[0]

    // set service B for child
    anyDT.config.serviceName = 'svc-B'
    const child = dt.createChildSpan(rootSpanId, 'op-C-child')
    ;(dt as any).traces.get(trace.traceId).spans.push(child.spanId)

    // finish only child to keep trace active
    dt.finishSpan(child.spanId)

    // fetch details while trace is active; should include a connection from svc-B to svc-A
    const details = dt.getTraceDetails(trace.traceId)!
    expect(details.serviceMap.length).toBeGreaterThan(0)
    const svcB = details.serviceMap.find((n: any) => n.serviceName === 'svc-B')!
    expect(svcB.connections.some((c: any) => c.targetService === 'svc-A')).toBe(true)

    // finish root and ensure cleanup occurs
    dt.finishSpan(rootSpanId)
    expect(dt.getTraceDetails(trace.traceId)).toBeNull()

    // restore original service name
    anyDT.config.serviceName = originalServiceName
  })
})

describe('DistributedTracing searchTraces coverage', () => {
  const dt = tracingModule.distributedTracing

  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {})
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => {
    ;(console.log as jest.Mock).mockRestore()
    ;(console.error as jest.Mock).mockRestore()
  })

  test('filters by serviceName and operationName substring', () => {
    const anyDT = dt as any
    const originalServiceName = anyDT.config.serviceName

    anyDT.config.serviceName = 'svc-X'
    const t1 = dt.startTrace('checkout', { tags: { region: 'us-east-1' } })

    anyDT.config.serviceName = 'svc-Y'
    const t2 = dt.startTrace('payment', { tags: { region: 'eu-west-1' } })

    // keep traces active (do not finish all spans)
    const resSvcX = dt.searchTraces({ serviceName: 'svc-X' })
    expect(resSvcX.map((t: any) => t.traceId)).toContain(t1.traceId)
    expect(resSvcX.map((t: any) => t.traceId)).not.toContain(t2.traceId)

    const resOpSub = dt.searchTraces({ operationName: 'check' })
    expect(resOpSub.map((t: any) => t.traceId)).toContain(t1.traceId)
    expect(resOpSub.map((t: any) => t.traceId)).not.toContain(t2.traceId)

    anyDT.config.serviceName = originalServiceName
  })

  test('filters by time range and duration bounds', () => {
    const anyDT = dt as any
    const originalServiceName = anyDT.config.serviceName

    anyDT.config.serviceName = 'svc-Z'
    const t = dt.startTrace('op-time')

    // manipulate startTime and duration to test filters while active
    const now = Date.now()
    const internalTrace = (dt as any).traces.get(t.traceId)
    internalTrace.startTime = now - 60_000 // 1 min ago
    internalTrace.duration = 150 // ms
    internalTrace.status = 'ok'

    const resTime = dt.searchTraces({ startTime: now - 120_000, endTime: now - 30_000 })
    expect(resTime.map((x: any) => x.traceId)).toContain(t.traceId)

    const resMinDur = dt.searchTraces({ minDuration: 100 })
    expect(resMinDur.map((x: any) => x.traceId)).toContain(t.traceId)

    const resMaxDur = dt.searchTraces({ maxDuration: 200 })
    expect(resMaxDur.map((x: any) => x.traceId)).toContain(t.traceId)

    anyDT.config.serviceName = originalServiceName
  })

  test('filters by status and tags exact match', () => {
    const anyDT = dt as any
    const originalServiceName = anyDT.config.serviceName

    anyDT.config.serviceName = 'svc-T'
    const t = dt.startTrace('op-tags', { tags: { tier: 'gold', region: 'ap-southeast-1' } })

    // set status manually while active (finish all spans would cleanup)
    const internalTrace = (dt as any).traces.get(t.traceId)
    internalTrace.status = 'error'
    internalTrace.duration = 50

    const resStatus = dt.searchTraces({ status: 'error' })
    expect(resStatus.map((x: any) => x.traceId)).toContain(t.traceId)

    const resTags = dt.searchTraces({ tags: { tier: 'gold', region: 'ap-southeast-1' } })
    expect(resTags.map((x: any) => x.traceId)).toContain(t.traceId)

    // negative: tag mismatch should exclude
    const resTagsMismatch = dt.searchTraces({ tags: { tier: 'silver' } })
    expect(resTagsMismatch.map((x: any) => x.traceId)).not.toContain(t.traceId)

    anyDT.config.serviceName = originalServiceName
  })
})