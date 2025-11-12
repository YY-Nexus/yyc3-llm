/**
 * @file 监控模块适配层
 * @description 为前端监控组件提供一致的类型定义与服务导出
 */

// 复用现有服务，避免重复实现
export { faultRecoveryService } from './index'
export { monitoringIntegrationService } from './monitoring-integration-service'
export { slaMonitoringService } from './sla-monitoring-service'

// —— 类型定义：与前端组件的使用保持一致 ——
export interface DetectionRule {
  metric: string
  condition: string
  value: string | number | boolean
  duration: number
}

export interface RecoveryAction {
  id: string
  name: string
  description?: string
  operation: string // 组件侧使用的字段名（与服务端 action.type 对应）
  parameters: Record<string, any>
  timeout?: number
  retryCount?: number
  retryDelay?: number
  executionOrder: number
  isNew?: boolean
}

export interface RecoveryPolicy {
  id: string
  name: string
  description?: string
  failureType: string
  detectionThreshold: number
  detectionWindow: number
  autoExecute: boolean
  enabled: boolean
  recoveryActions: RecoveryAction[]
  failureDetectionRule: DetectionRule
  successCriteria: DetectionRule
  isNew?: boolean
}

// 基础元数据类型（用于下拉选择等）
export interface FailureType {
  id: string
  name: string
  description?: string
}

export interface RecoveryOperation {
  id: string
  name: string
  description?: string
}

// —— 仪表板适配类型 ——
export interface SLAMetric {
  id: string
  name: string
  description: string
  metricName: string
  currentValue: number
  threshold: number
  warningThreshold: number
  severity: 'critical' | 'high' | 'medium' | 'low'
  unit: string
  complianceRate: number
}

export interface RecoveryEvent {
  id: string
  timestamp: number
  faultType: string
  serviceId?: string
  strategyName: string
  success: boolean
  duration: number
  message?: string
  error?: string
  recommendations?: string[]
}

export interface Alert {
  id: string
  timestamp: number
  title: string
  message: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  details?: any
  resolved: boolean
}