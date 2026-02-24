# API Contract V1.1

## 1. 版本与原则

- 版本前缀：`/api/v1`
- 向后兼容：`V1.0` 已发布接口继续可用
- 新增能力通过新增端点引入，不破坏已发布字段语义

## 2. 兼容性声明

- `POST /api/v1/chat/completions`：保持 `V1.0` 契约不变
- `GET /healthz`：保持不变
- `V1.1` 新增流式端点：`POST /api/v1/chat/stream`

## 3. 公共字段约定

- `tenant_id`: `string`，必填
- `edition`: `"personal" | "enterprise"`，必填（当前仍以 `personal` 为主）
- `request_id`: `string`，服务端生成并在日志中串联

## 4. 端点：POST /api/v1/chat/completions（兼容路径）

### 4.1 请求（与 V1.0 一致）

```json
{
  "message": "你好",
  "tenant_id": "tenant_personal_default",
  "edition": "personal"
}
```

### 4.2 成功响应（200）

```json
{
  "answer": "你好，我是 aikai 助手。",
  "request_id": "req_xxx",
  "latency_ms": 248
}
```

## 5. 端点：POST /api/v1/chat/stream（V1.1 新增）

### 5.1 请求

```json
{
  "message": "帮我总结这段文本",
  "tenant_id": "tenant_personal_default",
  "edition": "personal",
  "history": [
    { "role": "user", "content": "上一轮问题" },
    { "role": "assistant", "content": "上一轮回答" }
  ]
}
```

字段说明：

- `history`：可选，仅用于短窗口上下文；超出窗口部分由服务端裁剪

### 5.2 响应类型

- `Content-Type: text/event-stream`
- 事件流由以下事件组成：
  - `delta`：增量文本片段
  - `done`：生成完成
  - `error`：流式失败

### 5.3 SSE 示例

```text
event: delta
data: {"request_id":"req_xxx","delta":"你好，"}

event: delta
data: {"request_id":"req_xxx","delta":"这是总结结果。"}

event: done
data: {"request_id":"req_xxx","latency_ms":820}
```

## 6. 错误响应约定

非流式错误沿用 `V1.0`：

```json
{
  "error_code": "INVALID_ARGUMENT",
  "error_message": "message is required",
  "request_id": "req_xxx"
}
```

最小错误码集合：

- `INVALID_ARGUMENT`
- `TIMEOUT`
- `INTERNAL_ERROR`
- `CANCELLED`（V1.1 新增场景码，用于取消中止）

## 7. 中止/取消语义

- 客户端主动取消后，服务端应尽快停止生成
- 取消事件应写入日志并带 `request_id`
- 取消后不应继续推送 `delta`

## 8. 日志最小字段（V1.1）

- `request_id`
- `path`
- `tenant_id`
- `edition`
- `is_stream`
- `ttft_ms`
- `latency_ms`
- `status_code`
- `error_code`（失败时）
- `cancelled`（取消时）
