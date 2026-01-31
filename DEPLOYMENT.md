# Railway Deployment Guide

## Required Environment Variables

### Backend (api service)

**Required:**
- `DATABASE_URL` - PostgreSQL connection string
  - Format: `postgresql://user:password@host:port/database`
  - Provided by Railway Postgres plugin
- `ANTHROPIC_API_KEY` - Claude API key
  - Format: `sk-ant-api03-...`
  - Get from: https://console.anthropic.com/settings/keys
- `BETTER_AUTH_SECRET` - Authentication secret key
  - Format: Random 32+ character string
  - Generate: `openssl rand -base64 32`
- `BETTER_AUTH_URL` - Full API URL for Better Auth
  - Format: `https://api-production-xxxx.up.railway.app`

**Optional:**
- `PORT` - Server port (default: 8080 on Railway)
- `LOG_LEVEL` - Logging level (default: "info")
- `NODE_ENV` - Set to "production" (Railway sets this automatically)

### Frontend (front service)

**Required:**
- `VITE_API_URL` - Backend API URL
  - Format: `https://api-production-xxxx.up.railway.app`

**Optional:**
- `PORT` - Server port (default: 8080 on Railway)
- `NODE_ENV` - Set to "production" (Railway sets this automatically)

## Service URLs

- **Backend API:** https://api-production-f7de.up.railway.app
- **Frontend:** https://front-production-ee67.up.railway.app

## Health Checks

- **Backend:** `GET /health` → `{"status":"ok","timestamp":"..."}`
- **Frontend:** `GET /` → HTML page (200 OK)

## Deployment Process

1. Push to `master` branch triggers automatic deployment
2. Railway builds Docker images using respective Dockerfiles
3. Services start with environment variables from Railway dashboard
4. Health checks verify deployment success

## Troubleshooting

**Build fails:**
- Check Railway build logs
- Verify all workspace packages are copied in Dockerfile
- Ensure pnpm-lock.yaml is up to date

**Runtime fails:**
- Check deployment logs: `railway logs --service <api|front>`
- Verify all required environment variables are set
- Check health endpoint responds correctly

## Key Changes in This Deployment Fix

### Frontend Dockerfile
- Added `packages/database/package.json` to all stages
- Fixed final production runtime stage to include node_modules
- Changed from `nitro-nightly@latest` to stable `nitro@^2.9.7`
- Updated port exposure to 8080 (Railway default)

### Backend Dockerfile
- Added `NODE_ENV=production` environment variable
- Improved health check using wget instead of inline Node.js
- Updated port exposure documentation (reads from PORT env var)

### Railway Configuration
- Added health check paths for both services
- Frontend health check: `/`
- Backend health check: `/health`

### Effect Package Versions
- Pinned all Effect packages to specific versions with caret ranges
- Prevents breaking changes from "latest" versions
- Ensures deterministic builds

## Local Testing with Docker

Before pushing to Railway, test locally:

```bash
# Build and run frontend
docker build -f apps/front/Dockerfile -t big-ocean-front .
docker run -p 8080:8080 -e PORT=8080 big-ocean-front

# Build and run backend
docker build -f apps/api/Dockerfile -t big-ocean-api .
docker run -p 8080:8080 -e PORT=8080 big-ocean-api

# Test health endpoints
curl http://localhost:8080/health  # Backend
curl http://localhost:8080/        # Frontend
```

## Docker Compose Development

For full local development with all services:

```bash
./scripts/dev.sh           # Start all services
docker compose logs -f     # View all logs
./scripts/dev-reset.sh     # Full reset with data wipe
```

See [DOCKER.md](./DOCKER.md) for comprehensive Docker development guide.
