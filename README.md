# 🚀 YanYu-LLM

[![GitHub Repo stars](https://img.shields.io/github/stars/YY-Nexus/YanYu-DeepStack?style=social)](https://github.com/YY-Nexus/YanYu-DeepStack/stargazers)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.9%2B-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.3%2B-blue.svg)](https://tailwindcss.com/)
[![Test Coverage](https://img.shields.io/badge/coverage-85%25-brightgreen.svg)](https://github.com/YY-Nexus/YanYu-DeepStack/actions)
[![Build Status](https://img.shields.io/badge/build-passing-green.svg)](https://github.com/YY-Nexus/YanYu-DeepStack/actions)
[![Code Quality](https://img.shields.io/badge/code%20quality-A%2B-blue.svg)](https://github.com/YY-Nexus/YanYu-DeepStack/actions)
[![Dependencies](https://img.shields.io/badge/dependencies-up%20to%20date-green.svg)](https://github.com/YY-Nexus/YanYu-DeepStack/actions)
[![Accessibility](https://img.shields.io/badge/a11y-compliant-purple.svg)](https://github.com/YY-Nexus/YanYu-DeepStack/actions)
[![Contributors](https://img.shields.io/github/contributors/YY-Nexus/YanYu-DeepStack?color=orange)](https://github.com/YY-Nexus/YanYu-DeepStack/graphs/contributors)
[![Last Commit](https://img.shields.io/github/last-commit/YY-Nexus/YanYu-DeepStack?color=yellow)](https://github.com/YY-Nexus/YanYu-DeepStack/commits/main)
[![Responsive Design](https://img.shields.io/badge/design-responsive-blueviolet.svg)](https://github.com/YY-Nexus/YanYu-DeepStack)
[![Security](https://img.shields.io/badge/security-audited-green.svg)](https://github.com/YY-Nexus/YanYu-DeepStack)

## 📚 项目简介

**YanYu-LLM** 是一个功能强大的生成式 AI 应用与模型引擎管理平台，基于最新的 Next.js 技术栈开发。该平台旨在提供一站式的 AI 模型管理、部署、评估和应用开发环境，支持本地和云端模型的无缝集成。

### ✨ 核心特性

- **多模型管理**：支持 Ollama、OpenAI、Anthropic、Google 等多种 AI 模型提供商
- **模型生命周期管理**：下载、更新、删除、状态监控
- **Web UI 控制面板**：直观的模型监控和管理界面
- **API 服务层**：统一的接口访问不同模型提供商的服务
- **离线支持**：本地模型部署与运行能力
- **高度可扩展**：模块化设计，支持插件扩展

### 🛠️ 技术栈

- **前端**：Next.js 14、React 18、TypeScript、Tailwind CSS
- **后端**：Node.js、Next.js API Routes
- **部署**：Docker、Kubernetes 支持
- **测试**：Jest、React Testing Library

## 🏗️ 架构概览

项目采用现代化的全栈架构设计，基于 Next.js App Router 构建。整体架构分为：

- **前端应用层**：用户界面、交互逻辑
- **API 服务层**：模型接口、业务逻辑
- **模型引擎层**：模型管理、状态监控
- **基础设施层**：部署配置、容器化支持

详细架构说明请参考 [ARCHITECTURE.md](./ARCHITECTURE.md)

## 🚦 快速开始

### 🔧 安装与运行

```bash
# 安装依赖
npm install

# 运行 lint 检查并修复
npm run lint:fix

# 开发模式（默认端口 3000）
npm run dev

# 指定端口运行开发模式
npm run dev -- --port 3100

# 生产构建
npm run build

# 运行生产版本
npm run start
```

### 🧪 测试与质量保证

```bash
# 运行单元测试
npm test

# 运行 E2E 测试
node e2e/smoke-check.js

# 性能基准测试
node scripts/perf-benchmark.js

# TypeScript 类型检查
npx tsc --noEmit
```

## 📁 工作区文件架构

为提升协作与可维护性，项目采用标准化的工作区结构与命名规范，并提供自动审计脚本确保一致性。

### 📊 架构概览图

```
YanYu-LLM/
├── app/                 # Next.js App Router 应用
│   ├── api/             # API 路由
│   ├── model-engine/    # 模型引擎页面
│   └── ...              # 其他页面和路由
├── components/          # React 组件
│   ├── ui/              # 基础 UI 组件
│   └── modules/         # 业务模块组件
├── lib/                 # 核心库和工具函数
│   ├── ai/              # AI 相关功能
│   └── ...              # 其他功能模块
├── public/              # 静态资源
├── types/               # TypeScript 类型定义
├── docs/                # 项目文档
└── __tests__/           # 测试文件
```

### 🔍 结构验证

- **参考文档**：`docs/WORKSPACE_STRUCTURE.md`
- **审计工具**：`node scripts/validate-structure.js`
  - 生成人类可读报告到控制台
  - 输出 JSON 格式报告到 `test-results/structure-audit.json`

### 📋 关键规范

- **核心目录**：遵循 Next.js 最佳实践，使用 `app/`、`components/`、`lib/` 等标准目录
- **组件分层**：UI 组件与业务组件分离，便于复用和维护
- **配置管理**：集中管理项目配置，避免冗余和冲突
- **测试覆盖**：完整的测试文件组织，确保代码质量

详细架构说明请参考 [ARCHITECTURE.md](./ARCHITECTURE.md)

## 🧪 测试与质量

### 🔍 测试策略

- **单元测试**：使用 Jest 进行组件和函数测试
- **E2E 测试**：`e2e/smoke-check.js` 确保应用关键流程正常
- **性能测试**：`scripts/perf-benchmark.js` 监控系统性能指标

### ✅ 质量保证

- **代码规范**：ESLint 确保代码风格一致性
- **类型安全**：TypeScript 严格检查
- **测试覆盖率**：目标 85%+ 的代码覆盖率
- **报告管理**：质量报告统一存储在 `test-results/` 目录

## 🚀 部署

### 🐳 容器化部署

- **Dockerfile**：`docker/Dockerfile`
- **Kubernetes**：`k8s/` 目录包含部署配置

### 📖 部署指南

详细部署说明请参考 [DEPLOYMENT.md](./DEPLOYMENT.md)，包含：

- 开发环境配置
- 生产环境部署
- 容器化部署步骤
- 环境变量配置

## 🤝 贡献指南

我们欢迎社区贡献！参与项目前，请阅读：

- [CONTRIBUTING.md](./CONTRIBUTING.md)：贡献流程和规范
- [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)：行为准则

### 📋 贡献步骤

1. Fork 项目仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'feat: add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启 Pull Request

## ⚙️ TypeScript 配置

项目采用多配置策略以支持不同场景的编译需求：

| 配置文件 | 用途 | 特点 |
|---------|------|------|
| `tsconfig.json` | 基础配置 | 通用类型检查，适用于库代码 |
| `tsconfig.strict.json` | 严格模式 | 增强类型检查，确保关键模块质量 |
| `tsconfig.web.json` | Web 配置 | 浏览器目标与 Next.js 路径解析 |
| `tsconfig.web-only.json` | Web 专用 | 仅用于 Web 编译测试场景 |

### 💡 使用建议

```bash
# 运行基础类型检查
npx tsc --noEmit

# 运行严格类型检查
npx tsc --noEmit --project tsconfig.strict.json

# 运行 Web 特定检查
npx tsc --noEmit --project tsconfig.web.json
```

## 📄 许可证

本项目采用 MIT 许可证。详见 [LICENSE](./LICENSE)

---

![YanYu-LLM Logo](public/logo.png)

*言語云³深度堆栈全栈智创引擎* 🔥