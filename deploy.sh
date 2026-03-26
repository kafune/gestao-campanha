#!/bin/bash
set -euo pipefail

FRONTEND_DIST="/var/www/gestao-campanha/dist"
COMPOSE_DIR="$(dirname "$(realpath "$0")")"

echo "==> [1/5] Pull do repositório"
cd "$COMPOSE_DIR"
git pull origin main

echo "==> [2/5] Build do frontend"
cd "$COMPOSE_DIR/frontend"
bun install
bun run build

echo "==> [3/5] Copiando dist para o diretório Nginx"
mkdir -p "$FRONTEND_DIST"
rsync -a --delete "$COMPOSE_DIR/frontend/dist/" "$FRONTEND_DIST/"

echo "==> [4/5] Rebuild e restart do backend"
cd "$COMPOSE_DIR"
docker compose build api
docker compose up -d api

echo "==> [5/5] Reload do Nginx"
sudo nginx -t && sudo systemctl reload nginx

echo ""
echo "Deploy concluído com sucesso!"
