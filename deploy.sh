#!/bin/bash
set -e

echo "==> Pull do repositório"
git pull origin main

echo "==> Build do frontend (local, não na VPS)"
cd frontend
npm install
npm run build
cd ..

echo "==> Sincronizando dist para o diretório Nginx"
rsync -av --delete frontend/dist/ /var/www/campanha/dist/

echo "==> Rebuild e restart do backend"
docker compose build api
docker compose up -d api

echo "==> Reload Nginx"
sudo nginx -t && sudo systemctl reload nginx

echo "Deploy concluído"
