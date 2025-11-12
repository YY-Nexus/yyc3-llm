/**
 * @file 图标预览页面
 * @description 展示表情、上传、语音图标的统一样式示例
 * @module app/preview/icons
 * @author YYC
 * @version 1.0.0
 * @created 2025-10-30
 * @updated 2025-10-30
 */

'use client'

import React from 'react'
import { EmotionIcon, UploadIcon, VoiceIcon } from '@/components/ui/icons'
import { EmotionSvg, UploadSvg, VoiceSvg } from '@/components/ui/svg-icons'

export default function IconsPreviewPage() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold">图标预览</h1>
      <p className="text-sm text-muted-foreground">以下为 纯SVG 与库组件 两种实现，圆形底色统一视觉。</p>

      {/* 圆形底色 + 纯SVG */}
      <div className="flex items-center gap-6">
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
          <EmotionSvg />
        </div>
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
          <UploadSvg />
        </div>
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
          <VoiceSvg />
        </div>
      </div>

      {/* 圆形底色 + 库组件 */}
      <div className="flex items-center gap-6">
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
          <EmotionIcon />
        </div>
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
          <UploadIcon />
        </div>
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
          <VoiceIcon />
        </div>
      </div>

      <div className="mt-8 grid grid-cols-3 gap-4">
        <button className="inline-flex items-center gap-2 rounded-md border px-3 py-2 hover:bg-accent">
          <EmotionSvg />
          <span>插入表情</span>
        </button>
        <button className="inline-flex items-center gap-2 rounded-md border px-3 py-2 hover:bg-accent">
          <UploadSvg />
          <span>上传文件</span>
        </button>
        <button className="inline-flex items-center gap-2 rounded-md border px-3 py-2 hover:bg-accent">
          <VoiceSvg />
          <span>开始语音</span>
        </button>
      </div>
    </div>
  )
}
