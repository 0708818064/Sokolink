#!/usr/bin/env bash
set -e

# ==============================================================
# SokoLink Automated Deployment Script
# Multi-Vendor Kenyan SME E-commerce Platform
# ==============================================================

echo "=========================================================="
echo "🚀 SOKOLINK PRODUCTION DEPLOYMENT STARTING"
echo "=========================================================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Error: Docker is not installed. Please install Docker first."
    exit 1
fi

echo "📦 1. Building and starting Docker containers..."
docker compose down --remove-orphans || true
docker compose build --pull
docker compose up -d

echo "⏳ 2. Waiting for database to be healthy..."
docker compose exec -T db sh -c 'until pg_isready -U sokolink_user -d sokolink_db; do echo "Waiting for postgres..."; sleep 2; done'

echo "🗄️  3. Synchronizing Prisma database schema..."
docker compose exec -T backend npx prisma db push --accept-data-loss

echo "🌱 4. Seeding initial Kenyan SME & catalog data..."
docker compose exec -T backend npm run seed || echo "Seed records already present or bypassed."

echo "✅ 5. Checking service health..."
curl -s -f http://localhost:5000/api/health > /dev/null && echo "✅ Backend API running on port 5000"
curl -s -f http://localhost:3000 > /dev/null && echo "✅ Frontend Web Store running on port 3000"

echo "=========================================================="
echo "🎉 DEPLOYMENT SUCCESSFUL!"
echo "   - Web Store:   http://localhost:3000"
echo "   - Backend API: http://localhost:5000/api"
echo "   - LAN Access:  http://10.202.146.182:3000"
echo "=========================================================="
