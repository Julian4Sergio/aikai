#!/usr/bin/env bash

set -euo pipefail

APP_DIR="/opt/aikai"
BRANCH="main"
SERVER_HOST="106.13.211.152"

usage() {
  cat <<'EOF'
Usage:
  bash scripts/update_server.sh \
    [--app-dir /opt/aikai] \
    [--branch main] \
    [--server-host 106.13.211.152]
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --app-dir)
      APP_DIR="${2:-}"
      shift 2
      ;;
    --branch)
      BRANCH="${2:-}"
      shift 2
      ;;
    --server-host)
      SERVER_HOST="${2:-}"
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

if [[ ! -d "$APP_DIR/.git" ]]; then
  echo "Git repository not found: $APP_DIR" >&2
  exit 1
fi

echo "[1/6] Pulling latest code..."
git -C "$APP_DIR" fetch --all --prune
git -C "$APP_DIR" checkout "$BRANCH"
git -C "$APP_DIR" pull --ff-only origin "$BRANCH"

echo "[2/6] Updating backend dependencies..."
cd "$APP_DIR/backend"
if [[ ! -x .venv/bin/python ]]; then
  python3 -m venv .venv
fi
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

echo "[3/6] Updating frontend and building..."
cd "$APP_DIR/frontend"
npm ci
npm run build

echo "[4/6] Restarting services..."
systemctl daemon-reload
systemctl restart aikai-backend
systemctl restart aikai-frontend
systemctl reload nginx

echo "[5/6] Health checks..."
curl -fsS http://127.0.0.1:8000/healthz
curl -fsS "http://${SERVER_HOST}/healthz"

echo "[6/6] Done."
echo "Check logs:"
echo "  journalctl -u aikai-backend -n 100 --no-pager"
echo "  journalctl -u aikai-frontend -n 100 --no-pager"
