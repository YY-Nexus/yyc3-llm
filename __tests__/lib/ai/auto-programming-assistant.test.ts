import { autoProgrammingAssistant } from '../../../lib/ai/auto-programming-assistant'
import { multimodalAIService } from '../../../lib/ai/multimodal-ai-service'

jest.mock('../../../lib/ai/multimodal-ai-service', () => {
  return {
    multimodalAIService: {
      generateText: jest.fn(),
    },
  }
})

const mockGenerateText = multimodalAIService.generateText as jest.Mock

describe('AutoProgrammingAssistant getters and defaults', () => {
  beforeEach(() => {
    mockGenerateText.mockReset()
  })

  test('getSupportedLanguages returns known languages', () => {
    const langs = autoProgrammingAssistant.getSupportedLanguages()
    expect(Array.isArray(langs)).toBe(true)
    expect(langs).toContain('python')
    expect(langs).toContain('typescript')
  })

  test('getSupportedFrameworks returns frameworks and falls back to empty', () => {
    const py = autoProgrammingAssistant.getSupportedFrameworks('python')
    expect(py).toContain('django')
    const unknown = autoProgrammingAssistant.getSupportedFrameworks('elixir')
    expect(unknown).toEqual([])
  })

  test('getCodeQualityMetrics returns metric list', () => {
    const metrics = autoProgrammingAssistant.getCodeQualityMetrics()
    expect(metrics).toContain('安全性')
    expect(metrics.length).toBeGreaterThan(5)
  })

  test('getTestingFrameworks returns frameworks and falls back to empty', () => {
    const rb = autoProgrammingAssistant.getTestingFrameworks('ruby')
    expect(rb).toContain('rspec')
    const unknown = autoProgrammingAssistant.getTestingFrameworks('elixir')
    expect(unknown).toEqual([])
  })
})

describe('generateCode default options and branches', () => {
  beforeEach(() => {
    mockGenerateText.mockReset()
  })

  test('uses default modelId and returns explanation when includeExplanation=true', async () => {
    mockGenerateText.mockResolvedValueOnce({
      text: '说明：示例\n```python\nprint("hello")\n```',
      model: 'codellama:latest',
      usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
      finishReason: 'completed',
    })

    const res = await autoProgrammingAssistant.generateCode('打印', 'python')

    expect(mockGenerateText).toHaveBeenCalled()
    const callArgs = mockGenerateText.mock.calls[0]
    expect(callArgs[1]).toBe('codellama:latest')
    expect(res.code).toContain('print("hello")')
    expect(res.explanation).toContain('说明')
    expect(res.framework).toBeNull()
  })

  test('respects includeExplanation=false and custom options', async () => {
    mockGenerateText.mockResolvedValueOnce({
      text: '解释\n```ts\nconsole.log(1)\n```',
      model: 'codellama:latest',
      usage: { promptTokens: 5, completionTokens: 5, totalTokens: 10 },
      finishReason: 'completed',
    })

    const res = await autoProgrammingAssistant.generateCode('log', 'typescript', undefined, {
      includeExplanation: false,
      modelId: 'custom-model',
      temperature: 0.5,
      maxTokens: 1500,
    })

    const callArgs = mockGenerateText.mock.calls[0]
    expect(callArgs[1]).toBe('custom-model')
    expect(callArgs[2]).toMatchObject({ temperature: 0.5, maxTokens: 1500 })
    expect(res.explanation).toBeNull()
  })

  test('throws error for unsupported language', async () => {
    await expect(autoProgrammingAssistant.generateCode('x', 'elixir')).rejects.toThrow('不支持的编程语言: elixir')
    expect(mockGenerateText).not.toHaveBeenCalled()
  })
})

describe('completeCode defaults and stopAtDelimiter branch', () => {
  beforeEach(() => {
    mockGenerateText.mockReset()
  })

  test('defaults use stop delimiter and merges options', async () => {
    mockGenerateText.mockResolvedValueOnce({
      text: '补全代码',
      model: 'codellama:latest',
      usage: { promptTokens: 12, completionTokens: 8, totalTokens: 20 },
      finishReason: 'completed',
    })

    const res = await autoProgrammingAssistant.completeCode('function x() {', 'javascript')

    expect(mockGenerateText).toHaveBeenCalled()
    const opts = mockGenerateText.mock.calls[0][2]
    expect(opts.stop).toEqual(['}'])
    expect(res.language).toBe('javascript')
  })

  test('stopAtDelimiter=false removes stop option', async () => {
    mockGenerateText.mockResolvedValueOnce({
      text: '补全代码',
      model: 'codellama:latest',
      usage: { promptTokens: 12, completionTokens: 8, totalTokens: 20 },
      finishReason: 'completed',
    })

    await autoProgrammingAssistant.completeCode('print(', 'python', { stopAtDelimiter: false, temperature: 0.4 })
    const opts = mockGenerateText.mock.calls[0][2]
    expect(opts.stop).toBeUndefined()
    expect(opts.temperature).toBe(0.4)
  })

  test('throws error for unsupported language', async () => {
    await expect(autoProgrammingAssistant.completeCode('x', 'elixir')).rejects.toThrow('不支持的编程语言: elixir')
    expect(mockGenerateText).not.toHaveBeenCalled()
  })
})

