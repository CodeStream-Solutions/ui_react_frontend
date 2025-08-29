#!/usr/bin/env bash
set -euo pipefail

# Function to handle errors
handle_error() {
    echo "❌ Deployment failed at step: $1"
    exit 1
}

echo "🚀 Starting frontend deployment..."

# Go to frontend source directory
cd /var/www/frontend/ui_react_frontend || handle_error "Change directory"

echo "➡️ Pulling latest code..."
git pull || handle_error "Git pull"

echo "➡️ Sleeping for 10 seconds..."
sleep 10


echo "➡️ Checking disk space..."
df -h /var/www/frontend/ | tail -1

echo "➡️ Cleaning up old releases (keeping last 5)..."
cd /var/www/frontend/releases
ls -t | tail -n +6 | xargs -r rm -rf
cd /var/www/frontend/ui_react_frontend

echo "➡️ Sleeping for 10 seconds..."
sleep 10

echo "➡️ Installing dependencies..."
npm ci || handle_error "NPM install"

echo "➡️ Building project..."
npm run build || handle_error "Build"

echo "➡️ Sleeping for 30 seconds..."
sleep 30

echo "➡️ Checking build output..."
if [ ! -d "dist" ]; then
    handle_error "Build output directory not found"
fi

echo "➡️ Publishing build..."
REL="/var/www/frontend/releases/$(date +%Y%m%d%H%M%S)"
mkdir -p "$REL" || handle_error "Create release directory"
cp -a dist/. "$REL"/ || handle_error "Copy build files"
ln -sfn "$REL" /var/www/frontend/current || handle_error "Update symlink"

echo "➡️ Reloading Nginx..."
sudo systemctl reload nginx || handle_error "Nginx reload"

echo "✅ Deployment complete! Build is now live."
echo "📁 Release location: $REL"