/**
 * @file 路由布局（代码预览）
 * @description 为 modules/code-preview 路由提供服务端布局与 SEO metadata，保持页面为客户端组件以支持动态加载。
 * @module app/modules/code-preview/layout
 * @author YYC
 * @version 1.0.0
 * @created 2025-10-31
 * @updated 2025-10-31
 */

import type { ReactNode } from "react"

// 路由级元数据（在服务端生效）
export const metadata = {
  title: "代码预览 - 言語云³深度堆栈",
  description: "实时预览、运行和优化代码，支持多种编程语言和格式",
}

/**
 * @description 路由布局（Server Component），仅包裹 children，不更改页面 UI
 */
export default function CodePreviewLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
