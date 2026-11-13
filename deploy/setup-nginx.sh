#!/usr/bin/env bash
# One-time nginx + Let's Encrypt setup. Safe to re-run.
# Usage: sudo bash /var/www/home-service/current/deploy/setup-nginx.sh
set -euo pipefail

if [[ $EUID -ne 0 ]]; then
  echo "Run with sudo" >&2
  exit 1
fi

SRC_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/nginx"
SERVER_IP=159.223.234.89
DOMAINS=(home-service.annaniks.com home-service-api.annaniks.com)

for domain in "${DOMAINS[@]}"; do
  target="/etc/nginx/sites-available/$domain"
  # Certbot edits the installed file, so never overwrite it once it exists.
  if [[ ! -f "$target" ]]; then
    install -m 644 "$SRC_DIR/$domain.conf" "$target"
    echo "Installed $target"
  fi
  ln -sfn "$target" "/etc/nginx/sites-enabled/$domain"
done

nginx -t
systemctl reload nginx

for domain in "${DOMAINS[@]}"; do
  resolved="$(getent ahostsv4 "$domain" | awk 'NR==1 {print $1}' || true)"
  if [[ "$resolved" != "$SERVER_IP" ]]; then
    echo "Skipping TLS for $domain: DNS resolves to '${resolved:-nothing}', expected $SERVER_IP" >&2
    continue
  fi
  certbot --nginx -d "$domain" --redirect --non-interactive --agree-tos --keep-until-expiring
done

nginx -t
systemctl reload nginx
echo "nginx setup finished"
