# Changelog - V1.1

## 版本概览

- 版本：`V1.1`
- 状态：`Release Candidate`
- 目标：在兼容 `V1.0` 的前提下完成体验升级与短窗口多轮能力

## 新增（Added）

- 流式问答能力（`POST /api/v1/chat/stream`）
- 前端增量渲染与生成取消交互
- 短窗口 `history` 注入能力（`V1.1.1`）
- `V1.1` 设计基线、执行计划、测试计划、发布清单

## 变更（Changed）

- 保留并持续支持 `V1.0` 同步接口（兼容路径）
- 观测指标扩展（`ttft_ms`、`cancelled`、流式成功率）

## 修复（Fixed）

- 前端文案统一为中文，避免中英文混用
- 站点标题与图标统一为 `aikai` 与 `logo-without-text.png`
- 流式输出过程中自动滚动体验优化

## 移除（Removed）

- 无

## 兼容性说明

- `V1.1` 不移除 `V1.0` 接口
- `V1.x` 范围内保持向后兼容
- 破坏性变更必须升级主版本

## 已知限制（Known Limitations）

- 暂不支持长期记忆
- 暂不支持 RAG/MCP
- 多轮仅短窗口，不含复杂会话编排

## 关联文档

- `docs/releases/v1.1/V1.1_BACKLOG_FROM_V1.0.md`
- `docs/releases/v1.1/V1.1_DESIGN_BASELINE.md`
- `docs/releases/v1.1/V1.1_EXECUTION_PLAN.md`
- `docs/releases/v1.1/API_CONTRACT_V1.1.md`
- `docs/releases/v1.1/TEST_PLAN_V1.1.md`
- `docs/releases/v1.1/RELEASE_CHECKLIST_V1.1.md`
