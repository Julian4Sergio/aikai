# Deployment - V1.0

## 1. 目标与范围

定义 `V1.0` 的最小可运维部署方案，支持：

- 单轮问答服务可用
- 快速发布与快速回滚
- 基础可观测能力

本版本采用单机 `Docker Compose` 方案，不引入 K8s。

## 2. 部署拓扑

- `nginx`：反向代理与入口路由
- `frontend`：Next.js 应用
- `backend`：FastAPI + Uvicorn
- `postgres`：主数据库
- `redis`：缓存/轻量队列预留

## 3. 环境分层

- `dev`：本地开发环境
- `staging`：联调与发布前验证
- `prod`：正式环境

要求：

- 三套环境使用同一部署结构
- 仅配置值差异化，不改变组件拓扑

## 4. 构建与发布策略

- 镜像构建：`GitHub Actions`（后续接入）
- 镜像版本：使用语义化版本或 `git sha`
- 发布方式：拉取指定镜像 tag 后滚动更新服务

发布顺序：

1. 更新镜像 tag
2. 执行数据库迁移 `alembic upgrade head`
3. 重启/滚动更新 `backend` 与 `frontend`
4. 验证 `GET /healthz` 与主链路

## 5. 配置管理

- 使用环境变量管理运行配置
- 严禁在代码中硬编码敏感信息
- 变量定义见 `docs/releases/v1.0/ENV_VARS_V1.0.md`

## 6. 发布检查

发布前必须满足：

- `docs/releases/v1.0/RELEASE_CHECKLIST_V1.0.md` 全部通过
- `docs/releases/v1.0/TEST_PLAN_V1.0.md` 的 P0 用例通过
- 回滚路径已确认可执行（见 `docs/releases/v1.0/ROLLBACK_PLAN_V1.0.md`）

## 7. 回滚策略

- 保留上一个稳定镜像 tag
- 失败时切回稳定 tag 并重启服务
- 回滚后执行最小冒烟（`healthz` + `chat/completions`）

详细步骤见 `docs/releases/v1.0/ROLLBACK_PLAN_V1.0.md`。

## 8. 可观测基线

- 应用日志：结构化 JSON 输出到 stdout
- 最小指标：请求量、错误率、延迟
- 关键追踪字段：`request_id`、`tenant_id`、`edition`

## 9. 非目标

- 本版本不覆盖：
  - 多区域高可用
  - K8s 编排
  - 自动扩缩容
  - 复杂灰度发布


