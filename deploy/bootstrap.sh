#!/usr/bin/env bash
# One-time app directory setup, run as the deploy user (no sudo).
# Creates shared/.env with generated secrets unless it already exists.
set -euo pipefail

APP_DIR=/var/www/home-service
ENV_FILE="$APP_DIR/shared/.env"

mkdir -p "$APP_DIR/releases" "$APP_DIR/shared"

if [[ -f "$ENV_FILE" ]]; then
  echo "$ENV_FILE already exists, leaving it unchanged"
  exit 0
fi

umask 077
cat >"$ENV_FILE" <<EOF
NODE_ENV=production
HOST=127.0.0.1
PORT=5090
JWT_SECRET=$(openssl rand -hex 48)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=$(openssl rand -base64 18 | tr -d '/+=')
CORS_ORIGINS=https://home-service.annaniks.com
STORE_FILE=$APP_DIR/shared/store.json
EOF
chmod 600 "$ENV_FILE"

echo "Created $ENV_FILE (admin password is stored there)"
