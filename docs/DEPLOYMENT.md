# Production Deployment

## Railway Deployment

The API is deployed to Railway with automatic CI/CD integration.

**Production URLs:**

- **Base**: https://api-production-f7de.up.railway.app
- **Health Check**: GET `/health` → `{"status":"ok"}`

**Deployment Flow:**

1. Push or merge to `master` branch triggers Railway build
2. Docker image built using `apps/api/Dockerfile`
3. TypeScript compiled with workspace package resolution
4. Container starts with `pnpm --filter api start` → runs `tsx src/index.ts`
5. Health check endpoint validates deployment
6. Automatic restart on failure (10 max retries)

## Environment Variables

Configure these in the Railway dashboard:

| Variable | Value | Notes |
|----------|-------|-------|
| `PORT` | `8080` | Railway default |
| `HOST` | `0.0.0.0` | Listen on all interfaces |
| `ANTHROPIC_API_KEY` | `sk-...` | Claude API key |
| `DATABASE_URL` | PostgreSQL connection | Set in Railway |
| `REDIS_URL` | Redis connection | Set in Railway |

## Docker Best Practices

The production Dockerfile follows:

- **Multi-stage build**: Builder stage + minimal runtime image
- **pnpm workspace resolution**: Double install for proper linking
- **tsx for runtime**: Handles workspace imports in production
- **Minimal image**: Node 20 Alpine
- **Health check**: Validates container startup

## Health Check

The API provides a health endpoint for deployment validation:

```bash
curl https://api-production-f7de.up.railway.app/health
# Returns: {"status":"ok","timestamp":"2025-02-01T..."}
```

This endpoint is used by Railway to confirm deployment readiness.

## CI/CD Pipeline

GitHub Actions automatically runs on all pushes and pull requests:

**Pipeline Steps:**

1. Checkout code
2. Setup pnpm 10.4.1 + Node.js 20.x
3. Install dependencies (`pnpm install`)
4. TypeScript check (`pnpm turbo lint`)
5. Lint check (`pnpm lint`)
6. Build (`pnpm build`)
7. Run tests (`pnpm test:run`)
8. Validate commit messages (PR only - conventional commit format)

**Configuration:** `.github/workflows/ci.yml`

See [COMMANDS.md](./COMMANDS.md) for local CI/CD testing before deployment.
