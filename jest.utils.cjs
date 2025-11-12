/**
 * Jest 专用配置：Shared Utils 覆盖率门槛
 */

const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const baseConfig = require('./jest.config.cjs')

const customUtilsConfig = {
  ...baseConfig, // 继承基础配置
  // 仅收集 shared/utils 相关覆盖率
  collectCoverageFrom: [
    'lib/utils/**/*.{ts,tsx}',
    'lib/utils.ts'
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    'lib/utils/': { statements: 80, branches: 80, functions: 80, lines: 80 },
    'lib/utils.ts': { statements: 80, branches: 80, functions: 80, lines: 80 },
  },
}

module.exports = createJestConfig(customUtilsConfig)