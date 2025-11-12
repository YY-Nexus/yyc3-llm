import { localModelOptimizer } from '../../../lib/ai/local-model-optimizer'

describe('local-model-optimizer', () => {
  test('getLocalModels 返回非空模型列表', () => {
    const models = localModelOptimizer.getLocalModels()
    expect(Array.isArray(models)).toBe(true)
    expect(models.length).toBeGreaterThan(0)
  })

  test('getBestChineseModel 返回 qwen2 系列', () => {
    const m = localModelOptimizer.getBestChineseModel()
    expect(['qwen2:72b', 'qwen2:latest']).toContain(m.name)
    expect(m.chineseSupport === 'excellent').toBe(true)
  })

  test('getFastestModel 返回速度为 fast 的模型', () => {
    const m = localModelOptimizer.getFastestModel()
    expect(m.performance.speed).toBe('fast')
  })

  test('getResourceUsage 返回统计信息结构', () => {
    const stats = localModelOptimizer.getResourceUsage()
    expect(stats.totalSize).toBeGreaterThan(0)
    expect(stats.totalModels).toBeGreaterThan(0)
    expect(typeof stats.categoryBreakdown).toBe('object')
    expect(typeof stats.memoryUsage).toBe('object')
  })

  test('generateUsageRecommendations 返回建议与提示', () => {
    const rec = localModelOptimizer.generateUsageRecommendations()
    expect(rec.primary).toBeTruthy()
    expect(rec.secondary).toBeTruthy()
    expect(rec.fast).toBeTruthy()
    expect(Array.isArray(rec.specialized)).toBe(true)
    expect(Array.isArray(rec.tips)).toBe(true)
    expect(rec.tips.length).toBeGreaterThan(0)
  })

  // 新增：任务推荐与排序验证（权重/优先级的近似映射）
  test('recommendModelForTask(chinese_coding) 返回按 priority 升序排序的推荐', () => {
    const rec = localModelOptimizer.recommendModelForTask('chinese_coding')
    const names = rec.map((m) => m.name)
    expect(names).toEqual(['qwen2:72b', 'mixtral:latest', 'qwen2:latest'])
  })

  test('recommendModelForTask(english_coding) 返回按 priority 升序排序的推荐', () => {
    const rec = localModelOptimizer.recommendModelForTask('english_coding')
    const names = rec.map((m) => m.name)
    expect(names).toEqual(['llama3:70b', 'mixtral:latest', 'codellama:latest'])
  })

  test('recommendModelForTask(fast_response) 返回按 priority 升序排序的推荐', () => {
    const rec = localModelOptimizer.recommendModelForTask('fast_response')
    const names = rec.map((m) => m.name)
    expect(names).toEqual(['llama3:latest', 'qwen2:latest', 'phi3:latest'])
  })

  test('recommendModelForTask(general) 返回按 priority 升序排序的推荐', () => {
    const rec = localModelOptimizer.recommendModelForTask('general')
    const names = rec.map((m) => m.name)
    expect(names).toEqual(['llama3:latest', 'qwen2:latest', 'phi3:latest'])
  })

  test('recommendModelForTask(未知任务) 返回空数组', () => {
    const rec = localModelOptimizer.recommendModelForTask('unknown' as any)
    expect(Array.isArray(rec)).toBe(true)
    expect(rec.length).toBe(0)
  })

  // 新增：最快与最佳模型的精确断言
  test('getFastestModel 精确返回 phi3:latest', () => {
    const m = localModelOptimizer.getFastestModel()
    expect(m.name).toBe('phi3:latest')
    expect(m.performance.speed).toBe('fast')
  })

  test('getBestChineseModel 优先返回 qwen2:72b', () => {
    const m = localModelOptimizer.getBestChineseModel()
    expect(m.name).toBe('qwen2:72b')
    expect(m.chineseSupport).toBe('excellent')
  })

  // 新增：统计分布的精确断言（类别与内存使用）
  test('getResourceUsage 返回精确的汇总与分布', () => {
    const stats = localModelOptimizer.getResourceUsage()
    expect(stats.totalSize).toBeCloseTo(121.1, 5) // 41 + 39 + 26 + 4.7 + 4.4 + 3.8 + 2.2
    expect(stats.totalModels).toBe(7)
    expect(stats.categoryBreakdown).toEqual({ large: 3, general: 2, chinese: 1, code: 1 })
    expect(stats.memoryUsage).toEqual({ very_high: 2, high: 1, medium: 3, low: 1 })
  })

  // 新增：使用建议的具体内容与一致性
  test('generateUsageRecommendations 返回的 specialized 与 primary/fast 一致性', () => {
    const rec = localModelOptimizer.generateUsageRecommendations()
    // specialized 仅包含 code 类别：当前数据集中只有 codellama:latest
    const specializedNames = rec.specialized.map((m) => m.name)
    expect(specializedNames).toEqual(['codellama:latest'])
    // primary 与 getBestChineseModel 一致
    expect(rec.primary.name).toBe(localModelOptimizer.getBestChineseModel().name)
    // fast 与 getFastestModel 一致
    expect(rec.fast.name).toBe(localModelOptimizer.getFastestModel().name)
    // tips 包含针对 codellama 的提示
    expect(rec.tips.some((t) => t.includes('codellama:latest'))).toBe(true)
    expect(rec.tips.length).toBe(6)
  })
})