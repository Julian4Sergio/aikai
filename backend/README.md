# backend 本地运行说明（V1.0）

## 1. 安装依赖

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
```

## 2. 启动服务

```powershell
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

## 3. 快速验证

- 健康检查：`GET http://localhost:8000/healthz`
- 问答接口：`POST http://localhost:8000/api/v1/chat/completions`

请求体示例：

```json
{
  "message": "你好，给我一句总结",
  "tenant_id": "tenant_personal_default",
  "edition": "personal"
}
```
