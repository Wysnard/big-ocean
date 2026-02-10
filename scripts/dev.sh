#!/bin/bash

# Start big-ocean development environment with Docker Compose
# Usage: ./scripts/dev.sh

set -e

echo "🚀 Starting big-ocean development environment..."
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env not found. Creating from template..."
    cat > .env << EOF
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

# Better Auth (REQUIRED - generate with: openssl rand -base64 32)
BETTER_AUTH_SECRET=your-32-character-secret-key-here
BETTER_AUTH_URL=http://localhost:4000

# Frontend
VITE_API_URL=http://localhost:4000
EOF
    echo "✅ Created .env - please add your ANTHROPIC_API_KEY"
    echo ""
fi

# Check if ANTHROPIC_API_KEY is set
if grep -q "sk-ant-your-api-key-here" .env; then
    echo "⚠️  WARNING: ANTHROPIC_API_KEY not configured in .env"
    echo "Please edit .env and set your Anthropic API key before running services."
    echo ""
fi

# Check if BETTER_AUTH_SECRET is set
if grep -q "your-32-character-secret-key-here" .env; then
    echo "⚠️  WARNING: BETTER_AUTH_SECRET not configured in .env"
    echo "Please edit .env and set your Better Auth secret (run: openssl rand -base64 32)"
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
echo "🌱 Auto-seeding database with test assessment..."
echo "   (Disable with: docker compose up instead of pnpm dev)"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

docker compose --profile seed --env-file .env up --build
