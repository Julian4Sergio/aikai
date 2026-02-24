#!/usr/bin/env bash

set -euo pipefail

REPO_URL=""
SILICONFLOW_API_KEY=""
SERVER_HOST="106.13.211.152"
APP_DIR="/opt/aikai"
BRANCH="main"

usage() {
  cat <<'EOF'
Usage:
  bash scripts/init_server.sh \
    --repo-url <git-repo-url> \
    --siliconflow-api-key <key> \
    [--server-host 106.13.211.152] \
    [--app-dir /opt/aikai] \
    [--branch main]
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --repo-url)
      REPO_URL="${2:-}"
      shift 2
      ;;
    --siliconflow-api-key)
      SILICONFLOW_API_KEY="${2:-}"
      shift 2
      ;;
    --server-host)
      SERVER_HOST="${2:-}"
      shift 2
      ;;
    --app-dir)
      APP_DIR="${2:-}"
      shift 2
      ;;
    --branch)
      BRANCH="${2:-}"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage
      exit 1
      ;;
  esac
done

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Please run as root" >&2
  exit 1
fi

if [[ -z "$REPO_URL" ]]; then
  echo "Missing argument: --repo-url" >&2
  exit 1
fi

if [[ -z "$SILICONFLOW_API_KEY" ]]; then
  echo "Missing argument: --siliconflow-api-key" >&2
  exit 1
fi

upsert_env() {
  local file="$1"
  local key="$2"
  local value="$3"
  if grep -qE "^${key}=" "$file"; then
    sed -i "s|^${key}=.*|${key}=${value}|" "$file"
  else
    echo "${key}=${value}" >> "$file"
  fi
}

echo "[1/8] Installing dependencies..."
apt update
apt install -y git nginx python3 python3-venv python3-pip curl build-essential ca-certificates
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs

echo "[2/8] Pulling source code..."
mkdir -p "$(dirname "$APP_DIR")"
if [[ -d "$APP_DIR/.git" ]]; then
  git -C "$APP_DIR" fetch --all --prune
  git -C "$APP_DIR" checkout "$BRANCH"
  git -C "$APP_DIR" pull --ff-only origin "$BRANCH"
else
  git clone --branch "$BRANCH" "$REPO_URL" "$APP_DIR"
fi

echo "[3/8] Setting up backend..."
cd "$APP_DIR/backend"
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
cp -f .env.example .env

upsert_env .env APP_ENV prod
upsert_env .env BACKEND_HOST 127.0.0.1
upsert_env .env BACKEND_PORT 8000
upsert_env .env CORS_ALLOW_ORIGINS "http://${SERVER_HOST}"
upsert_env .env LLM_PROVIDER siliconflow
upsert_env .env SILICONFLOW_API_KEY "$SILICONFLOW_API_KEY"
upsert_env .env SILICONFLOW_BASE_URL https://api.siliconflow.cn/v1
upsert_env .env SILICONFLOW_MODEL Qwen/Qwen2.5-7B-Instruct

echo "[4/8] Setting up frontend..."
cd "$APP_DIR/frontend"
npm ci
cat > .env.production <<EOF
NEXT_PUBLIC_API_BASE_URL=http://${SERVER_HOST}
EOF
npm run build

echo "[5/8] Writing systemd services..."
cat > /etc/systemd/system/aikai-backend.service <<EOF
[Unit]
Description=aikai backend
After=network.target

[Service]
User=root
WorkingDirectory=${APP_DIR}/backend
EnvironmentFile=${APP_DIR}/backend/.env
ExecStart=${APP_DIR}/backend/.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

cat > /etc/systemd/system/aikai-frontend.service <<EOF
[Unit]
Description=aikai frontend
After=network.target

[Service]
User=root
WorkingDirectory=${APP_DIR}/frontend
Environment=NODE_ENV=production
ExecStart=/usr/bin/npm run start -- -H 127.0.0.1 -p 3000
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

echo "[6/8] Writing Nginx config..."
cat > /etc/nginx/sites-available/aikai <<EOF
server {
    listen 80;
    server_name ${SERVER_HOST};

    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_buffering off;
        proxy_read_timeout 600s;
    }

    location /healthz {
        proxy_pass http://127.0.0.1:8000/healthz;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
EOF

ln -sf /etc/nginx/sites-available/aikai /etc/nginx/sites-enabled/aikai
rm -f /etc/nginx/sites-enabled/default
nginx -t

echo "[7/8] Starting services..."
systemctl daemon-reload
systemctl enable --now aikai-backend aikai-frontend
systemctl reload nginx

echo "[8/8] Health checks..."
curl -fsS http://127.0.0.1:8000/healthz
curl -fsS "http://${SERVER_HOST}/healthz"

echo
echo "Init finished."
echo "Check service status:"
echo "  systemctl status aikai-backend --no-pager"
echo "  systemctl status aikai-frontend --no-pager"
