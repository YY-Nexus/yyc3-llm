"use client"

/**
 * @file 品牌统一开关组件（封装）
 * @description 保持与现有开关样式类名与尺寸一致，避免布局抖动；统一交互与测试ID
 * @module ui-brand-toggle
 * @author YYC
 * @version 1.0.0
 * @created 2025-10-31
 * @updated 2025-10-31
 */

import * as React from "react"
import { Switch } from "@/components/ui/switch"

export interface BrandToggleProps {
  /** 当前是否开启 */
  checked: boolean
  /** 变更回调（受控） */
  onChange: (checked: boolean) => void
  /** data-testid（建议通过 utils/testid 统一生成） */
  testId?: string
  /** 禁用状态 */
  disabled?: boolean
  /** 可选：用于表单集成 */
  name?: string
  /** 可选：id映射 label/htmlFor */
  id?: string
  /** 无障碍：aria-label 文案 */
  ariaLabel?: string
  /** 允许外部追加类名，但不改变核心尺寸与结构 */
  className?: string
}

/**
 * @description 品牌统一开关组件
 * - 尺寸与类名与内置 Switch 完全一致：`h-6 w-11`，圆角、过渡与可访问性一致
 * - 使用 Radix Switch，Thumb 已设置 `pointer-events-none`，避免装饰层拦截点击
 * - 保持 Root 可点击，避免自定义覆盖层带来的事件穿透问题
 */
export const BrandToggle = React.forwardRef<HTMLButtonElement, BrandToggleProps>(
  ({ checked, onChange, disabled, testId, name, id, ariaLabel, className }, ref) => {
    return (
      <Switch
        ref={ref as any}
        name={name}
        id={id}
        // 保持一致的尺寸与类名（Switch内部已包含核心类名，不在此覆盖）
        className={className}
        checked={checked}
        disabled={disabled}
        onCheckedChange={onChange}
        aria-label={ariaLabel}
        data-testid={testId}
      />
    )
  }
)
BrandToggle.displayName = "BrandToggle"

export default BrandToggle
