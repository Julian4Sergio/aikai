# Test Plan - V1.1

## 1. 目标

验证 `V1.1` 在保持 `V1.0` 兼容的前提下，完成体验提升目标：

- 流式增量输出可用
- 取消链路可控
- 短窗口多轮可用（`V1.1.1`）
- 兼容路径稳定

## 2. 测试范围

### 2.1 In Scope

- `POST /api/v1/chat/stream`
- `POST /api/v1/chat/completions`（兼容回归）
- `GET /healthz`
- 前端流式渲染与取消交互
- 短窗口 `history` 注入（`V1.1.1`）

### 2.2 Out of Scope

- 长期记忆
- RAG / MCP
- 企业级租户治理

## 3. 环境与前置条件

- 前后端可本地启动
- 可查看结构化日志与 `request_id`
- 可观测 `ttft_ms`、流式成功/失败、取消状态

## 4. 测试分层

### 4.1 单元测试

- SSE 事件编码（`delta/done/error`）
- history 窗口裁剪
- 取消信号处理
- 错误码映射（含 `CANCELLED`）

### 4.2 集成测试

- 流式成功路径
- 流式取消路径
- 流式异常路径
- 同步兼容路径
- 健康检查可用性

### 4.3 E2E 联调

- 首段文本可增量展示
- 取消后 UI 状态正确恢复
- 多轮短窗口上下文生效
- 同步回退路径可用（若启用）

## 5. 用例矩阵（最小集）

| 用例ID | 场景 | 输入 | 期望结果 |
|---|---|---|---|
| TC-101 | 流式成功 | 合法 `message` | 收到多个 `delta`，最终 `done` |
| TC-102 | 流式取消 | 生成中触发取消 | 服务端停止推送，日志记录 `cancelled=true` |
| TC-103 | 流式参数非法 | 缺失 `message` | 返回错误，`error_code=INVALID_ARGUMENT` |
| TC-104 | 流式超时 | 注入慢响应 | 返回/记录 `TIMEOUT` |
| TC-105 | 同步兼容成功 | 调用 `chat/completions` | 响应与 `V1.0` 契约一致 |
| TC-106 | healthz | `GET /healthz` | 返回 200 且 `status=ok` |
| TC-107 | 短窗口 history | 连续 N+ 轮对话 | 仅最近 N 轮注入，主链路稳定 |

## 6. 通过标准（Exit Criteria）

- P0 用例（TC-101 ~ TC-106）全部通过
- `V1.0` 兼容用例无回归
- 无 Blocker/Critical 缺陷
- `V1.1.1` 发布前 TC-107 通过

## 7. 回归策略

- 每次改动至少回归：TC-101、TC-102、TC-105、TC-106
- 影响 history 逻辑时追加 TC-107
- 发布前执行完整最小集

## 8. 交付物

- 测试报告（通过/失败/阻塞）
- 缺陷列表与分级
- 与 `API_CONTRACT_V1.1.md` 的差异清单（若有）
