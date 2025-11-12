"use client"

import dynamic from "next/dynamic"
import { type ModuleType, moduleConfigs } from "@/types/modules"

const AICodeGeneration = dynamic(() => import("@/components/modules/ai-code-generation"), { ssr: false })
const AppDevelopment = dynamic(() => import("@/components/modules/app-development"), { ssr: false })
const RealTimePreview = dynamic(() => import("@/components/modules/real-time-preview"), { ssr: false })
const AutomationProduction = dynamic(() => import("@/components/modules/automation-production"), { ssr: false })
const FileReview = dynamic(() => import("@/components/modules/file-review"), { ssr: false })
const ScoreAnalysis = dynamic(() => import("@/components/modules/score-analysis"), { ssr: false })
const DeploymentManagement = dynamic(() => import("@/components/modules/deployment-management"), { ssr: false })
const LocalModelEngine = dynamic(() => import("@/components/modules/local-model-engine"), { ssr: false })

interface MainContentProps {
  activeModule: ModuleType
}

export default function MainContent({ activeModule }: MainContentProps) {
  // 根据激活的模块渲染对应组件
  const renderModuleContent = () => {
    switch (activeModule) {
      case "ai-code-generation":
        return <AICodeGeneration />
      case "app-development":
        return <AppDevelopment />
      case "real-time-preview":
        return <RealTimePreview />
      case "automation-production":
        return <AutomationProduction />
      case "file-review":
        return <FileReview />
      case "score-analysis":
        return <ScoreAnalysis />
      case "deployment-management":
        return <DeploymentManagement />
      case "local-model-engine":
        return <LocalModelEngine />
      default:
        return <DefaultModuleView activeModule={activeModule} />
    }
  }

  return (
    <div className="p-6 min-h-full">
      {/* 轻量级过渡，避免引入 framer-motion 主包到首屏 */}
      <div className="h-full transition-opacity duration-300 ease-out">
        {renderModuleContent()}
      </div>
    </div>
  )
}

// 默认模块视图组件（用于尚未实现的模块）
function DefaultModuleView({ activeModule }: { activeModule: ModuleType }) {
  const moduleConfig = moduleConfigs.find((m) => m.id === activeModule)

  return (
    <div className="bg-white/80 backdrop-blur-md rounded-xl shadow-lg p-8 h-full">
      <div className="text-center mb-8">
        <div className="text-6xl mb-4 transform transition-transform duration-500">
          {moduleConfig?.icon}
        </div>
        <h2 className="text-3xl font-bold text-gray-800 mb-2">{moduleConfig?.name}</h2>
        <p className="text-gray-600 text-lg">{moduleConfig?.description}</p>
      </div>

      {/* 功能预览卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { title: "核心功能", desc: "主要功能模块正在开发中" },
          { title: "智能辅助", desc: "AI驱动的智能化操作" },
          { title: "实时反馈", desc: "即时的操作结果展示" },
          { title: "数据分析", desc: "深度的数据洞察分析" },
          { title: "自动化", desc: "流程自动化处理" },
          { title: "协作共享", desc: "团队协作与分享功能" },
        ].map((feature, index) => (
          <div
            key={feature.title}
            className={`bg-gradient-to-br from-white to-${moduleConfig?.color}/10 p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300`}
            style={{ transitionDelay: `${index * 100}ms` }}
          >
            <div
              className={`w-12 h-12 bg-gradient-to-r from-${moduleConfig?.color} to-${moduleConfig?.color}/70 rounded-lg mb-4 flex items-center justify-center`}
            >
              <span className="text-white text-xl">✨</span>
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">{feature.title}</h3>
            <p className="text-sm text-gray-600">{feature.desc}</p>
            <div className="mt-4 text-xs text-gray-400">即将上线</div>
          </div>
        ))}
      </div>

      {/* 开发进度指示 */}
      <div className="mt-8 text-center opacity-0 animate-fade-in">
        <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-coral-pink/10 to-mint-green/10 px-4 py-2 rounded-full">
          <div className="w-2 h-2 bg-lemon-yellow rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-600">模块开发中，敬请期待</span>
        </div>
      </div>
    </div>
  )
}
