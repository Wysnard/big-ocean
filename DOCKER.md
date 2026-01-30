# Docker Development Guide

This guide explains how to run the big-ocean application locally using Docker Compose.

## Quick Start

### Prerequisites

- Docker Desktop 4.0+ or Docker with Docker Compose plugin
- Git
- Anthropic API key

### Setup (First Time)

```bash
# 1. Clone the repository
git clone <repo-url>
cd big-ocean

# 2. Start all services
./scripts/dev.sh
# This creates .env.local and starts services

# 3. Add your Anthropic API key
# Edit .env.local and replace sk-ant-your-api-key-here with your actual key

# 4. Verify services are running
docker compose ps
curl http://localhost:4000/health  # Should return {"status":"ok"}
```

### Access the Application

- **Frontend**: http://localhost:3000
- **Backend RPC**: http://localhost:4000/rpc
- **Backend Health**: http://localhost:4000/health
- **Database**: localhost:5432 (PostgreSQL)
- **Cache**: localhost:6379 (Redis)

## Service Architecture

```
┌─────────────────────────────────────────┐
│ Frontend (TanStack Start)               │
│ Port: 3000 (Vite dev server)           │
│ Hot reload on file changes             │
└─────────────────────────────────────────┘
                  │
                  │ HTTP/RPC
                  ▼
┌─────────────────────────────────────────┐
│ Backend API (Effect-ts + Node.js)       │
│ Port: 4000 (RPC + health endpoint)     │
│ Hot reload on file changes (tsx watch)  │
└─────────────────────────────────────────┘
       │                          │
       │ SQL                      │ Cache
       ▼                          ▼
    PostgreSQL 16              Redis 7
   Port: 5432                Port: 6379
```

## Common Commands

### Starting & Stopping

```bash
# Start all services (recommended way)
./scripts/dev.sh

# Or directly with docker compose
docker compose up

# Stop services (preserves data)
docker compose stop
# or
./scripts/dev-stop.sh

# Restart after stopping
docker compose start

# Stop and remove containers (keeps data)
docker compose down

# Stop and remove EVERYTHING including data
docker compose down -v
# or
./scripts/dev-reset.sh
```

### Viewing Logs

```bash
# View all logs
docker compose logs -f

# View specific service logs
docker compose logs -f backend        # Backend API
docker compose logs -f frontend       # Frontend
docker compose logs -f postgres       # Database
docker compose logs -f redis          # Cache

# View last 50 lines of backend logs
docker compose logs -n 50 backend
```

### Accessing Services

```bash
# Shell into backend container
docker compose exec backend sh

# Shell into frontend container
docker compose exec frontend sh

# Access PostgreSQL database
docker compose exec postgres psql -U dev -d bigocean

# Access Redis
docker compose exec redis redis-cli

# List all running containers
docker compose ps

# Show detailed container info
docker compose ps -a
```

### Testing Health Checks

```bash
# Test backend health check
curl http://localhost:4000/health

# Test database connectivity
docker compose exec backend curl http://localhost:4000/health

# Test Redis connectivity
docker compose exec redis redis-cli ping

# Test PostgreSQL connectivity
docker compose exec postgres pg_isready -U dev
```

### Rebuilding Images

```bash
# Rebuild all images (after dependency changes)
docker compose build

# Rebuild specific service
docker compose build backend

# Force rebuild (no cache)
docker compose build --no-cache
```

## Development Workflow

### Making Code Changes

The development environment supports hot reload for both backend and frontend:

**Backend (Node.js + Effect-ts)**:
1. Edit files in `apps/api/src/`
2. Changes detected by `tsx watch` (automatic file watching)
3. Server restarts automatically (~2 seconds)
4. View logs: `docker compose logs -f backend`

**Frontend (React + Vite)**:
1. Edit files in `apps/front/src/`
2. Changes detected by Vite HMR (Hot Module Replacement)
3. Browser automatically refreshes (no full page reload)
4. View logs: `docker compose logs -f frontend`

### Example: Adding a Backend Handler

```bash
# 1. Make sure services are running
docker compose up &

# 2. Edit backend source
vi apps/api/src/handlers/assessment.ts

# 3. Save file - backend automatically restarts
# Watch logs in another terminal
docker compose logs -f backend

# 4. Test changes
curl -X POST http://localhost:4000/rpc \
  -H "Content-Type: application/json" \
  -d '{"procedure": "StartAssessment", "input": {"userId": "test"}}'
```

## Database Management

### Creating Database Backups

```bash
# Backup PostgreSQL database
docker compose exec postgres pg_dump -U dev bigocean > backup.sql

# Restore from backup
docker compose exec -T postgres psql -U dev bigocean < backup.sql
```

### Running Database Queries

```bash
# Interactive PostgreSQL shell
docker compose exec postgres psql -U dev -d bigocean

# Run SQL file
docker compose exec postgres psql -U dev -d bigocean -f /script.sql

# List tables
docker compose exec postgres psql -U dev -d bigocean -c "\dt"

# Describe table
docker compose exec postgres psql -U dev -d bigocean -c "\d sessions"
```

### Resetting the Database

```bash
# Option 1: Stop services but keep data
docker compose stop
docker compose start

# Option 2: Full reset (remove all data)
./scripts/dev-reset.sh

# Then restart
./scripts/dev.sh
```

## Troubleshooting

### Port Already in Use

```bash
# Check what's using a port
lsof -i :3000   # Frontend
lsof -i :4000   # Backend
lsof -i :5432   # PostgreSQL
lsof -i :6379   # Redis

# Kill process using port (be careful!)
kill -9 <PID>

# Or change port in compose.yaml and restart
```

