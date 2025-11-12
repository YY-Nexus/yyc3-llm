"use client"

import dynamic from "next/dynamic"

const IntegratedCodePreview = dynamic(() => import("@/components/modules/integrated-code-preview"), {
  ssr: false,
  loading: () => <div className="p-6 text-center text-gray-500">预览组件加载中...</div>,
})

export default function CodePreviewPage() {
  return <IntegratedCodePreview />
}
