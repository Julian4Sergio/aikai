# Changelog - V1.0

## 版本概览

- 版本：`V1.0`
- 状态：`Draft`
- 目标：交付单轮问答基线

## 新增（Added）

- 单轮问答能力定义（`POST /api/v1/chat/completions`）
- 健康检查能力定义（`GET /healthz`）
- `V1.0` 设计基线文档
- `V1.0` 执行计划文档
- `V1` API 契约文档
- `V1.0` 测试计划文档
- `V1.0` 发布检查清单
- `V1.0` 回滚计划
- 版本统一交付规范文档（用于后续版本同构输出）

## 变更（Changed）

- `docs/README.md` 索引已扩展，纳入 `V1.0` 文档包与统一规范

## 修复（Fixed）

- 无

## 移除（Removed）

- 无

## 兼容性说明

- `V1.0` 为基线版本，无历史 API 兼容负担
- 后续 `V1.x` 默认保持向后兼容，破坏性变更需升级主版本

## 已知限制（Known Limitations）

- 不支持多轮上下文
- 不支持记忆管理
- 不支持知识库与 MCP
- 默认 `personal` 模式，不含完整企业能力
- 超出 `V1.0` 范围的预研能力已转入 `docs/releases/v1.1/V1.1_BACKLOG_FROM_V1.0.md`

## 关联文档

- `docs/releases/v1.0/V1.0_DESIGN_BASELINE.md`
- `docs/releases/v1.0/V1.0_EXECUTION_PLAN.md`
- `docs/releases/v1.0/API_CONTRACT_V1.md`
- `docs/releases/v1.0/TEST_PLAN_V1.0.md`
- `docs/releases/v1.0/RELEASE_CHECKLIST_V1.0.md`
- `docs/releases/v1.0/ROLLBACK_PLAN_V1.0.md`
- `docs/foundation/VERSION_DELIVERY_STANDARD.md`


