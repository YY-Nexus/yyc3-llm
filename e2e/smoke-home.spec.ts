import { test, expect } from '@playwright/test'

/**
 * @description 首页冒烟测试 - 验证应用可访问与基本渲染
 * @author YYC
 * @created 2025-10-31
 */

// 依赖 Playwright 全局 baseURL，不再硬编码端口

test.describe('应用首页冒烟测试', () => {
  test('首页可访问且主体渲染', async ({ page }) => {
    const response = await page.goto('/', { waitUntil: 'domcontentloaded' })
    expect(response?.ok()).toBeTruthy()
    await expect(page.locator('body')).toBeVisible()
  })
})
