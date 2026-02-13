# Environment Variables - V1.0

## 1. 说明

本文件定义 `V1.0` 最小环境变量基线。  
原则：按环境配置、最小暴露、默认安全值。

## 2. 应用通用

| 变量名 | 必填 | 示例值 | 说明 |
|---|---|---|---|
| `APP_ENV` | 是 | `dev` | 运行环境：`dev/staging/prod` |
| `APP_NAME` | 是 | `aikai-backend` | 服务名 |
| `LOG_LEVEL` | 是 | `INFO` | 日志级别 |
| `REQUEST_TIMEOUT_MS` | 是 | `15000` | 请求超时时间 |
| `DEFAULT_EDITION` | 是 | `personal` | 默认版本形态 |
| `DEFAULT_TENANT_ID` | 是 | `tenant_personal_default` | 默认租户 ID |

## 3. 后端（FastAPI）

| 变量名 | 必填 | 示例值 | 说明 |
|---|---|---|---|
| `BACKEND_HOST` | 是 | `0.0.0.0` | 监听地址 |
| `BACKEND_PORT` | 是 | `8000` | 监听端口 |
| `CORS_ALLOW_ORIGINS` | 是 | `http://localhost:3000` | CORS 白名单 |
| `MODEL_PROVIDER` | 是 | `mock` | 模型供应商适配层标识 |
| `MODEL_API_KEY` | 否 | `***` | 模型服务密钥 |

## 4. 前端（Next.js）

| 变量名 | 必填 | 示例值 | 说明 |
|---|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | 是 | `http://localhost:8000` | 后端 API 基址 |
| `NEXT_PUBLIC_APP_ENV` | 是 | `dev` | 前端环境标识 |

## 5. 数据与缓存

| 变量名 | 必填 | 示例值 | 说明 |
|---|---|---|---|
| `DATABASE_URL` | 是 | `postgresql+psycopg://user:pass@postgres:5432/aikai` | 数据库连接串 |
| `REDIS_URL` | 否 | `redis://redis:6379/0` | Redis 连接串 |

## 6. 安全规则

- 敏感变量（如密钥）仅通过环境注入，不入库
- `.env` 文件仅用于本地开发，不提交真实密钥
- 生产环境建议接入 Secret Manager

## 7. 示例（本地开发）

```env
APP_ENV=dev
APP_NAME=aikai-backend
LOG_LEVEL=INFO
REQUEST_TIMEOUT_MS=15000
DEFAULT_EDITION=personal
DEFAULT_TENANT_ID=tenant_personal_default

BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000
CORS_ALLOW_ORIGINS=http://localhost:3000
MODEL_PROVIDER=mock
MODEL_API_KEY=

NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_APP_ENV=dev

DATABASE_URL=postgresql+psycopg://user:pass@localhost:5432/aikai
REDIS_URL=redis://localhost:6379/0
```

