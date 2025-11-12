# Deployment Guide

## Environments

- Development: `npm run dev` (Next.js dev server, port 3690).
- Production: `npm run start:production` (build + start).

## Configuration

- Environment variables loaded from `.env` / `.env.local` (do not commit).
- Bootstrap scripts:
  - `npm run setup:env`: populate local `.env.local` with required keys.
  - `npm run validate:env`: verify required keys present.

## Typical Variables (examples)

- `NEXT_PUBLIC_APP_URL`: public base URL.
- `API_BASE_URL`: server-side API endpoint.
- `OLLAMA_HOST`: host for local LLM models.
- Add your project-specific keys here and document defaults.

## Build & Serve

- Build: `npm run build`.
- Serve: `npm start` or platform process manager.
- Static assets: `public/` folder.

## Containerization

- Docker: see `docker/Dockerfile` and `docker-compose.yml`.
- K8s: manifests in `k8s/` (`namespace.yaml`, `configmap.yaml`).

## Health & Monitoring

- Prefer platform logging and metrics (e.g., Vercel/Node platform equivalents).
- Add runtime diagnostics under `app/diagnostics` as needed.

## Rollback Strategy

- Keep last N release artifacts.
- Tag and redeploy previous version if necessary.

## CI 触发部署策略

- 当 CI 构建成功（`npm run lint`、`npx tsc --noEmit`、`npm run test:ci`、`npm run build` 均通过）时，自动触发后续部署流水线。
- 在平台侧（如 GitHub Actions、Vercel、K8s、或自建 Runner）配置：
  - 保护分支仅在 CI 全绿后允许合并。
  - 合并到 `main`/`release/*` 分支后，通过部署工作流发布到对应环境。
- E2E 步骤可设置为非阻塞（失败不阻止构建），但始终上传报告以供审阅。
- 参考 `.github/workflows/ci.yml` 中的构建与测试步骤，后续可在 `docs.yml` 或专用 `deploy.yml` 中对接平台部署。