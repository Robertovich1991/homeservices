#!/usr/bin/env bash
# Activates an already extracted release on the server.
# Usage: bash /var/www/home-service/releases/<release-id>/deploy/remote-deploy.sh
set -euo pipefail

APP_DIR=/var/www/home-service
RELEASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HEALTH_URL=http://127.0.0.1:5090/api/health
KEEP_RELEASES=5

if [[ ! -f "$APP_DIR/shared/.env" ]]; then
  echo "Missing $APP_DIR/shared/.env - run deploy/bootstrap.sh first" >&2
  exit 1
fi

echo "Installing server dependencies in $RELEASE_DIR"
cd "$RELEASE_DIR/server"
npm ci --omit=dev --no-audit --no-fund

switch_current() {
  ln -sfn "$1" "$APP_DIR/current.tmp"
  mv -Tf "$APP_DIR/current.tmp" "$APP_DIR/current"
}

healthy() {
  for _ in $(seq 1 15); do
    if curl -fsS "$HEALTH_URL" >/dev/null 2>&1; then
      return 0
    fi
    sleep 2
  done
  return 1
}

PREVIOUS="$(readlink -f "$APP_DIR/current" 2>/dev/null || true)"

switch_current "$RELEASE_DIR"
pm2 startOrReload "$RELEASE_DIR/deploy/ecosystem.config.js" --update-env

if ! healthy; then
  echo "Health check failed for $RELEASE_DIR" >&2
  pm2 logs home-service-api --lines 40 --nostream || true
  if [[ -n "$PREVIOUS" && -d "$PREVIOUS" && "$PREVIOUS" != "$RELEASE_DIR" ]]; then
    echo "Rolling back to $PREVIOUS" >&2
    switch_current "$PREVIOUS"
    pm2 startOrReload "$PREVIOUS/deploy/ecosystem.config.js" --update-env
  fi
  exit 1
fi

pm2 save >/dev/null

cd "$APP_DIR/releases"
ls -1t | tail -n +"$((KEEP_RELEASES + 1))" | while read -r old; do
  if [[ "$APP_DIR/releases/$old" != "$RELEASE_DIR" ]]; then
    rm -rf -- "$APP_DIR/releases/$old"
  fi
done

echo "Deployed $(basename "$RELEASE_DIR")"