describe('refactorCode defaults and branches', () => {
  beforeEach(() => {
    mockGenerateText.mockReset()
  })

  test('includeExplanation default=true and parses code block', async () => {
    mockGenerateText.mockResolvedValueOnce({
      text: '重构说明\n```js\nconst a=1\n```',
      model: 'codellama:latest',
      usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
      finishReason: 'completed',
    })

    const res = await autoProgrammingAssistant.refactorCode('const a=1', 'javascript', 'readability')
    expect(res.refactoredCode).toContain('const a=1')
    expect(res.explanation).toContain('重构说明')
  })

  test('includeExplanation=false returns null explanation', async () => {
    mockGenerateText.mockResolvedValueOnce({
      text: '重构说明\n```js\nconst a=2\n```',
      model: 'codellama:latest',
      usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
      finishReason: 'completed',
    })

    const res = await autoProgrammingAssistant.refactorCode('const a=2', 'javascript', 'performance', {
      includeExplanation: false,
    })
    expect(res.explanation).toBeNull()
  })

  test('throws error for unsupported language', async () => {
    await expect(
      autoProgrammingAssistant.refactorCode('x', 'elixir', 'security')
    ).rejects.toThrow('不支持的编程语言: elixir')
    expect(mockGenerateText).not.toHaveBeenCalled()
  })
})

describe('generateTests defaults and branches', () => {
  beforeEach(() => {
    mockGenerateText.mockReset()
  })

  test('picks first available framework when not specified and applies defaults', async () => {
    mockGenerateText.mockResolvedValueOnce({
      text: '测试说明\n```py\nassert True\n```',
      model: 'codellama:latest',
      usage: { promptTokens: 15, completionTokens: 20, totalTokens: 35 },
      finishReason: 'completed',
    })

    const res = await autoProgrammingAssistant.generateTests('def add(x,y): return x+y', 'python')
    expect(res.testFramework).toBe('pytest')
    expect(res.coverageEstimate).toBe(80)
    expect(mockGenerateText).toHaveBeenCalled()
    const callArgs = mockGenerateText.mock.calls[0]
    expect(callArgs[1]).toBe('codellama:latest')
  })

  test('allows overriding framework and coverage', async () => {
    mockGenerateText.mockResolvedValueOnce({
      text: '测试说明\n```py\nassert True\n```',
      model: 'codellama:latest',
      usage: { promptTokens: 15, completionTokens: 20, totalTokens: 35 },
      finishReason: 'completed',
    })

    const res = await autoProgrammingAssistant.generateTests('print(1)', 'python', {
      testFramework: 'unittest',
      coverageTarget: 95,
    })
    expect(res.testFramework).toBe('unittest')
    expect(res.coverageEstimate).toBe(95)
  })

  test('throws error for unsupported language', async () => {
    await expect(autoProgrammingAssistant.generateTests('x', 'elixir')).rejects.toThrow('不支持的编程语言: elixir')
    expect(mockGenerateText).not.toHaveBeenCalled()
  })
})

describe('evaluateCodeQuality defaults and parsing', () => {
  beforeEach(() => {
    mockGenerateText.mockReset()
  })

  test('returns metrics, suggestions, and detailed report by default', async () => {
    const qaText = [
      '可读性：8/10',
      '可维护性：7/10',
      '性能：6/10',
      '安全性：9/10',
      '可测试性：7/10',
      '复杂度：5/10',
      '代码重复：6/10',
      '命名规范：8/10',
      '注释质量：7/10',
      '总体评分：7/10',
      '建议：优化命名并减少重复代码',
    ].join('\n')

    mockGenerateText.mockResolvedValueOnce({
      text: qaText,
      model: 'codellama:latest',
      usage: { promptTokens: 20, completionTokens: 50, totalTokens: 70 },
      finishReason: 'completed',
    })

    const res = await autoProgrammingAssistant.evaluateCodeQuality('code', 'javascript')
    expect(res.metrics['安全性']).toBeGreaterThan(0)
    expect(res.overallScore).toBeGreaterThan(0)
    expect(res.suggestions.length).toBeGreaterThan(0)
    expect(res.detailedReport).not.toBeNull()
  })

  test('detailedReport=false returns null report', async () => {
    mockGenerateText.mockResolvedValueOnce({
      text: '可读性：6/10',
      model: 'codellama:latest',
      usage: { promptTokens: 10, completionTokens: 10, totalTokens: 20 },
      finishReason: 'completed',
    })

    const res = await autoProgrammingAssistant.evaluateCodeQuality('code', 'python', { detailedReport: false })
    expect(res.detailedReport).toBeNull()
  })

  test('throws error for unsupported language', async () => {
    await expect(autoProgrammingAssistant.evaluateCodeQuality('x', 'elixir')).rejects.toThrow('不支持的编程语言: elixir')
    expect(mockGenerateText).not.toHaveBeenCalled()
  })
})