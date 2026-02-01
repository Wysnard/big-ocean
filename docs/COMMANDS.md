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
pnpm build                  # Build all packages and apps
pnpm lint                   # Lint all packages
pnpm format                 # Format all code
pnpm test:run               # Run all tests
pnpm test:coverage          # Run tests with coverage report
```

## First-Time Setup

After cloning the repository:

```bash
pnpm install                # Install all dependencies
pnpm prepare                # Install git hooks (runs automatically via postinstall)
pnpm dev --filter=api       # Verify backend starts
pnpm dev --filter=front     # Verify frontend starts
```

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

Migration management (run from `apps/api` or `packages/database`):

```bash
pnpm drizzle-kit generate          # Generate migration files
pnpm drizzle-kit push              # Apply migrations to database
pnpm drizzle-kit studio            # Open Drizzle Studio UI
```

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
