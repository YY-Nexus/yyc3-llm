/**
 * @file 纯SVG图标组件
 * @description 提供表情、上传、语音的原生SVG实现，统一样式与可访问性
 * @module ui/svg-icons
 * @author YYC
 * @version 1.0.0
 * @created 2025-10-30
 * @updated 2025-10-30
 */

import React from 'react'

export type SvgIconProps = {
  className?: string
  title?: string
  size?: number
  strokeWidth?: number
}

const baseProps = (size = 24, strokeWidth = 2) => ({
  xmlns: 'http://www.w3.org/2000/svg',
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
})

/**
 * @description 表情图标 (Smile)
 */
export const EmotionSvg: React.FC<SvgIconProps> = ({ className = 'w-5 h-5', title = '表情', size = 24, strokeWidth = 2 }) => (
  <svg {...baseProps(size, strokeWidth)} className={className} aria-label="表情图标" focusable="false" role="img">
    {title ? <title>{title}</title> : null}
    <circle cx="12" cy="12" r="10" />
    <path d="M8 14s1.5 2 4 2 4-2 4-2" />
    <path d="M9 9h.01" />
    <path d="M15 9h.01" />
  </svg>
)

/**
 * @description 上传图标 (Upload)
 */
export const UploadSvg: React.FC<SvgIconProps> = ({ className = 'w-5 h-5', title = '上传', size = 24, strokeWidth = 2 }) => (
  <svg {...baseProps(size, strokeWidth)} className={className} aria-label="上传图标" focusable="false" role="img">
    {title ? <title>{title}</title> : null}
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <path d="M17 8l-5-5-5 5" />
    <path d="M12 3v12" />
  </svg>
)

/**
 * @description 语音图标 (Mic)
 */
export const VoiceSvg: React.FC<SvgIconProps> = ({ className = 'w-5 h-5', title = '语音', size = 24, strokeWidth = 2 }) => (
  <svg {...baseProps(size, strokeWidth)} className={className} aria-label="语音图标" focusable="false" role="img">
    {title ? <title>{title}</title> : null}
    <path d="M12 14a4 4 0 0 0 4-4V7a4 4 0 0 0-8 0v3a4 4 0 0 0 4 4" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="23" />
  </svg>
)

export default { EmotionSvg, UploadSvg, VoiceSvg }