### Services Won't Start

```bash
# Check service status
docker compose ps

# View service logs for errors
docker compose logs backend
docker compose logs postgres
docker compose logs redis

# Check Docker daemon is running
docker version

# Verify Docker has enough resources
docker system df
```

### Database Connection Refused

```bash
# Wait for PostgreSQL to be healthy
docker compose logs postgres

# PostgreSQL takes 10-15 seconds to start
# Health check: pg_isready command

# Force restart database
docker compose restart postgres
```

### Hot Reload Not Working

```bash
# Verify volume mounts
docker compose exec backend df /app/apps/api/src

# Check tsx watch is running
docker compose exec backend ps aux | grep tsx

# Restart backend to reset tsx watch
docker compose restart backend

# Check file permissions
ls -la apps/api/src/
```

### Frontend Won't Load

```bash
# Check Vite dev server
docker compose logs frontend

# Verify port 3000 is accessible
curl http://localhost:3000

# Check network connectivity
docker compose exec frontend curl http://backend:4000/health

# Restart frontend
docker compose restart frontend
```

### Out of Disk Space

```bash
# See Docker disk usage
docker system df

# Remove unused images
docker image prune

# Remove unused volumes
docker volume prune

# Full cleanup (warning: removes everything!)
docker system prune -a
```

### Environment Variables Not Loading

```bash
# Verify .env.local exists
ls -la .env.local

# Check variables are loaded in container
docker compose exec backend env | grep DATABASE_URL

# Rebuild containers
docker compose build --no-cache
docker compose up
```

## File Mounts and Volumes

### Source Code Mounts (Hot Reload)

- **Backend**: `./apps/api/src` → `/app/apps/api/src`
- **Frontend**: `./apps/front/src` → `/app/apps/front/src`
- **Packages**: `./packages` → `/app/packages`

Changes to mounted directories are immediately reflected in running containers.

### Named Volumes (Data Persistence)

- **postgres_data**: PostgreSQL database files
- **redis_data**: Redis snapshot files

Named volumes persist across container restarts unless explicitly removed with `docker compose down -v`.

### Logs

Backend logs are mounted to:
- `./apps/api/logs/` → `/app/apps/api/logs/`

View logs:
```bash
tail -f apps/api/logs/error.log
tail -f apps/api/logs/all.log
```

## Docker Compose Configuration

The main configuration file is `compose.yaml` in the project root.

### Services

**PostgreSQL (postgres)**
- Image: postgres:16-alpine
- Port: 5432
- Health check: pg_isready
- Volume: postgres_data (persisted)

**Redis (redis)**
- Image: redis:7-alpine
- Port: 6379
- Health check: redis-cli ping
- Volume: redis_data (persisted)

**Backend API (backend)**
- Build: apps/api/Dockerfile (development stage)
- Port: 4000
- Health check: curl /health
- Volumes: src (hot reload), packages, logs
- Depends on: postgres, redis

**Frontend (frontend)**
- Build: apps/front/Dockerfile (development stage)
- Port: 3000
- Volumes: src (hot reload), packages
- Depends on: backend

### Networks

All services are connected to a custom Docker network `bigocean-network` for service-to-service communication:
- Backend can access database as `postgres:5432`
- Backend can access cache as `redis:6379`
- Frontend can access backend as `backend:4000`

## Environment Variables

### Required

- `ANTHROPIC_API_KEY`: Anthropic API key for Claude integration (from https://console.anthropic.com)

### Database

- `POSTGRES_DB`: PostgreSQL database name (default: bigocean)
- `POSTGRES_USER`: PostgreSQL username (default: dev)
- `POSTGRES_PASSWORD`: PostgreSQL password (default: devpassword)
- `DATABASE_URL`: Full PostgreSQL connection string

### Redis

- `REDIS_URL`: Redis connection URL (default: redis://redis:6379)

### Node

- `NODE_ENV`: Environment (default: development)
- `PORT`: Backend port (default: 4000)
- `HOST`: Backend host (default: 0.0.0.0)

## Performance Tips

### Reduce Build Time

```bash
# Docker caches layers - unchanged layers rebuild faster
# Keep package.json files stable to cache dependencies

# Use --no-cache only when necessary
docker compose build --no-cache
```

### Reduce Memory Usage

```bash
# Limit memory per service in compose.yaml
# Example:
# services:
#   backend:
#     mem_limit: 1g

# Check current usage
docker stats
```

### Speed Up Database

```bash
# PostgreSQL can be slow on first queries
# Connect to warm up cache:
docker compose exec postgres psql -U dev -d bigocean -c "SELECT 1;"
```

## CI/CD Integration

### Running in CI

```bash
# Start services in background
docker compose up -d

# Wait for services to be healthy
docker compose exec -T postgres pg_isready -U dev

# Run tests
docker compose exec -T backend pnpm test

# Stop services
docker compose down -v
```

### Environment Secrets in CI

Never commit `.env.local` to git. In CI/CD:

```bash
# Create .env.local from secrets
echo "ANTHROPIC_API_KEY=${{ secrets.ANTHROPIC_API_KEY }}" > .env.local

# Start services
docker compose up -d
```

## Related Documentation

- **README.md**: Project overview and setup
- **CLAUDE.md**: Development guidelines and patterns
- **Story 1.4**: Docker Compose implementation details
- **Docker Docs**: https://docs.docker.com/compose/

## Support

For issues:
1. Check logs: `docker compose logs <service>`
2. Verify all services are healthy: `docker compose ps`
3. Check this troubleshooting guide
4. File an issue with complete logs and error messages
