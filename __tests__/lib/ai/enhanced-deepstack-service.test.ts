import { enhancedDeepStackService } from '../../../lib/ai/enhanced-deepstack-service'
import { localModelOptimizer } from '../../../lib/ai/local-model-optimizer'

describe('EnhancedDeepStackService getters', () => {
  test('getModelRecommendations 返回中文编程推荐，且优先模型在前', () => {
    const recs = enhancedDeepStackService.getModelRecommendations('chinese_coding')
    expect(Array.isArray(recs)).toBe(true)
    expect(recs.length).toBeGreaterThan(0)
    // 预期 qwen2:72b 优先级更高，排在前面
    expect(recs[0].name === 'qwen2:72b' || recs[0].name === 'qwen2:latest').toBe(true)
  })

  test('getBestChineseModel 返回最佳中文模型', () => {
    const best = enhancedDeepStackService.getBestChineseModel()
    expect(best).toBeTruthy()
    expect(['qwen2:72b', 'qwen2:latest']).toContain(best.name)
  })

  // 代理一致性：getModelRecommendations 与 localModelOptimizer 输出一致（英文编程）
  test('getModelRecommendations proxies localModelOptimizer (english_coding)', () => {
    const svc = enhancedDeepStackService.getModelRecommendations('english_coding')
    const opt = localModelOptimizer.recommendModelForTask('english_coding')
    expect(svc.map((m) => m.name)).toEqual(opt.map((m) => m.name))
  })

  // 代理一致性：复杂推理推荐一致
  test('getModelRecommendations proxies localModelOptimizer (complex_reasoning)', () => {
    const svc = enhancedDeepStackService.getModelRecommendations('complex_reasoning')
    const opt = localModelOptimizer.recommendModelForTask('complex_reasoning')
    expect(svc.map((m) => m.name)).toEqual(opt.map((m) => m.name))
  })

  // 代理一致性：快速响应推荐一致
  test('getModelRecommendations proxies localModelOptimizer (fast_response)', () => {
    const svc = enhancedDeepStackService.getModelRecommendations('fast_response')
    const opt = localModelOptimizer.recommendModelForTask('fast_response')
    expect(svc.map((m) => m.name)).toEqual(opt.map((m) => m.name))
  })

  // 代理一致性：最佳中文模型一致
  test('getBestChineseModel proxies localModelOptimizer', () => {
    const svc = enhancedDeepStackService.getBestChineseModel()
    const opt = localModelOptimizer.getBestChineseModel()
    expect(svc.name).toBe(opt.name)
  })

  // 新增：公开选择器覆盖非代码任务的 fast_response 分支
  test('getOptimalModelForTask 英文 simple 非代码任务选择 phi3:latest', () => {
    const model = enhancedDeepStackService.getOptimalModelForTask('English', 'explain', 'simple')
    expect(model).toBe('phi3:latest')
  })

  test('getOptimalModelForTask 中文 simple 非代码任务优先中文分支选择 qwen2:latest', () => {
    const model = enhancedDeepStackService.getOptimalModelForTask('中文', 'explain', 'simple')
    expect(model).toBe('qwen2:latest')
  })

  test('getOptimalModelForTask 英文 medium 非代码任务走默认分支选择 qwen2:latest', () => {
    const model = enhancedDeepStackService.getOptimalModelForTask('English', 'fix', 'medium')
    expect(model).toBe('qwen2:latest')
  })
})

