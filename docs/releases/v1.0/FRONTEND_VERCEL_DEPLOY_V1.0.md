# Frontend Vercel 部署说明 - V1.0

## 1. 目标

- 前端（`frontend/`）部署到 `Vercel`
- 后端（`FastAPI`）后续独立部署到服务器
- 前端通过环境变量连接后端 API

## 2. 你需要先做什么

1. 注册 Vercel 账号（建议直接用 GitHub 账号登录）
2. 确保仓库已推送到 GitHub（当前已满足）

## 3. Vercel 创建项目步骤

1. 打开 `https://vercel.com`
2. 点击 `Sign Up` 或 `Log In`，选择 `Continue with GitHub`
3. 授权 Vercel 访问你的 GitHub 仓库
4. 选择仓库：`Julian4Sergio/aikai`
5. 在 `Configure Project` 页面设置：
   - `Framework Preset`: `Next.js`
   - `Root Directory`: `frontend`
   - `Build Command`: `npm run build`（默认即可）
   - `Install Command`: `npm install`（默认即可）
6. 点击 `Deploy`

## 4. 环境变量配置（Vercel）

在 Vercel 项目设置 `Settings -> Environment Variables` 添加：

- `NEXT_PUBLIC_API_BASE_URL`
  - 当前前端是 mock，可先填：`https://example.com`
  - 后端上线后改成真实后端域名，如 `https://api.your-domain.com`
- `NEXT_PUBLIC_APP_ENV`
  - 建议：`production`

## 5. 后续接后端的方式

当前推荐架构：

- `Vercel`：部署 Next.js 前端
- 独立服务器：部署 `FastAPI + PostgreSQL + Redis`

前端请求后端时仅需更新：

- `NEXT_PUBLIC_API_BASE_URL`

无需迁移前端部署平台。

## 6. 常见问题

### Q1: 现在是纯前端，能先上线吗？

可以，当前页面使用 mock 交互，能直接发布展示。

### Q2: 用 Vercel 能不能跑 Python FastAPI？

不建议把主后端放在 Vercel 跑。  
你的项目技术栈更适合“前端 Vercel + 后端独立服务器”。

