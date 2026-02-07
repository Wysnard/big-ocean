# Development Commands

All commands run from repository root.

## Quick Reference

```bash
pnpm dev                    # Start all services (frontend + backend)
pnpm test:run               # Run all tests
pnpm lint                   # Lint all packages
pnpm format                 # Format all code
pnpm build                  # Build all packages
```

## Development

```bash
pnpm dev                      # Start all apps in dev mode (front + api)
pnpm dev --filter=front       # Run only frontend (TanStack Start, port 3000)
pnpm dev --filter=api         # Run only backend (Node.js, port 4000)
```

## Building & Testing

```bash
pnpm build                     # Build all packages and apps
pnpm lint                      # Lint all packages
pnpm format                    # Format all code
pnpm test:run                  # Run all unit tests
pnpm test:coverage             # Run unit tests with coverage report
pnpm test:integration          # Run integration tests (Docker + HTTP + DB)
pnpm test:integration:watch    # Run integration tests in watch mode
```

### Integration Testing

Integration tests validate the complete HTTP stack (Docker build + PostgreSQL + API endpoints) in a production-like environment:

```bash
# Automatic Docker lifecycle (recommended)
pnpm test:integration             # Start Docker → Run tests → Stop Docker

# Watch mode for rapid iteration
pnpm test:integration:watch       # Run tests in watch mode

# Manual Docker control (for debugging)
pnpm docker:test:up               # Start test environment only
pnpm docker:test:down             # Stop and clean up test environment
```

**What Integration Tests Validate:**
- Docker image builds successfully from production Dockerfile
- PostgreSQL migrations run correctly
- API endpoints return correct HTTP responses
- Response schemas match @workspace/contracts
- Database persistence works (sessions, messages saved)
- Mock LLM responds appropriately (zero API costs)

**Test Environment:**
- PostgreSQL: localhost:5433 (test DB, isolated from dev on 5432)
- API: localhost:4001 (test API, isolated from dev on 4000)
- Tests run on HOST machine (enables watch mode, UI, debugging)

See [apps/api/tests/integration/README.md](../apps/api/tests/integration/README.md) for detailed documentation.

## First-Time Setup

After cloning the repository:

```bash
pnpm install                # Install all dependencies
pnpm prepare                # Install git hooks (runs automatically via postinstall)
pnpm db:migrate             # Apply database migrations (requires PostgreSQL running)
pnpm dev --filter=api       # Verify backend starts
pnpm dev --filter=front     # Verify frontend starts
```

**With Docker (recommended):** Just run `./scripts/dev.sh` — migrations apply automatically on startup.

## App-Specific Commands

### frontend (TanStack Start)

```bash
pnpm -C apps/front dev              # Start dev server with HMR (port 3000)
pnpm -C apps/front build            # Build for production (SSR)
pnpm -C apps/front start            # Start production server
pnpm -C apps/front lint             # Run Biome linter
pnpm -C apps/front typecheck        # TypeScript type checking
```

### backend (Node.js API)

```bash
pnpm -C apps/api dev              # Start dev server with watch (port 4000)
pnpm -C apps/api build            # Build/compile TypeScript
pnpm -C apps/api typecheck        # TypeScript type checking
```

### Shared Packages

```bash
pnpm -C packages/domain lint              # Lint domain package
pnpm -C packages/contracts lint           # Lint contracts (zero warnings required)
pnpm -C packages/database lint            # Lint database package
pnpm -C packages/ui lint                  # Lint UI components (zero warnings required)
pnpm -C packages/infrastructure lint      # Lint infrastructure package
```

## Database Commands

Schema and migration management (run from repository root):

```bash
pnpm db:migrate                    # Apply migrations to database
pnpm db:push                       # Push schema directly (no migration files, dev only)
pnpm db:generate                   # Generate migration files from schema changes
pnpm db:generate --name=my-change  # Generate with a custom migration name
```

**Note:** Migrations run automatically on `docker compose up` via the backend entrypoint. For local development without Docker, run `pnpm db:migrate` manually.

**Schema source of truth:** `packages/infrastructure/src/db/drizzle/schema.ts`
**Migration files:** `drizzle/` directory (checked into git)

## Docker Compose Development

For containerized development with exact production parity:

```bash
# Start all services
./scripts/dev.sh

# Stop services (keeps data)
docker compose stop
# or
./scripts/dev-stop.sh

# Full reset (removes all data)
./scripts/dev-reset.sh

# View logs
docker compose logs -f backend    # Backend logs with hot reload
docker compose logs -f frontend   # Frontend logs with Vite HMR
docker compose logs -f postgres   # Database logs
docker compose logs -f redis      # Cache logs

# Access services
curl http://localhost:4000/health  # Test backend health
docker compose exec postgres psql -U dev -d bigocean  # Access database
docker compose exec redis redis-cli  # Access cache

# Rebuild after dependency changes
docker compose build
docker compose up
```

### Common Docker Gotchas

- After `pnpm install` changes to `package.json`, run `docker compose build` before starting services
- If services won't start, try `./scripts/dev-reset.sh` to clear volumes and remove all state
- Use `docker compose logs {service}` to debug startup issues

### Docker Services

- **Port mapping**: Frontend (3000), Backend (4000), PostgreSQL (5432), Redis (6379)
- **Hot reload**: Backend (tsx watch), Frontend (Vite HMR)
- **Volumes**: `./apps/api/src` and `./apps/front/src` mounted for real-time changes
- **Health checks**: All services validate startup order and readiness
- **Database persistence**: postgres_data and redis_data named volumes

See [DOCKER.md](../DOCKER.md) for comprehensive Docker development guide.
