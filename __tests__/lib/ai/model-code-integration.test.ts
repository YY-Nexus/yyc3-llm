import { useModelCodeIntegration, initializeModelCodeIntegration } from '../../../lib/ai/model-code-integration'

// 针对 model 内部的相对导入，使用同路径进行模拟
jest.mock('../../../lib/ai/enhanced-ollama-service', () => {
  const on = jest.fn()
  const removeListener = jest.fn()
  const models = [
    {
      id: 'codellama',
      name: 'CodeLlama',
      type: 'code',
      status: 'ready',
      usageStats: { totalCalls: 10 },
    },
  ]
  const getAllModels = jest.fn().mockReturnValue(models)
  const getRecommendedModels = jest.fn().mockReturnValue(models)
  const generateText = jest.fn().mockResolvedValue({
    success: true,
    text: '```python\nprint(123)\n```\n说明文本',
    tokens: { completion: 50 },
    timing: { evalTime: 1_000_000_000 },
  })

  return {
    enhancedOllamaService: {
      on,
      removeListener,
      getAllModels,
      getRecommendedModels,
      generateText,
    },
  }
})

describe('model-code-integration minimal', () => {
  const originalLocalStorage = global.localStorage as any

  beforeEach(() => {
    // 提供最小 localStorage 实现，避免初始化读取时报错
    const store: Record<string, string> = {}
    global.localStorage = {
      getItem: (k: string) => store[k] || null,
      setItem: (k: string, v: string) => {
        store[k] = String(v)
      },
      removeItem: (k: string) => {
        delete store[k]
      },
      clear: () => {
        Object.keys(store).forEach((k) => delete store[k])
      },
      key: (i: number) => Object.keys(store)[i] || null,
      length: 0,
    } as any
  })

  afterEach(() => {
    global.localStorage = originalLocalStorage
    jest.clearAllMocks()
  })

  test('initializeModelCodeIntegration 不抛错且注册连接事件监听', () => {
    const integration = initializeModelCodeIntegration()
    expect(integration).toBeTruthy()

    // 验证事件监听注册
    const { enhancedOllamaService } = require('../../../lib/ai/enhanced-ollama-service')
    expect(enhancedOllamaService.on).toHaveBeenCalledWith('connection:established', expect.any(Function))
    expect(enhancedOllamaService.on).toHaveBeenCalledWith('connection:lost', expect.any(Function))
  })

  test('loadAvailableModels 过滤 code/chat 且按类型与调用次数排序', async () => {
    const state = useModelCodeIntegration.getState()
    const { enhancedOllamaService } = require('../../../lib/ai/enhanced-ollama-service')

    const models = [
      { id: 'E', name: 'E', type: 'code', status: 'ready', usageStats: { totalCalls: 20 } },
      { id: 'A', name: 'A', type: 'code', status: 'ready', usageStats: { totalCalls: 5 } },
      { id: 'B', name: 'B', type: 'chat', status: 'ready', usageStats: { totalCalls: 10 } },
      { id: 'C', name: 'C', type: 'code', status: 'loading', usageStats: { totalCalls: 100 } },
      { id: 'D', name: 'D', type: 'embed', status: 'ready', usageStats: { totalCalls: 50 } },
    ]

    enhancedOllamaService.getAllModels.mockReturnValueOnce(models)

    await state.loadAvailableModels()
    const s = useModelCodeIntegration.getState()

    // 过滤出 ready 且类型为 code/chat 的模型，并按规则排序
    expect(s.availableModels.map((m: any) => m.id)).toEqual(['E', 'A', 'B'])
    // 未选择模型时，默认选择第一个
    expect(s.selectedModelId).toBe('E')
  })

  test('loadAvailableModels 保留已选择模型', async () => {
    const state = useModelCodeIntegration.getState()
    const { enhancedOllamaService } = require('../../../lib/ai/enhanced-ollama-service')

    const models = [
      { id: 'E', name: 'E', type: 'code', status: 'ready', usageStats: { totalCalls: 20 } },
      { id: 'A', name: 'A', type: 'code', status: 'ready', usageStats: { totalCalls: 5 } },
      { id: 'B', name: 'B', type: 'chat', status: 'ready', usageStats: { totalCalls: 10 } },
    ]

    // 预先选择 A
    useModelCodeIntegration.setState({ selectedModelId: 'A' })
    enhancedOllamaService.getAllModels.mockReturnValueOnce(models)

    await state.loadAvailableModels()
    const s = useModelCodeIntegration.getState()

    expect(s.selectedModelId).toBe('A')
    expect(s.availableModels.map((m: any) => m.id)).toEqual(['E', 'A', 'B'])
  })

  test('generateText 返回失败时 generateCode 返回错误并重置状态', async () => {
    const state = useModelCodeIntegration.getState()
    const { enhancedOllamaService } = require('../../../lib/ai/enhanced-ollama-service')

    await state.loadAvailableModels()
    state.selectModel('codellama')

    enhancedOllamaService.generateText.mockResolvedValueOnce({
      success: false,
      error: '模型忙',
      text: '',
      tokens: { completion: 0 },
      timing: { evalTime: 1_000_000_000 },
    })

    const res = await state.generateCode('触发失败')
    expect(res.success).toBe(false)
    expect(res.error).toBe('模型忙')
    expect(res.metrics.tokensGenerated).toBe(0)
    expect(res.metrics.tokensPerSecond).toBe(0)

    const s = useModelCodeIntegration.getState()
    expect(s.isGenerating).toBe(false)
    expect(s.generationProgress).toBe(0)
  })

  test('generateText 抛错时 generateCode 返回错误并重置状态', async () => {
    const state = useModelCodeIntegration.getState()
    const { enhancedOllamaService } = require('../../../lib/ai/enhanced-ollama-service')

    await state.loadAvailableModels()
    state.selectModel('codellama')

    enhancedOllamaService.generateText.mockRejectedValueOnce(new Error('网络错误'))

    const res = await state.generateCode('触发异常')
    expect(res.success).toBe(false)
    expect(res.error).toBe('网络错误')
    expect(res.metrics.latency).toBe(0)
    expect(res.metrics.tokensGenerated).toBe(0)
    expect(res.metrics.tokensPerSecond).toBe(0)

    const s = useModelCodeIntegration.getState()
    expect(s.isGenerating).toBe(false)
    expect(s.generationProgress).toBe(0)
  })

  test('initializeModelCodeIntegration 加载本地 history 并恢复选中模型', () => {
    // 预置 history 与选中的模型（使用全局 beforeEach 提供的 localStorage mock）
    const historyRecord = {
      id: 'gen1',
      timestamp: new Date().toISOString(),
      prompt: 'p',
      code: 'c',
      modelId: 'codellama',
      modelName: 'CodeLlama',
      options: {},
      metrics: { latency: 1, tokensGenerated: 2, tokensPerSecond: 3 },
    }

    global.localStorage.setItem('yanyu-code-generation-history', JSON.stringify([historyRecord]))
    global.localStorage.setItem('yanyu-selected-code-model', 'codellama')

    // 预先填充可用模型，确保初始化可立即恢复选择
    useModelCodeIntegration.setState({
      availableModels: [
        { id: 'codellama', name: 'CodeLlama', type: 'code', status: 'ready', usageStats: { totalCalls: 1 } } as any,
      ],
    })

    const integration = initializeModelCodeIntegration()
    expect(integration).toBeTruthy()

    const s = useModelCodeIntegration.getState()
    expect(s.generationHistory.length).toBe(1)
    expect(s.generationHistory[0].timestamp instanceof Date).toBe(true)
    expect(s.selectedModelId).toBe('codellama')
  })

  test('extractCodeFromResponse: 多代码块合并', async () => {
    const state = useModelCodeIntegration.getState()
    const { enhancedOllamaService } = require('../../../lib/ai/enhanced-ollama-service')

    await state.loadAvailableModels()
    state.selectModel('codellama')

    // 下次调用返回多个代码块
    enhancedOllamaService.generateText.mockResolvedValueOnce({
      success: true,
      text: '```python\nprint(123)\n```\n一些说明\n```js\nconsole.log(456)\n```',
      tokens: { completion: 50 },
      timing: { evalTime: 1_000_000_000 },
    })

    const res = await state.generateCode('合并代码块')
    expect(res.success).toBe(true)
    expect(res.code).toContain('print(123)')
    expect(res.code).toContain('console.log(456)')
    // 代码块之间应有空行
    expect(res.code).toMatch(/print\(123\)[\s\S]*\n\n[\s\S]*console\.log\(456\)/)
  })

  test('extractCodeFromResponse: 无代码块时返回原文本', async () => {
    const state = useModelCodeIntegration.getState()
    const { enhancedOllamaService } = require('../../../lib/ai/enhanced-ollama-service')

    await state.loadAvailableModels()
    state.selectModel('codellama')

    const plain = '没有任何代码围栏的纯文本'
    enhancedOllamaService.generateText.mockResolvedValueOnce({
      success: true,
      text: plain,
      tokens: { completion: 10 },
      timing: { evalTime: 2_000_000_000 },
    })

    const res = await state.generateCode('返回原文')
    expect(res.success).toBe(true)
    expect(res.code).toBe(plain)
    // 计算 tokens/s: 10 / 2e9 * 1e9 = 5
    expect(res.metrics.tokensPerSecond).toBeCloseTo(5)
  })

  test('生成后记录写入 history', async () => {
    const state = useModelCodeIntegration.getState()
    await state.loadAvailableModels()
    state.selectModel('codellama')

    const before = state.generationHistory.length
    await state.generateCode('记录一次生成')
    const after = useModelCodeIntegration.getState().generationHistory.length
    expect(after).toBeGreaterThan(before)
  })
})