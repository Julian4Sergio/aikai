# aikai-智能助手

本仓库基于 `V1.0` 文档基线完成初始化。
当前仅包含项目骨架，尚未进入实际业务开发。

## 目录结构

- `docs/`：产品与研发规范文档基线
- `ui/`：`V1.0` 视觉与交互设计资产
- `frontend/`：前端工程骨架（Next.js，暂未实现业务代码）
- `backend/`：后端工程骨架（FastAPI，含领域模块边界）
- `infra/`：部署相关占位目录（nginx/compose）
- `config/`：配置占位目录
- `scripts/`：脚本占位目录

## 架构边界

后端按架构守则预留以下模块边界：

- `chat`（`V1.0` 启用目标）
- `memory`（预留扩展点）
- `knowledge`（预留扩展点）
- `tooling`（预留扩展点）

## 下一步

- 按文档基线补齐前后端最小可运行代码
- 建立测试与发布自动化基线
- 前端优先部署到 `Vercel`，后端后续独立部署到服务器

## 发布策略（当前）

- 日常提交到 `main`：用于开发与预览
- 生产发布：使用版本标签触发（如 `v0.3.0`）
- GitHub Actions 工作流：`.github/workflows/vercel-prod-on-tag.yml`
