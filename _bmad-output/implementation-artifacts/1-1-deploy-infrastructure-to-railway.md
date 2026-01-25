---
status: review
story_id: "1.1"
epic: 1
created_date: 2026-01-30
completed_date: 2026-01-30
phase_1_complete: true
---

# Story 1.1: Deploy Infrastructure to Railway

## Story

As a **DevOps Engineer**,
I want **to deploy big-ocean backend, PostgreSQL, and Redis to Railway**,
so that **the platform has a scalable, managed infrastructure with zero operational overhead**.

## Acceptance Criteria

### Deployment Automation
**Given** the monorepo is ready to deploy
**When** I push to GitHub main branch
**Then** Railway automatically deploys backend + PostgreSQL + Redis
**And** environment variables are configured in Railway dashboard
**And** database migrations run automatically
**And** logs appear in Railway dashboard

### Service Validation
**Given** the system is deployed to Railway
**When** I check the Railway dashboard
**Then** Backend service shows healthy status
**And** PostgreSQL is reachable from backend
**And** Redis is connected for cost tracking
**And** All services share the same Railway project

## Business Context

**Why This Story Matters:**
- Foundational infrastructure requirement for all subsequent development
- Enables local → staging → production deployment pipeline
- Establishes cost control (Railway usage-based, ~$5-12/month MVP)
- Zero operational overhead (Railway manages databases, auto-scaling, monitoring)