describe('EnhancedDeepStackService generateCode（最小化）', () => {
  const originalFetch = global.fetch as any

  beforeEach(() => {
    // 模拟 fetch，避免真实网络调用
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        response: '```js\nconsole.log(1)\n```\n这是解释部分',
        total_duration: 2_000_000_000, // 2s
        eval_count: 100,
        eval_duration: 1_000_000_000, // 1s
      }),
    })
  })

  afterEach(() => {
    global.fetch = originalFetch
    jest.clearAllMocks()
  })

  test('默认复杂中文任务选择 qwen2:72b 并能解析代码与解释', async () => {
    const result = await enhancedDeepStackService.generateCode('生成一个示例', {
      language: '中文',
      complexity: 'complex',
    })

    expect(result.success).toBe(true)
    if (!result.success) throw new Error('生成失败')

    expect(result.model).toBe('qwen2:72b')
    expect(typeof result.code).toBe('string')
    expect(result.code).toContain('console.log(1)')
    expect(typeof result.explanation).toBe('string')
    expect(result.explanation).toContain('这是解释部分')

    // 验证基本指标计算（转换为 any 消除类型告警）
    const metrics = (result as any).metrics
    expect(metrics.latency).toBeGreaterThanOrEqual(0)
    expect(metrics.tokensGenerated).toBeGreaterThanOrEqual(0)
  })

  // 选择策略：中文+medium -> qwen2:latest
  test('中文 medium 选择 qwen2:latest', async () => {
    const result = await enhancedDeepStackService.generateCode('示例', {
      language: '中文',
      complexity: 'medium',
    })
    expect(result.success).toBe(true)
    if (!result.success) throw new Error('生成失败')
    expect(result.model).toBe('qwen2:latest')
  })

  // 选择策略：英文复杂代码 -> qwen2:72b（代码任务复杂）
  test('英文复杂代码任务选择 qwen2:72b', async () => {
    const result = await enhancedDeepStackService.generateCode('example', {
      language: 'English',
      complexity: 'complex',
    })
    expect(result.success).toBe(true)
    if (!result.success) throw new Error('生成失败')
    expect(result.model).toBe('qwen2:72b')
  })

  // 选择策略：英文中等/简单代码 -> codellama:latest（代码任务非复杂）
  test('英文中等代码任务选择 codellama:latest', async () => {
    const result = await enhancedDeepStackService.generateCode('example', {
      language: 'English',
      complexity: 'medium',
    })
    expect(result.success).toBe(true)
    if (!result.success) throw new Error('生成失败')
    expect(result.model).toBe('codellama:latest')
  })

  test('英文简单代码任务也选择 codellama:latest（代码任务优先分支覆盖 simple）', async () => {
    const result = await enhancedDeepStackService.generateCode('example', {
      language: 'English',
      complexity: 'simple',
    })
    expect(result.success).toBe(true)
    if (!result.success) throw new Error('生成失败')
    expect(result.model).toBe('codellama:latest')
  })

  // 选择策略：preferredModel 覆盖选择
  test('preferredModel 覆盖内部选择逻辑', async () => {
    const result = await enhancedDeepStackService.generateCode('example', {
      language: 'English',
      complexity: 'complex',
      preferredModel: 'llama3:70b',
    })
    expect(result.success).toBe(true)
    if (!result.success) throw new Error('生成失败')
    expect(result.model).toBe('llama3:70b')
  })

  // 提示词增强：当 language 为 JavaScript 时，增强提示包含中文优化建议
  test('当 language 为 JavaScript 时，增强提示包含中文优化建议', async () => {
    // 通过拦截 fetch 校验 body 中 prompt
    const spy = jest.spyOn(global, 'fetch')
    await enhancedDeepStackService.generateCode('示例', {
      language: 'JavaScript',
      complexity: 'medium',
    })
    const body = JSON.parse((spy.mock.calls[0][1] as any).body)
    expect(typeof body.prompt).toBe('string')
    expect(body.prompt).toContain('请确保：')
    expect(body.prompt).toContain('添加详细的中文注释')
    expect(body.model).toBe('codellama:latest')
    spy.mockRestore()
  })

  // 失败路径：fetch 返回非 2xx
  test('fetch 返回失败时返回 success=false 和错误信息', async () => {
    ;(global.fetch as any) = jest.fn().mockResolvedValue({ ok: false })
    const result = await enhancedDeepStackService.generateCode('示例', { language: 'English', complexity: 'medium' })
    expect(result.success).toBe(false)
    if (result.success) throw new Error('预期失败，但成功了')
    expect((result as any).error).toBe('模型调用失败')
  })
})