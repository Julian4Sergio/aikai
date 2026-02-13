# API Contract V1

## 1. 版本与原则

- 版本前缀：`/api/v1`
- 契约优先：先冻结请求/响应，再推进实现
- 响应统一：成功与失败均返回 `request_id`
- 向后兼容：`V1.x` 内尽量新增字段，不破坏已发布字段语义

## 2. 公共约定

### 2.1 Headers

- `Content-Type: application/json`
- `X-Request-Id`（可选，客户端可传；服务端可回填或透传）

### 2.2 字段约束

- `tenant_id`：`string`，必填（`V1.0` 可使用固定默认租户）
- `edition`：`"personal" | "enterprise"`，`V1.0` 固定 `personal`
- `request_id`：`string`，服务端生成并写入日志

### 2.3 错误响应结构

```json
{
  "error_code": "STRING_CODE",
  "error_message": "human readable message",
  "request_id": "req_xxx"
}
```

## 3. 接口：POST /api/v1/chat/completions

### 3.1 请求

```json
{
  "message": "你好，介绍一下你自己",
  "tenant_id": "tenant_personal_default",
  "edition": "personal"
}
```

字段说明：

- `message`: `string`，必填，1..8000 字符
- `tenant_id`: `string`，必填
- `edition`: `enum`，必填

### 3.2 成功响应（200）

```json
{
  "answer": "我是 aikai 的助手...",
  "request_id": "req_01JXXXX",
  "latency_ms": 248
}
```

### 3.3 失败响应

- `400 Bad Request`：参数不合法
- `408 Request Timeout`：推理或上游调用超时
- `500 Internal Server Error`：未分类内部错误

示例（400）：

```json
{
  "error_code": "INVALID_ARGUMENT",
  "error_message": "message is required",
  "request_id": "req_01JXXXX"
}
```

## 4. 接口：GET /healthz

### 4.1 成功响应（200）

```json
{
  "status": "ok",
  "request_id": "req_01JXXXX"
}
```

说明：

- 仅用于存活检查与基础运行态探测
- `V1.0` 不强制暴露依赖详细状态

## 5. 错误码最小集合（V1.0）

- `INVALID_ARGUMENT`：参数非法或缺失
- `TIMEOUT`：内部处理或上游调用超时
- `INTERNAL_ERROR`：内部未分类错误

## 6. 日志字段基线

每次请求至少记录：

- `timestamp`
- `level`
- `request_id`
- `path`
- `method`
- `tenant_id`
- `edition`
- `latency_ms`
- `status_code`
- `error_code`（失败时）

## 7. 变更规则（V1.x）

- 可以新增可选字段，不删除既有字段
- 不修改既有错误码语义
- 破坏性变更必须升级主版本并提前公告

