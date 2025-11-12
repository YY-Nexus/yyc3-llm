import { deepStackConfig, getLanguageExamples, getRelevantExamples } from '../../../lib/ai/deepstack-config'

describe('deepstack-config', () => {
  test('supportedLanguages 和 capabilities 基本信息存在', () => {
    expect(Array.isArray(deepStackConfig.supportedLanguages)).toBe(true)
    expect(deepStackConfig.supportedLanguages.length).toBeGreaterThan(0)

    expect(Array.isArray(deepStackConfig.capabilities)).toBe(true)
    expect(deepStackConfig.capabilities.length).toBeGreaterThan(0)
  })

  test('getLanguageExamples 返回指定语言示例', () => {
    const pyExamples = getLanguageExamples('Python')
    expect(Array.isArray(pyExamples)).toBe(true)
    expect(pyExamples.length).toBeGreaterThan(0)
    // 至少要包含与 Python 相关的关键字或结构
    const joined = JSON.stringify(pyExamples)
    expect(joined.toLowerCase()).toContain('python')
  })

  test('getRelevantExamples 基于关键词筛选与默认数量限制', () => {
    const keyword = '中文 编程 代码'
    const examples = getRelevantExamples(keyword)
    expect(Array.isArray(examples)).toBe(true)
    expect(examples.length).toBeGreaterThan(0)

    // 限制数量（默认实现通常会做基本过滤；我们只断言不会过多返回）
    expect(examples.length).toBeLessThanOrEqual(10)
  })
})