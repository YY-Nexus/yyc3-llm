import { test, expect } from '@playwright/test'

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3701'

/**
 * @description Analysis - 智能代码评审页面 E2E 用例
 * @author YYC
 * @created 2025-10-31
 */

test.describe('Analysis 代码评审页面 - 标签与操作稳定性', () => {
  test('操作按钮与标签页可见并可切换', async ({ page }) => {
    await page.goto(`${BASE_URL}/analysis/code-review`, { waitUntil: 'networkidle' })

    // 等待关键元素渲染
    await page.getByTestId('review-start').waitFor()

    // 操作按钮可见性
    await expect(page.getByTestId('review-start')).toBeVisible()
    await expect(page.getByTestId('review-analysis')).toBeVisible()

    // 标签可见性
    await expect(page.getByTestId('review-tab-review')).toBeVisible()
    await expect(page.getByTestId('review-tab-analysis')).toBeVisible()
    await expect(page.getByTestId('review-tab-metrics')).toBeVisible()

    // 切换标签并验证典型文案（唯一化防重复）
    await page.getByTestId('review-tab-review').click()
    await expect(page.getByText('开始代码评审以查看结果').first()).toBeVisible()

    await page.getByTestId('review-tab-metrics').click()
    await expect(page.getByText('评审统计').first()).toBeVisible()

    await page.getByTestId('review-tab-analysis').click()
    await expect(page.getByText('开始代码分析以查看详细结果').first()).toBeVisible()
  })
})
