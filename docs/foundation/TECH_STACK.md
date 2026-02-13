# 技术栈基线

## 前端

- 框架：`Next.js`（App Router）
- 语言：`TypeScript`
- UI：`Tailwind CSS` + `shadcn/ui`
- 数据请求：`TanStack Query`
- 本地状态：`Zustand`
- 实时通信：优先 `SSE`，复杂场景再扩展 `WebSocket`

## 后端

- 语言：`Python 3.12+`
- Web 框架：`FastAPI`
- 参数校验：`Pydantic v2`
- ORM：`SQLAlchemy 2.x`
- 数据迁移：`Alembic`
- ASGI 服务器：`Uvicorn`
- HTTP 客户端：`HTTPX`

## 数据与缓存

- 主数据库：`PostgreSQL`
- 缓存与轻量队列能力：`Redis`
- 向量扩展（V2 启用）：`pgvector`

## AI 与检索

- 通过适配层接入模型供应商（避免与单一厂商耦合）
- 知识库检索向量化（V2）
- 可选重排阶段（V2，提升检索质量）

## 工程与质量

- Python 依赖管理：`uv`（推荐）
- 前端包管理：`pnpm`
- Python 代码规范：`Ruff`、`Black`
- Python 测试：`Pytest`
- 前端规范：`ESLint`、`Prettier`
- 端到端测试（后续阶段）：`Playwright`

## 可观测与交付

- 追踪与指标：`OpenTelemetry`
- 指标体系：`Prometheus + Grafana`
- 日志：结构化 JSON 日志
- 容器化：`Docker`、`docker-compose`
- 持续集成与发布：`GitHub Actions`
