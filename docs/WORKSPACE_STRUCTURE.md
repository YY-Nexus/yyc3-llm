# 工作区文件架构规范

本项目采用 Next.js App Router 与模块化组件库的结构。为便于维护与协作，建议遵循如下统一架构与约定。

## 顶层结构
- `app/`：Next.js 应用入口（App Router）。包含 `layout.tsx`、`page.tsx`、`api/`、`globals.css` 等。
- `components/`：通用组件库，分层组织：
  - `components/ui/`：基础 UI 组件与原子组件
  - `components/modules/`：业务模块级组件（如 AI 代码生成、预览、分析等）
  - 其它子目录按领域归类（如 `ai/`、`code/`、`layout/` 等）
- `lib/`：通用库与服务层（如 `ai-service.ts`、`store/`、`utils/` 等）。
- `public/`：静态资源（`favicon.ico`、`logo.svg|png`、`images/`、`models/`）。
- `scripts/`：脚本工具（如性能测试、结构审计等）。
- `docs/`：文档与指南（架构、部署、测试、使用指南等）。
- 其余：配置文件（`next.config.mjs`、`tsconfig.json` 等）与工程元数据。

## 命名与约定
- 统一使用 kebab-case 命名目录与文件（除 TypeScript 类型与 React 组件需要驼峰）。
- Next.js App Router 建议使用 `app/`（或统一迁移为 `src/app/`），避免同时存在两套入口。
- 避免重复配置：
  - `jest.config.js` 与 `jest.config.cjs` 保留单一版本（推荐 `cjs`）。
  - `tsconfig.json` 与 `tsconfig.web.json` 需在 README 文档明确分工，或合并。
- 生成的诊断与输出文件（如 `lint-output.txt`、`type-errors.txt`、`tsc-output.log` 等）建议归档至 `test-results/` 或 `.logs/`。

## app/ 目录结构建议
- `app/layout.tsx`：全局布局与主题。
- `app/page.tsx`：首页入口。
- `app/api/*`：API 路由，按功能域细分。
- `app/modules/*`：各模块页面（如 AI 代码生成、预览、分析、部署管理等）。
- `app/model-engine/*`：模型引擎页面与管理。
- `app/globals.css`：全局样式。

## components/ 组织建议
- `components/ui/`：基础组件（Button、Card、Badge 等）。
- `components/modules/`：聚合型业务组件（例如 `enhanced-ai-code-generation.tsx`）。
- 专用域组件按子目录划分（`ai/`、`code/`、`preview/` 等）。

## 标准化检查
- 使用 `scripts/validate-structure.js` 对工作区结构进行审计，输出缺失项与警告，建议修复方案。
- 审计结果同时写入 `test-results/structure-audit.json` 以便追踪。

## 迁移建议（可选）
- 若未来统一为 `src/app/`，建议进行一次迁移：
  - 将 `app/` 整体迁移至 `src/app/`
  - 更新 `tsconfig.json` 路径与 `next.config.mjs` 相关配置
  - 校正别名（`@/components`、`@/lib` 等）以匹配 `src` 根目录
- 保留 `components/`、`lib/`、`public/` 的层次与职责不变。

## 参考
- Next.js App Router 文档
- 团队编码规范与模块划分约定
