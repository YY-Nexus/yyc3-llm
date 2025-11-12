/**
 * @file 测试ID生成工具库
 * @description 统一生成具有作用域前缀的 data-testid，降低选择器冲突并提升E2E稳定性
 * @module utils-testid
 * @author YYC
 * @version 1.0.0
 * @created 2025-10-31
 * @updated 2025-10-31
 */

/**
 * @description 测试作用域枚举 - 用于区分不同视图/区域
 */
export type TestScope = 'main' | 'module' | 'logs' | 'modal' | 'aside'

/**
 * @description 将任意字符串标准化为 testid 安全的片段
 */
export function slugify(value: string | number | undefined | null): string {
  if (value === undefined || value === null) return ''
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * @description 统一生成测试ID: <scope>-<feature>-<entity>-<id>
 */
export function makeTestId(
  scope: TestScope,
  feature: string,
  entity?: string,
  id?: string | number
): string {
  const parts = [slugify(scope), slugify(feature)]
  if (entity) parts.push(slugify(entity))
  if (id !== undefined && id !== null && String(id).length > 0) parts.push(slugify(id))
  return parts.filter(Boolean).join('-')
}

/**
 * @description 将生成的 testid 注入到组件 props（便于结构化传递）
 */
export function asTestIdProps(testId: string): { 'data-testid': string } {
  return { 'data-testid': testId }
}

// === 项目内常用ID生成器（约定一致性） ===

/**
 * @description 环境卡片区域标题（例如: main-deploy-env-dev）
 */
export function envCardId(scope: TestScope, envId: string): string {
  return makeTestId(scope, 'deploy-env', undefined, envId)
}

/**
 * @description 环境日志区域标题（例如: main-deploy-env-dev-logs）
 */
export function envLogsId(scope: TestScope, envId: string): string {
  return `${envCardId(scope, envId)}-logs`
}

/**
 * @description 环境自动部署开关（例如: main-deploy-auto-toggle-dev）
 */
export function envAutoToggleId(scope: TestScope, envId: string): string {
  return makeTestId(scope, 'deploy-auto-toggle', undefined, envId)
}

/**
 * @description 全局 CI/CD 开关（例如: main-cicd-enabled-toggle）
 */
export function cicdToggleId(scope: TestScope): string {
  return makeTestId(scope, 'cicd-enabled-toggle')
}

/**
 * @description 全局 Docker 开关（例如: main-docker-enabled-toggle）
 */
export function dockerToggleId(scope: TestScope): string {
  return makeTestId(scope, 'docker-enabled-toggle')
}

/**
 * @description 自定义规则便捷方法（避免散落字符串拼接）
 */
export const TestId = {
  make: makeTestId,
  asProps: asTestIdProps,
  envCard: envCardId,
  envLogs: envLogsId,
  envAutoToggle: envAutoToggleId,
  cicdToggle: cicdToggleId,
  dockerToggle: dockerToggleId,
}
