# Test Plan - V1.0

## 1. 目标

验证 `V1.0` 单轮问答基线满足：

- 功能可用
- 错误可控
- 契约稳定
- 本地可复现

## 2. 测试范围

### 2.1 In Scope

- `POST /api/v1/chat/completions`
- `GET /healthz`
- 前端单轮提问链路（输入、发送、展示）
- 错误处理与日志基线

### 2.2 Out of Scope

- 多轮上下文
- 记忆能力
- 知识库与检索
- MCP 工具调用

## 3. 环境与前置条件

- 后端可本地启动
- 前端可本地启动
- 可查看结构化日志输出
- 基础测试数据可用（默认 `tenant_id`）

## 4. 测试分层

## 4.1 单元测试（后端）

- 请求参数校验
- 错误码映射逻辑
- 超时分支处理
- `request_id` 生成与透传

## 4.2 集成测试（后端 API）

- `chat/completions` 成功路径
- `chat/completions` 参数非法路径
- `chat/completions` 超时路径
- `healthz` 可用性

## 4.3 端到端联调（手工/脚本）

- 前端输入问题后收到回答
- 加载态正确显示并关闭
- 错误态提示可见且不崩溃
- 日志可用 `request_id` 串联一次请求

## 5. 用例矩阵（最小集）

| 用例ID | 场景 | 输入 | 期望结果 |
|---|---|---|---|
| TC-001 | 单轮问答成功 | 合法 `message` | 返回 200，含 `answer/request_id/latency_ms` |
| TC-002 | 参数缺失 | `message` 为空或缺失 | 返回 400，`error_code=INVALID_ARGUMENT` |
| TC-003 | 超时 | 人工注入慢响应 | 返回 408，`error_code=TIMEOUT` |
| TC-004 | 内部异常 | 人工注入异常 | 返回 500，`error_code=INTERNAL_ERROR` |
| TC-005 | 健康检查 | `GET /healthz` | 返回 200，`status=ok` |
| TC-006 | 日志完整性 | 任意请求 | 日志包含 `request_id/path/status_code/latency_ms` |

## 6. 通过标准（Exit Criteria）

- P0 用例全部通过（TC-001 ~ TC-006）
- 无阻断级缺陷（Blocker/Critical）
- 与 `docs/releases/v1.0/API_CONTRACT_V1.md` 契约一致
- 满足 `docs/foundation/ROADMAP.md` 的 `V1.0` 验收条目

## 7. 缺陷分级与处理

- `Blocker`：主链路不可用，必须修复后发布
- `Critical`：错误响应或数据异常，必须修复
- `Major`：非核心能力异常，可评估是否延期修复
- `Minor`：不影响发布，可进入后续迭代

## 8. 回归策略

- 每次变更至少回归 TC-001、TC-002、TC-005
- 涉及错误处理时追加回归 TC-003、TC-004
- 发布前完整执行 TC-001 ~ TC-006

## 9. 交付物

- 测试报告（通过/失败/阻塞）
- 缺陷列表与结论
- 与契约差异清单（若有）


