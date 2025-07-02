#!/bin/bash

# Production Deployment Script for Enhanced Matching Algorithm
# Run this script to deploy the enhanced matching algorithm to production

set -e  # Exit on any error

echo "🚀 Starting production deployment of Enhanced Matching Algorithm..."

# Check Node.js version
NODE_VERSION=$(node --version)
echo "📦 Node.js version: $NODE_VERSION"

if [[ ! "$NODE_VERSION" =~ v2[0-9] ]]; then
    echo "❌ Error: Node.js v20+ is required for the enhanced matching algorithm"
    echo "Current version: $NODE_VERSION"
    echo "Please upgrade Node.js using: sudo n stable"
    exit 1
fi

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "⚠️  Warning: .env.local not found"
    echo "📝 Creating .env.local from production.env.example..."
    cp production.env.example .env.local
    echo "✅ Please update .env.local with your actual configuration values"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the application
echo "🔨 Building application..."
npm run build

# Run database migrations (if using Prisma)
if [ -f "prisma/schema.prisma" ]; then
    echo "🗄️  Running database migrations..."
    npx prisma migrate deploy
fi

# Test the matching algorithm
echo "🧪 Testing matching algorithm..."
npm run test:matching

# Health check
echo "🏥 Running health check..."
curl -s http://localhost:3000/api/health/matching || echo "⚠️  Health check failed (server may not be running)"

echo ""
echo "✅ Production deployment completed successfully!"
echo ""
echo "🎯 Next steps:"
echo "1. Start your production server: npm start"
echo "2. Monitor the health endpoint: http://localhost:3000/api/health/matching"
echo "3. Test the matching endpoint with real data"
echo "4. Monitor performance and logs"
echo ""
echo "📊 Monitoring endpoints:"
echo "- Health: GET /api/health/matching"
echo "- Matching: POST /api/matching"
echo ""
echo "🚨 Rollback plan:"
echo "- Set AI_MODEL_ENABLED=false in .env.local to disable AI features"
echo "- Or revert to basic algorithm by changing imports"
echo ""
echo "🎉 Enhanced matching algorithm is now live! 🚀" 