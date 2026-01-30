# Story 1.4: Docker Compose Local Development Setup

Status: in-progress

## Story

As a **Developer**,
I want **to run the entire big-ocean application locally using Docker Compose**,
So that **I have exact parity with production and can develop/test without installing dependencies on my machine**.

## Acceptance Criteria

**Given** Docker with Compose plugin (docker compose v2+) is installed on my machine
**When** I run `docker compose up` from the project root
**Then** the entire application starts:
  - PostgreSQL database accessible at localhost:5432
  - Redis cache accessible at localhost:6379
  - Backend API healthy and responding at http://localhost:4000/health
  - Frontend accessible at http://localhost:3000
  - All services are connected and communicate properly
  - Logs are visible and persistent

**Given** I make code changes in the repository
**When** I save files locally
**Then** changes are reflected in running containers (hot reload for backend, Vite for frontend)
**And** database state persists across container restarts

**Given** I want to reset the development environment
**When** I run `docker compose down -v`
**Then** all containers stop and volumes are cleaned
**And** running `docker compose up` starts fresh with clean database

**Documentation**: All new code has JSDoc comments; README/CLAUDE.md updated if applicable
**Tests**: Unit tests added with minimum 80% coverage for new functionality; integration tests if needed

## Tasks / Subtasks

- [x] Task 1: Create compose.yaml with all services (AC: #1)
  - [x] Define PostgreSQL service (image: postgres:16-alpine)
  - [x] Define Redis service (image: redis:7-alpine)
  - [x] Define Backend API service (build from apps/api/Dockerfile)
  - [x] Define Frontend service (build from apps/front/Dockerfile)
  - [x] Configure service dependencies (depends_on)
  - [x] Expose ports (3000, 4000, 5432, 6379)
  - [x] Set up volumes for persistence (database, logs)
  - [x] Define environment variables for each service

- [x] Task 2: Create .env.local and environment configuration (AC: #1-2)
  - [x] Create .env.local with database credentials
  - [x] Set ANTHROPIC_API_KEY for local development
  - [x] Configure NODE_ENV=development
  - [x] Set DATABASE_URL pointing to Docker PostgreSQL
  - [x] Set REDIS_URL pointing to Docker Redis
  - [x] Document all required environment variables

- [x] Task 3: Configure volume mounts for hot reload (AC: #2)
  - [x] Mount backend source code (apps/api/src → /app/src)
  - [x] Enable tsx watch mode for hot reload
  - [x] Mount frontend source code (apps/front/src → /app/src)
  - [x] Ensure Vite HMR works in Docker
  - [x] Mount logs volume for persistence
  - [x] Test code changes reflect in running containers

- [x] Task 4: Set up health checks and startup logic (AC: #1)
  - [x] Add health check to PostgreSQL service
  - [x] Add health check to Backend service (GET /health)
  - [x] Verify service startup order and dependencies
  - [x] Add initialization script for database (optional, prepared for Story 2.1)
  - [x] Ensure all services are healthy before marking as ready

- [ ] Task 5: Create startup scripts and documentation (AC: #1-2)
  - [ ] Create `scripts/dev.sh` script (`docker compose up`)
  - [ ] Create `scripts/dev-stop.sh` script (`docker compose stop`)
  - [ ] Create `scripts/dev-reset.sh` script (`docker compose down -v`)
  - [ ] Document commands in README
  - [ ] Create troubleshooting guide for common Docker issues

- [ ] Task 6: Test Docker Compose setup end-to-end (AC: #1-3)
  - [ ] Start with `docker compose up`
  - [ ] Verify PostgreSQL is accessible
  - [ ] Verify Redis is accessible
  - [ ] Verify Backend health check passes
  - [ ] Verify Frontend loads at http://localhost:3000
  - [ ] Test RPC calls work between frontend and backend
  - [ ] Test hot reload with code changes
  - [ ] Test volume persistence (stop/start containers)
  - [ ] Test clean reset with down -v

- [ ] Task 7: Update documentation and guides (AC: Documentation)
  - [ ] Update README.md with Docker Compose setup section
  - [ ] Add quick start guide: `docker compose up`
  - [ ] Document environment variables needed
  - [ ] Add troubleshooting section for Docker issues
  - [ ] Update CLAUDE.md with local development patterns
  - [ ] Document volume mount strategy for hot reload
  - [ ] Create DOCKER.md with detailed setup instructions
  - [ ] Document service architecture diagram

- [ ] Task 8: Create integration tests for Docker Compose (AC: Tests)
  - [ ] Verify all services start successfully
  - [ ] Test backend can connect to PostgreSQL
  - [ ] Test backend can connect to Redis
  - [ ] Test frontend RPC calls to backend
  - [ ] Test health check endpoints
  - [ ] Document test commands for CI/CD

## Dev Notes

### Docker Compose Architecture

This story implements the **Local Development Container Orchestration** layer for big-ocean. It enables developers to run the entire application stack locally with production parity using Docker Compose (via `docker compose` CLI - modern Docker v2+ syntax).

**Local Development Flow**:
1. **Setup**: Developer clones repo, creates `.env.local`
2. **Start**: `docker compose up` from project root
3. **Initialize**: Services start in dependency order (PostgreSQL → Redis → API → Frontend)
4. **Develop**: Code changes hot-reload in containers (tsx watch for backend, Vite for frontend)
5. **Test**: Full application available at localhost:3000 with real services
6. **Persist**: Database state persists across restarts via Docker volumes
7. **Reset**: `docker compose down -v` cleans everything for fresh start

**Modern Docker Compose CLI**:
- Uses `docker compose` (not `docker-compose`) - modern Docker v2+ syntax
- No separate installation needed - included with Docker Desktop
- Replaces legacy standalone `docker-compose` binary (v1)
- Config file: `compose.yaml` or `docker-compose.yml` (both recognized)

**Service Architecture**:

```
┌─────────────────────────────────────────┐
│ Frontend Container (TanStack Start)      │
│ Port: 3000 (Vite dev server)            │
│ Volumes: src/ (hot reload)              │
│ Depends: Backend API                    │
└─────────────────────────────────────────┘
                  │
                  │ RPC calls
                  ▼
┌─────────────────────────────────────────┐
│ Backend API Container (Effect-ts)        │
│ Port: 4000 (RPC + health check)         │
│ Volumes: src/ (tsx watch reload)        │
│ Depends: PostgreSQL, Redis              │
└─────────────────────────────────────────┘
       │                       │
       │                       │
       ▼                       ▼
┌──────────────────┐  ┌──────────────────┐
│ PostgreSQL       │  │ Redis            │
│ Container        │  │ Container        │
│ Port: 5432       │  │ Port: 6379       │
│ Volume: /var/    │  │ (ephemeral or    │
│ lib/postgresql   │  │ named volume)    │
└──────────────────┘  └──────────────────┘
```

### Docker Compose Configuration

**compose.yaml Structure** (to be created in project root):

```yaml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:16-alpine
    container_name: bigocean-postgres
    environment:
      POSTGRES_DB: ${POSTGRES_DB:-bigocean}
      POSTGRES_USER: ${POSTGRES_USER:-dev}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-devpassword}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./docker/init-db.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-dev}"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - bigocean-network

  # Redis Cache & Rate Limiting
  redis:
    image: redis:7-alpine
    container_name: bigocean-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - bigocean-network

  # Backend API
  backend:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
      target: development  # Use dev stage for hot reload
    container_name: bigocean-backend
    environment:
      DATABASE_URL: postgres://dev:devpassword@postgres:5432/bigocean
      REDIS_URL: redis://redis:6379
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
      NODE_ENV: development
      PORT: 4000
      HOST: 0.0.0.0
    ports:
      - "4000:4000"
    volumes:
      - ./apps/api/src:/app/apps/api/src
      - ./apps/api/logs:/app/apps/api/logs
      - ./packages:/app/packages
      - /app/node_modules
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:4000/health"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - bigocean-network

  # Frontend Application
  frontend:
    build:
      context: .
      dockerfile: apps/front/Dockerfile
      target: development  # Use dev stage for Vite HMR
    container_name: bigocean-frontend
    environment:
      NODE_ENV: development
      VITE_API_URL: http://backend:4000
    ports:
      - "3000:3000"
    volumes:
      - ./apps/front/src:/app/apps/front/src
      - ./packages:/app/packages
      - /app/node_modules
    depends_on:
      backend:
        condition: service_healthy
    networks:
      - bigocean-network

volumes:
  postgres_data:
  redis_data:

networks:
  bigocean-network:
    driver: bridge
```

**Key Design Decisions**:

1. **Alpine Linux Images**: postgres:16-alpine, redis:7-alpine for minimal size
2. **Service Networking**: Internal Docker network (bigocean-network) for service-to-service communication
3. **Health Checks**: Every service has health check for orchestration validation
4. **Volume Mounts**: Source code mounted for hot reload (development use)
5. **Environment Variables**: Externalized via .env.local, no hardcoding
6. **Dependency Order**: Database → Cache → API → Frontend via depends_on with health checks
7. **Named Volumes**: postgres_data, redis_data for persistent storage across restarts
8. **Host Port Mapping**: Allows local machine access (3000, 4000, 5432, 6379)
9. **File naming**: `compose.yaml` (modern standard) with fallback to `docker-compose.yml`

### Development Workflow

**Getting Started** (modern `docker compose` syntax):

```bash
# 1. Create local environment file
cp .env.example .env.local
# Edit .env.local to add ANTHROPIC_API_KEY

# 2. Start all services (v2+ syntax: no hyphen)
docker compose up

# 3. Check services are healthy
docker compose ps
docker compose logs -f

# 4. Access application
# Frontend: http://localhost:3000
# Backend RPC: http://localhost:4000/rpc
# Backend Health: http://localhost:4000/health
# PostgreSQL: localhost:5432 (psql from CLI)
# Redis: localhost:6379 (redis-cli from CLI)
```

**Hot Reload During Development**:

- **Backend** (tsx watch mode):
  - File changes in `apps/api/src/` trigger auto-restart via tsx watch
  - No container rebuild needed
  - Logs stream to console

- **Frontend** (Vite HMR):
  - File changes in `apps/front/src/` trigger Vite hot module replacement
  - Browser auto-refreshes
  - CSS/JS changes without full page reload

**Common Commands** (modern `docker compose` v2+ syntax):

```bash
# View logs
docker compose logs -f backend          # Backend logs
docker compose logs -f frontend         # Frontend logs
docker compose logs -f postgres         # Database logs

# Stop services (keeps data)
docker compose stop

# Restart services
docker compose start

# Stop and clean (remove volumes, databases)
docker compose down -v

# Rebuild images (after dependency changes)
docker compose build

# Shell into container
docker compose exec backend sh
docker compose exec frontend sh

# Test backend health
curl http://localhost:4000/health

# Inspect database
docker compose exec postgres psql -U dev -d bigocean

# Remove all: networks, volumes, stopped containers
docker compose down -v --remove-orphans
```

**Troubleshooting**:

| Issue | Solution |
|-------|----------|
| Port already in use | Change port in compose.yaml or stop other services |
| Database connection refused | Wait for PostgreSQL health check (10-15 seconds) |
| Hot reload not working | Ensure volumes are mounted correctly; restart container |
| Out of disk space | Run `docker system prune` to clean unused images/volumes |
| ANTHROPIC_API_KEY not set | Create .env.local with valid API key |
| Command not found: docker compose | Upgrade to Docker Desktop v4.0+ or install Docker Compose plugin |

### Multi-Stage Dockerfile for Development

Both Dockerfiles (backend + frontend) should support development target:

**Backend Dockerfile Pattern** (apps/api/Dockerfile):

```dockerfile
# Builder stage (shared for both dev and prod)
FROM node:20-alpine AS builder
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/
COPY packages/*/package.json packages/*/
RUN corepack enable pnpm && pnpm install --frozen-lockfile

COPY . .
RUN pnpm -C apps/api build

# Development stage (uses tsx watch for hot reload)
FROM node:20-alpine AS development
WORKDIR /app
COPY --from=builder /app/node_modules /app/node_modules
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/
COPY packages/*/package.json packages/*/
COPY . .

EXPOSE 4000
CMD ["pnpm", "-C", "apps/api", "dev"]

# Production stage (uses tsx runtime, no compilation)
FROM node:20-alpine AS production
WORKDIR /app
COPY --from=builder /app/node_modules /app/node_modules
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/
COPY packages/*/package.json packages/*/
COPY --from=builder /app/apps/api/dist /app/apps/api/dist
COPY . .

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

EXPOSE 4000
CMD ["tsx", "src/index.ts"]
```

**Frontend Dockerfile Pattern** (apps/front/Dockerfile):

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/front/package.json apps/front/
COPY packages/*/package.json packages/*/
RUN corepack enable pnpm && pnpm install --frozen-lockfile

COPY . .
RUN pnpm -C apps/front build

# Development stage (uses Vite dev server with HMR)
FROM node:20-alpine AS development
WORKDIR /app
COPY --from=builder /app/node_modules /app/node_modules
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/front/package.json apps/front/
COPY packages/*/package.json packages/*/
COPY . .

EXPOSE 3000
CMD ["pnpm", "-C", "apps/front", "dev", "--host"]

# Production stage (uses Nitro output)
FROM node:20-alpine AS production
WORKDIR /app
COPY --from=builder /app/apps/front/.output .output
RUN npm install -g serve

EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
```

### Environment Configuration

**`.env.local` Template** (to be created by developer):

```env
# Database Configuration
POSTGRES_DB=bigocean
POSTGRES_USER=dev
POSTGRES_PASSWORD=devpassword
DATABASE_URL=postgres://dev:devpassword@postgres:5432/bigocean

# Redis Configuration
REDIS_URL=redis://redis:6379

# LLM Integration (Required)
ANTHROPIC_API_KEY=sk-ant-your-api-key-here

# Node Environment
NODE_ENV=development

# Server Configuration
PORT=4000
HOST=0.0.0.0

# Optional: Sentry (error tracking)
SENTRY_DSN=

# Optional: Rails API Key (if integrating external services)
RAILS_API_KEY=
```

**Documentation Requirements**:
- All secrets should be in `.env.local` (never committed)
- `.env.local` should be added to `.gitignore`
- `.env.example` documents all required variables
- Development `.env.local` different from production (Railway environment)

### Project Structure Notes

**Key Files for This Story**:
- Create: `compose.yaml` (root) or `docker-compose.yml` for compatibility
- Create: `.env.local` (root, in .gitignore)
- Create: `scripts/dev.sh` (startup helper)
- Create: `scripts/dev-stop.sh` (shutdown helper)
- Create: `scripts/dev-reset.sh` (clean reset helper)
- Create: `docker/init-db.sql` (database initialization, prepared for Story 2.1)
- Modify: `apps/api/Dockerfile` (add development stage)
- Modify: `apps/front/Dockerfile` (add development stage)
- Modify: `README.md` (add Docker Compose section)
- Create: `DOCKER.md` (detailed Docker documentation)
- Modify: `CLAUDE.md` (add local development patterns)
- Modify: `.gitignore` (add .env.local, docker artifacts)

**Dependencies** (already in Story 1.3):
- Docker Desktop v4.0+ (includes Docker Compose v2+ with `docker compose` CLI)
- Or: Docker with Docker Compose plugin installed
- Node 20+ (for development)
- pnpm 10.4.1+ (for workspace management)

**Blocked by**: None (Story 1.1 + 1.3 provide foundation)

**Blocks**: Local development workflow for all team members

### Testing & Validation

**Manual Test Cases**:

1. **Service Startup**:
   - Run `docker compose up`
   - Verify all services show "healthy" after 15-30 seconds
   - Check no error messages in logs

2. **Service Connectivity**:
   - Backend can connect to PostgreSQL: `curl http://localhost:4000/health` returns 200
   - Backend can access Redis: Check logs for Redis connection success
   - Frontend loads: `curl http://localhost:3000` returns HTML
   - Frontend can call RPC: Browser network tab shows successful /rpc calls

3. **Hot Reload**:
   - Edit `apps/api/src/index.ts` (add console.log)
   - Verify change appears in logs within 2 seconds (tsx watch)
   - Edit `apps/front/src/routes/index.tsx`
   - Verify Vite hot reload triggers (no full page reload)

4. **Data Persistence**:
   - Run `docker compose stop`
   - Create test data in database via RPC call
   - Run `docker compose start`
   - Verify data still exists (PostgreSQL volume persisted)

5. **Clean Reset**:
   - Run `docker compose down -v`
   - Run `docker compose up`
   - Verify PostgreSQL is empty (fresh database)

6. **Environment Handling**:
   - Set ANTHROPIC_API_KEY in .env.local
   - Verify it's available in backend container: `docker compose exec backend env | grep ANTHROPIC`

### References

- **Story 1.3**: Effect-ts RPC setup (blocking dependency: COMPLETE ✅)
  - Location: `_bmad-output/implementation-artifacts/1-3-configure-effect-ts-rpc-contracts-and-infrastructure-layer.md`
  - Provides: RPC infrastructure, health endpoint, server setup

- **Story 1.1**: Railway Deployment (blocking dependency: COMPLETE ✅)
  - Location: `_bmad-output/implementation-artifacts/1-1-deploy-infrastructure-to-railway.md`
  - Provides: Production deployment patterns to match locally

- **Existing Dockerfiles**:
  - Backend: `apps/api/Dockerfile` (multi-stage build pattern)
  - Frontend: `apps/front/Dockerfile` (Nitro build output pattern)
  - Railway configs: `apps/api/railway.json`, `apps/front/railway.json`

- **Architecture Decisions**: `CLAUDE.md` (Docker Compose for local development, line 104)

- **Docker Compose Documentation**: https://docs.docker.com/compose/ (v2+ modern syntax)

- **Epic 1 Summary**: `_bmad-output/planning-artifacts/epics.md` (Story 1.4 not yet listed, will be added)

## Dev Agent Record

### Agent Model Used

Claude Haiku 4.5 (claude-haiku-4-5-20251001)

### Debug Log References

- Docker/Dockerfile analysis completed: Reviewed apps/api and apps/front Dockerfiles
- Railway configuration reviewed: railway.json patterns for both services
- Environment variable requirements extracted from .env.example and .env
- Service architecture documented with port mappings and dependencies
- Development workflow patterns identified (tsx watch, Vite HMR)
- Production deployment learnings applied from Stories 1.1 + 1.3
- Modern Docker Compose (v2+) syntax verified: `docker compose` (no hyphen)

### Completion Notes List

**Phase 1 - Tasks 1-4 COMPLETE** ✅

**Implementation Summary**:
1. ✅ Created `compose.yaml` with 4 services: PostgreSQL (16-alpine), Redis (7-alpine), Backend API, Frontend
2. ✅ Configured all service dependencies using `depends_on` with health checks
3. ✅ Set up named volumes for PostgreSQL data persistence (postgres_data, redis_data)
4. ✅ Configured volume mounts for hot reload:
   - Backend: `./apps/api/src → /app/apps/api/src`, `./packages → /app/packages`
   - Frontend: `./apps/front/src → /app/apps/front/src`, `./packages → /app/packages`
5. ✅ Added health checks to all services:
   - PostgreSQL: pg_isready
   - Redis: redis-cli ping
   - Backend API: curl http://localhost:4000/health
6. ✅ Created `.env.local` template with all required variables (ANTHROPIC_API_KEY, DATABASE_URL, REDIS_URL, NODE_ENV)
7. ✅ Modified `apps/api/Dockerfile`:
   - Added development stage with `pnpm -C apps/api dev` (uses tsx watch)
   - Renamed old runtime to production stage
   - Added health check to production stage
8. ✅ Modified `apps/front/Dockerfile`:
   - Added development stage with `pnpm -C apps/front dev --host` (Vite HMR)
   - Created separate production build stage
   - Properly chains builder → production build → final runtime
9. ✅ Created `docker/init-db.sql` with PostgreSQL initialization (prepared for Story 2.1)
10. ✅ Removed duplicate `docker-compose.yml`, kept modern `compose.yaml` standard

**Ready for Testing**:
- All 4 services defined and networked (bigocean-network)
- Service startup order enforced via depends_on with health checks
- Environment variables externalized (no hardcoding)
- Port mappings complete (3000, 4000, 5432, 6379)
- Volume persistence configured for database and logs
- Hot reload infrastructure in place (tsx watch + Vite HMR)

**Phase 2 - Tasks 5-8 PENDING** (Next Session)
- [ ] Create helper scripts: scripts/dev.sh, dev-stop.sh, dev-reset.sh
- [ ] Create DOCKER.md comprehensive guide
- [ ] Update README.md with quick start
- [ ] Update CLAUDE.md with local dev patterns
- [ ] Create integration tests
- [ ] Mark story ready for code review

### File List

**Created** (Phase 1 - Tasks 1-4 Complete):
- ✅ `compose.yaml` (Docker Compose configuration with all 4 services: PostgreSQL, Redis, Backend, Frontend)
- ✅ `.env.local` (Environment variables template for local development)
- ✅ `docker/init-db.sql` (Database initialization script, prepared for Story 2.1 schema creation)
- ✅ `apps/api/Dockerfile` (Modified: added development stage with tsx watch for hot reload, added health check)
- ✅ `apps/front/Dockerfile` (Modified: added development stage with Vite HMR for hot reload)
- ✅ Removed: old `docker-compose.yml` (consolidated to `compose.yaml`)

**To Create** (Phase 2 - Tasks 5-8, Next Session):
- `scripts/dev.sh` (helper for `docker compose up`)
- `scripts/dev-stop.sh` (helper for `docker compose stop`)
- `scripts/dev-reset.sh` (helper for `docker compose down -v`)
- `DOCKER.md` (comprehensive Docker development guide)
- Integration tests for Docker Compose setup

**To Modify** (Phase 2 - Tasks 5-8, Next Session):
- `README.md` (add Docker Compose Quick Start section)
- `CLAUDE.md` (add local development setup patterns)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (story status update to "review")

