# 环境变量与密钥注入清单

本清单用于生产部署的环境变量与密钥管理，避免遗漏导致部署失败。

## 应用基本配置（ConfigMap）

- `NODE_ENV`：运行环境，建议 `production`
- `NEXT_TELEMETRY_DISABLED`：关闭 Next 遥测，`1`
- `NEXT_PUBLIC_OLLAMA_URL`：Ollama 服务地址，例如 `http://ollama:11434`
- 可选：服务发现与监控（如已存在）
  - `SERVICE_REGISTRY_URL`
  - `API_GATEWAY_URL`
  - `JAEGER_ENDPOINT`、`ZIPKIN_ENDPOINT`
  - `OTEL_SERVICE_NAME`、`OTEL_SERVICE_VERSION`

## AI 提供商密钥（Secret，Base64 编码）

- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `GOOGLE_API_KEY`
- `ALIYUN_ACCESS_KEY_ID`（如使用阿里云）

## 内部服务密钥（Secret，Base64 编码）

- `JWT_SECRET`
- `POSTGRES_PASSWORD`
- `REDIS_PASSWORD`

## 注入方式示例

- ConfigMap 示例：`k8s/configmap.yaml`（名称 `yanyu-cloud-config`）
- Secret 示例：`k8s/configmap.yaml` 第二段（名称 `yanyu-cloud-secrets`）
- Deployment 中注入（见 `k8s/Deployment.yaml`）：
  - `env.valueFrom.configMapKeyRef` 注入公共配置
  - `env.valueFrom.secretKeyRef` 注入密钥

## 健康检查

- 暴露 `GET /api/healthz`（文件：`app/api/healthz/route.ts`）
- K8s 使用 `readinessProbe` 与 `livenessProbe` 指向该接口

## 本地与预生产建议

- `.env.local`：本地调试用，包含 `NEXT_PUBLIC_OLLAMA_URL` 等
- 预生产与生产环境：通过 ConfigMap/Secret 管理，避免将密钥写入镜像或代码仓库

## 验证脚本

- `npm run e2e:smoke`：E2E 接口可达性与返回结构验证
- `npm run perf:bench`：性能基准，输出平均与 P95 延迟、成功率

## 注意事项

- Secret 值需使用 Base64 编码形式写入 YAML
- 不同集群的端口与 Ingress 规则不同，`Service.yaml` 为 ClusterIP，需配合 Ingress/Gateway 暴露外部流量
- 如需端口自定义，可通过环境变量 `PORT` 覆盖（Next 默认 `3000`）
