import { test, expect } from '@playwright/test';

// 使用全局 baseURL，避免硬编码端口

test.describe('文件审查页面 E2E 测试', () => {
  test('页面加载与主要交互', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: '文件审查' }).click();
    await expect(page.getByRole('heading', { name: '文件审查' })).toBeVisible();
    // ...更多交互与断言
  });
});
