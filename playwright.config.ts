import { defineConfig, devices } from '@playwright/test'

/**
 * @file Playwright 配置
 * @description 统一 baseURL 并自动启动/停止 Next 开发服务
 * @author YYC
 * @created 2025-10-31
 */

// 从环境变量读取基础 URL，默认使用 3100 端口，避免与常见占用冲突
const DEFAULT_PORT = process.env.PORT ? Number(process.env.PORT) : 3100
const DEFAULT_BASE_URL = process.env.TEST_BASE_URL || `http://localhost:${DEFAULT_PORT}`

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 30_000,
  use: {
    baseURL: DEFAULT_BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    locale: 'zh-CN',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // 自动启动 Next 开发服务，并在测试结束后自动停止
  webServer: {
    command: `PORT=${DEFAULT_PORT} npm run dev`,
    url: `http://localhost:${DEFAULT_PORT}`,
    reuseExistingServer: true,
    timeout: 120_000,
  },
})
