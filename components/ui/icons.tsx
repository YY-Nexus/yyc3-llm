/**
 * @file 通用图标组件
 * @description 提供表情、上传、语音图标，统一样式与可访问性
 * @module ui/icons
 * @author YYC
 * @version 1.0.0
 * @created 2025-10-30
 * @updated 2025-10-30
 */

import React from 'react'
import { Smile, Upload as UploadIconLucide, Mic } from 'lucide-react'

/**
 * 图标通用属性
 */
export type IconProps = {
  /** 传入Tailwind类或自定义类，默认 `w-5 h-5` */
  className?: string
  /** 图标标题（用于可访问性提示） */
  title?: string
}

/**
 * @description 表情图标
 */
export const EmotionIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', title = '表情' }) => (
  <Smile className={className} aria-label="表情图标" title={title} />
)

/**
 * @description 上传图标
 */
export const UploadIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', title = '上传' }) => (
  <UploadIconLucide className={className} aria-label="上传图标" title={title} />
)

/**
 * @description 语音图标
 */
export const VoiceIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', title = '语音' }) => (
  <Mic className={className} aria-label="语音图标" title={title} />
)

export default { EmotionIcon, UploadIcon, VoiceIcon }