**Blocks Until Complete:**
- Epic 2-7 development (all features depend on running backend)
- Sprint planning execution (team can't start other stories without deployed infrastructure)

## Technical Requirements

### Services to Deploy
1. **Backend** (`apps/api` - Node.js/Effect-ts)
   - Port: 4000 (internal)
   - Processes: LangGraph orchestration, RPC handlers, database access
   - Startup: `pnpm run build && pnpm run start` (from apps/api)

2. **PostgreSQL** (Relational Database)
   - Version: 16+ (Railway standard)
   - Storage: 1GB minimum for MVP testing
   - Logical replication: enabled (for potential ElectricSQL future, now TanStack Query)
   - Migrations: Drizzle ORM auto-run via postdeploy script

3. **Redis** (In-Memory Cache)
   - Version: 7+ (Railway standard)
   - Purpose: Rate limiting, cost tracking per-user-per-day counters
   - Memory: 128MB minimum (MVP)
   - Commands: SET, GET, INCR (standard cache operations)

### Environment Variables
**Must configure in Railway Dashboard:**
```
# Database
DATABASE_URL=postgresql://[user]:[password]@[host]:[port]/[database]

# Redis
REDIS_URL=redis://[user]:[password]@[host]:[port]

# LLM Integration
ANTHROPIC_API_KEY=sk-ant-...

# Error Tracking
SENTRY_DSN=https://[key]@[organization].ingest.sentry.io/[project-id]

# Node
NODE_ENV=production
```

### Dockerfile Requirements
**apps/api must have:**
- Base image: `node:20-alpine` (matches Node requirement: >=20)
- Build stage: `pnpm install && pnpm build`
- Runtime stage: `pnpm run start`
- Health check endpoint: `GET /health` → `{ status: 'ok' }`
- Port exposure: `EXPOSE 4000`

### Database Migrations
**Auto-run script:**
```bash
# In railway.json postdeploy hook
pnpm -C packages/database drizzle-kit push --config drizzle.config.ts
```
Or manual:
```bash
# SSH into Railway backend
railway shell
cd /app && pnpm -C packages/database drizzle-kit push
```

## Architecture Compliance

**From architecture.md ADR-3 (Infrastructure & Hosting):**
- ✅ All-Railway deployment (single platform: backend + PostgreSQL + Redis)
- ✅ Zero operational overhead (Railway auto-manages services)
- ✅ Cost control: Usage-based pricing (~$5-12/month MVP)
- ✅ Connection pooling: Railway handles automatically
- ✅ Monitoring: Railway dashboard covers logs, metrics, deployments

**Docker Compose Parity (Local Development):**
- Must also work with `docker-compose.yml` in project root
- Local PostgreSQL and Redis should mirror Railway services
- Environment variables in `.env.local` for local testing

## Files and Directory Structure

**Files You'll Create/Modify:**

```
big-ocean/
├── apps/
│   └── api/
│       ├── Dockerfile              [CREATE if not exists]
│       ├── package.json            [VERIFY scripts: build, start, dev]
│       └── src/
│           └── index.ts            [VERIFY health endpoint]
├── packages/
│   └── database/
│       ├── drizzle.config.ts       [VERIFY DATABASE_URL reference]
│       └── src/
│           └── schema.ts           [Tables already defined]
├── docker-compose.yml              [VERIFY or CREATE local dev parity]
├── railway.json                    [CREATE]
├── .env.example                    [UPDATE with Railway variables]
└── README.md                       [UPDATE deployment instructions]
```

**No Changes Needed:**
- `pnpm-workspace.yaml` (already correct)
- `packages/ui` (frontend deployed separately or via backend static serve)
- Migration scripts in `packages/database`

## Dependencies

### NPM Libraries (Already in pnpm-lock.yaml)
- `express` (backend HTTP server)
- `@effect/rpc` (type-safe RPC)
- `drizzle-orm` (database ORM)
- `ioredis` (Redis client for rate limiting)
- `pino` (structured logging for Railway)
- `@sentry/node` (error tracking)

### External Services
- **Railway Account** (https://railway.app) - Free tier sufficient for MVP
- **GitHub Repo** - Must be public or Railway must have read access
- **Anthropic API Key** - From https://console.anthropic.com (already in architecture)
- **Sentry Account** (Optional but recommended) - Free plan included

## Implementation Checklist

### Phase 1: Local Docker Setup
- [x] Create `Dockerfile` in `apps/api` (see template below)
- [x] Create `docker-compose.yml` at project root with PostgreSQL + Redis
- [x] Test local build: `docker-compose up`
- [x] Verify backend starts: `curl http://localhost:4000/health`
- [x] Verify PostgreSQL accessible: `psql $DATABASE_URL -c "SELECT 1"`
- [x] Verify Redis accessible: `redis-cli PING`

### Phase 2: Railway Project Setup ⏸️ Requires User Authentication
See **RAILWAY_SETUP.md** for detailed instructions.

- [ ] Create Railway project at railway.app (requires Railway account)
- [ ] Connect GitHub repository (requires git push + Railway authentication)
- [ ] Create 3 services:
  - [ ] Backend (from Dockerfile)
  - [ ] PostgreSQL (Railway template)
  - [ ] Redis (Railway template)
- [ ] Configure environment variables in Railway dashboard
- [ ] Enable auto-deploy on main branch push

**Commands documented:**
```bash
railway login
railway init
railway add --database postgres
railway add --database redis
railway variables set ANTHROPIC_API_KEY=sk-ant-...
```

### Phase 3: Database Migrations ⏸️ Blocked by Story 1.3
- [x] Create `railway.json` with postdeploy script
- [ ] Run migrations on Railway PostgreSQL (blocked: no database schemas yet)
- [ ] Verify tables created: `\dt` in psql (blocked: needs Story 1.3)

**Note:** Database package with Drizzle schemas will be created in Story 1.3.

### Phase 4: Validation ⏸️ Requires Railway Deployment
Instructions provided in **RAILWAY_SETUP.md** - ready to execute after Phase 2 complete.

- [ ] Backend health check: `GET https://[railway-backend-url]/health`
- [ ] PostgreSQL connection from backend working
- [ ] Redis connection from backend working
- [ ] Logs visible in Railway dashboard
- [ ] Cost tracking in Railway dashboard (showing ~$0-2/month base)

**Validation commands documented:**
```bash
railway domain  # Get backend URL
curl https://[url]/health  # Test health endpoint
railway logs --service backend  # Check connection logs
railway status  # Verify all services healthy
```

## Dev Notes

### Critical Paths
1. **Backend must start without errors** - Missing env vars will crash startup
2. **Migrations must run automatically** - Manual migrations are fragile
3. **Health endpoint must work** - Railway uses this for deployment validation
4. **Logs must be structured JSON** - Pino configured for cloud logging

### Common Pitfalls to Avoid
- ❌ Hardcoding DATABASE_URL or REDIS_URL in code (use environment variables)
- ❌ Forgetting NODE_ENV=production in Railway
- ❌ Missing `EXPOSE 4000` in Dockerfile (Railway won't route traffic)
- ❌ Not testing migrations locally before pushing to Railway
- ❌ Database charset issues (use UTF-8 in migrations)

### Testing Checklist
Before declaring story complete:
```bash
# 1. Local Docker works
docker-compose up
curl http://localhost:4000/health  # Should return { status: 'ok' }

# 2. Migrations work
pnpm -C packages/database drizzle-kit push
# Check PostgreSQL: SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

# 3. All required tables exist
# sessions, messages, users, archetypes, trait_assessments, etc.

# 4. Cost tracking (Redis keys for rate limiting)
redis-cli KEYS '*'  # Should support SET/GET operations
```

## Dockerfile Template

If not already present in apps/api:

```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Copy monorepo files
COPY . .

# Install dependencies (using pnpm)
RUN npm install -g pnpm@10.4.1
RUN pnpm install --frozen-lockfile

# Build all packages
RUN pnpm run build

# Runtime stage
FROM node:20-alpine
WORKDIR /app

# Copy built artifacts from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/packages ./packages

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:4000/health || exit 1

# Start backend
CMD ["node", "apps/api/dist/index.js"]
```

## Reference Docs

**Source Documents:**
- [Architecture Decision: Infrastructure & Hosting](../planning-artifacts/architecture.md#infrastructure--hosting)
- [Project Requirements: Cost Optimization](../planning-artifacts/prd.md#cost-optimization)
- [CLAUDE.md: Railway Configuration](../../CLAUDE.md#infrastructure)

**External References:**
- [Railway Docs: Node.js Deployment](https://docs.railway.app/getting-started)
- [Drizzle ORM: PostgreSQL Migrations](https://orm.drizzle.team/docs/migrations)
- [Docker Best Practices: Node.js](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
- [Health Check Patterns](https://12factor.net/processes)

## Dev Agent Record

### Agent Model Used
Claude Sonnet 4.5

### Implementation Notes
**Phase 1 - Local Docker Setup:** ✅ Complete
- Created production Dockerfile with multi-stage build (builder + runtime)
- Configured health endpoint at `GET /health` returning `{"status":"ok"}`
- Fixed server host binding from `127.0.0.1` to `0.0.0.0` for container accessibility
- Created docker-compose.yml with PostgreSQL 16, Redis 7, and backend services
- All services have health checks and proper dependency ordering
- Tested successfully: health endpoint, PostgreSQL connection, Redis connection

**Technical Decisions Made:**
- Using `tsx` in production for now since workspace packages (contracts) export TypeScript source
  - Alternative considered: build all workspace packages, but adds complexity for MVP
  - Follow-up: Story 1.3 will establish proper build process when migrating to Effect RPC
- Server listens on `0.0.0.0:4000` (not `127.0.0.1`) to allow external connections in containers
- Package.json updated with `build`, `start`, and `typecheck` scripts
- TypeScript config updated to output `dist/` directory (removed `noEmit: true`)

**Remaining Work:**
- Phase 2: Railway project setup (requires manual Railway dashboard configuration)
- Phase 3: Database migrations (blocked until packages/database exists with Drizzle schema)
- Phase 4: Production validation (requires Railway deployment)

### Completion Notes

**✅ Phase 1 Complete (100%):**
- Docker infrastructure fully implemented and tested
- Health endpoint verified working
- All local services (PostgreSQL, Redis, Backend) tested and operational
- docker-compose successfully starts all services with health checks
- Railway CLI installed and ready for deployment

**📋 Phase 2-4 Documented (Awaiting User Action):**
- Comprehensive Railway setup guide created (RAILWAY_SETUP.md)
- All required commands documented with examples
- Step-by-step instructions for project creation, service setup, and validation
- Troubleshooting guide included
- Cost optimization tips provided

**⏸️ Blocked Items:**
- Phase 2: Requires Railway account authentication (user action)
- Phase 3: Database migrations require Story 1.3 (database schemas not created yet)
- Phase 4: Production validation requires Phase 2 deployment complete

**Story Status:** Phase 1 complete and verified. Phases 2-4 ready to execute with provided documentation when prerequisites are met.

### File List
- `apps/api/Dockerfile` - Created: Multi-stage Docker build with tsx support
- `apps/api/package.json` - Modified: Added build, start, typecheck scripts
- `apps/api/tsconfig.json` - Modified: Configured outDir, removed noEmit
- `apps/api/src/index.ts` - Modified: Added `/health` endpoint, changed host to 0.0.0.0
- `docker-compose.yml` - Created: Local development stack (PostgreSQL, Redis, API)
- `.env.example` - Created: Environment variable template
- `railway.json` - Created: Railway deployment configuration
- `RAILWAY_SETUP.md` - Created: Comprehensive Railway deployment guide

### Known Issues / Follow-ups
- Story partially complete: Phase 1 done locally, Phases 2-4 require Railway account setup
- Database migrations pending (no packages/database with schemas yet)
- Production tsx usage is temporary - Story 1.3 will establish proper workspace builds

---

## Next Steps After Completion

1. ✅ **Story Complete** → Update sprint-status.yaml: `1-1-deploy-infrastructure-to-railway: done`
2. ✅ **Run Retrospective** (optional) for learnings
3. ✅ **Start Story 1.2** → `/bmad-bmm-create-story` for Better Auth integration
4. ✅ **Parallel Work** → Start Story 7.1 (Unit Testing Framework) while Story 1.2 is in progress

---

**Status:** review
**Epic:** 1 (Infrastructure & Auth Setup)
**Phase 1 Complete:** Local Docker setup fully tested
**Blocks:** Phases 2-4 require Railway account setup by user
**Ready for:** Railway deployment configuration and testing
