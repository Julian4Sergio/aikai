# 服务器部署与更新指南（106.13.211.152 / root / SiliconFlow）

本文档对应以下脚本：

- `scripts/init_server.sh`：首次初始化部署（只执行一次）
- `scripts/update_server.sh`：后续代码更新发布（重复执行）

## 1. 适用范围

- 系统：`Ubuntu`（建议 `24.04 LTS`）
- 账号：`root`
- 服务地址：`106.13.211.152`
- 模型供应商：`SiliconFlow`
- 项目目录默认：`/opt/aikai`

## 2. 前置准备

执行前你需要准备：

1. 仓库地址（HTTPS 或 SSH）
2. `SILICONFLOW_API_KEY`
3. 服务器已放通 `80` 端口（网页访问）
4. 可用 SSH 登录 root

## 3. 首次初始化部署（init_server.sh）

### 3.1 上传或拉取代码

如果服务器上还没有仓库，先克隆到 `/opt/aikai`；如果已有仓库，进入仓库根目录即可。

### 3.2 赋予脚本可执行权限

```bash
cd /opt/aikai
chmod +x scripts/init_server.sh scripts/update_server.sh
```

### 3.3 可选：先做语法检查

```bash
bash -n scripts/init_server.sh
bash -n scripts/update_server.sh
```

### 3.4 执行初始化脚本

```bash
bash scripts/init_server.sh \
  --repo-url <你的Git仓库地址> \
  --siliconflow-api-key <你的SiliconFlowKey> \
  --server-host 106.13.211.152 \
  --branch main
```

### 3.5 初始化脚本会做什么

`init_server.sh` 执行顺序如下：

1. 安装系统依赖：`git/nginx/python3/nodejs` 等
2. 拉取代码到 `/opt/aikai`（或更新已存在仓库）
3. 创建后端虚拟环境并安装依赖
4. 生成后端配置文件 `backend/.env` 并注入 `SILICONFLOW_API_KEY`
5. 安装前端依赖并构建 `Next.js` 产物
6. 写入 systemd 服务：
   - `aikai-backend.service`
   - `aikai-frontend.service`
7. 写入 Nginx 配置并启用站点
8. 启动服务并做健康检查（本机和公网）

## 4. 后续更新发布（update_server.sh）

每次代码有更新后，在服务器执行：

```bash
cd /opt/aikai
bash scripts/update_server.sh \
  --server-host 106.13.211.152 \
  --branch main
```

`update_server.sh` 执行顺序如下：

1. 拉取远端最新代码
2. 更新后端依赖（`pip install -r requirements.txt`）
3. 更新前端依赖并重新构建（`npm ci && npm run build`）
4. 重启后端、前端服务并重载 Nginx
5. 执行健康检查

## 5. 常用排障命令

查看服务状态：

```bash
systemctl status aikai-backend --no-pager
systemctl status aikai-frontend --no-pager
```

查看日志：

```bash
journalctl -u aikai-backend -n 100 --no-pager
journalctl -u aikai-frontend -n 100 --no-pager
```

检查 Nginx 配置：

```bash
nginx -t
systemctl status nginx --no-pager
```

手动健康检查：

```bash
curl -fsS http://127.0.0.1:8000/healthz
curl -fsS http://106.13.211.152/healthz
```

## 6. 回滚建议（简化版）

如果更新后异常，建议执行：

1. 进入仓库并切回上一个稳定提交/tag
2. 再运行一次 `scripts/update_server.sh` 完成重建与重启

示例：

```bash
cd /opt/aikai
git log --oneline -n 10
git checkout <稳定提交或tag>
bash scripts/update_server.sh --server-host 106.13.211.152 --branch main
```

说明：若切到 tag 或 detached commit，不建议再使用 `--branch main` 拉取。可以改为固定版本部署方式（后续可再补一个专用回滚脚本）。
