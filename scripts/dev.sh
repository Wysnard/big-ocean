#!/bin/bash

# Start big-ocean development environment with Docker Compose
# Usage: ./scripts/dev.sh

set -e

echo "🚀 Starting big-ocean development environment..."
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "⚠️  .env.local not found. Creating from template..."
    cat > .env.local << EOF
# Database Configuration
POSTGRES_DB=bigocean
POSTGRES_USER=dev
POSTGRES_PASSWORD=devpassword
DATABASE_URL=postgres://dev:devpassword@postgres:5432/bigocean

# Redis Configuration
REDIS_URL=redis://redis:6379

# LLM Integration (REQUIRED - get from Anthropic console)
ANTHROPIC_API_KEY=sk-ant-your-api-key-here

# Node Environment
NODE_ENV=development

# Server Configuration
PORT=4000
HOST=0.0.0.0
EOF
    echo "✅ Created .env.local - please add your ANTHROPIC_API_KEY"
    echo ""
fi

# Check if ANTHROPIC_API_KEY is set
if grep -q "sk-ant-your-api-key-here" .env.local; then
    echo "⚠️  WARNING: ANTHROPIC_API_KEY not configured in .env.local"
    echo "Please edit .env.local and set your Anthropic API key before running services."
    echo ""
fi

echo "📦 Starting services (PostgreSQL, Redis, Backend API, Frontend)..."
echo ""
echo "Services will be available at:"
echo "  🌐 Frontend:       http://localhost:3000"
echo "  🔌 Backend API:    http://localhost:4000"
echo "  🗄️  PostgreSQL:     localhost:5432"
echo "  💾 Redis:         localhost:6379"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

docker compose --env-file .env.local up
