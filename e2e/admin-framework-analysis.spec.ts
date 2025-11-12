import { test, expect } from '@playwright/test'

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3701'

/**
 * @description Admin - 框架分析页面 E2E 用例
 * @author YYC
 * @created 2025-10-31
 */

 test.describe('Admin 框架分析页面 - 标签与操作稳定性', () => {
  test('标签页与刷新/导出按钮可见并可切换', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/framework-analysis`, { waitUntil: 'networkidle' })

    // 等待关键元素渲染
    await page.getByTestId('framework-tab-overview').waitFor()

    // 标签可见性
    await expect(page.getByTestId('framework-tab-overview')).toBeVisible()
    await expect(page.getByTestId('framework-tab-recommendations')).toBeVisible()
    await expect(page.getByTestId('framework-tab-details')).toBeVisible()

    // 操作按钮可见性
    await expect(page.getByTestId('framework-refresh')).toBeVisible()
    await expect(page.getByTestId('framework-export')).toBeVisible()

    // 切换标签并验证典型文案（唯一化防重复）
    await page.getByTestId('framework-tab-overview').click()
    await expect(page.getByText('核心功能完成度').first()).toBeVisible()

    await page.getByTestId('framework-tab-recommendations').click()
    await expect(page.getByText('基于分析结果的优化建议').first()).toBeVisible()

    await page.getByTestId('framework-tab-details').click()
    await expect(page.getByText('详细分析报告').first()).toBeVisible()
  })
})
