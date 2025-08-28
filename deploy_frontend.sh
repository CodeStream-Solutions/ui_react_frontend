#!/usr/bin/env bash
set -euo pipefail

# Go to frontend source directory
cd /var/www/frontend/ui_react_frontend

git pull

echo "➡️ Installing dependencies..."
npm install

echo "➡️ Building project..."
npm run build

echo "➡️ Publishing build..."
REL="/var/www/frontend/releases/$(date +%Y%m%d%H%M%S)"
mkdir -p "$REL"
cp -a dist/. "$REL"/
ln -sfn "$REL" /var/www/frontend/current

echo "➡️ Reloading Nginx..."
sudo systemctl reload nginx

echo "✅ Deployment complete! Build is now live."

