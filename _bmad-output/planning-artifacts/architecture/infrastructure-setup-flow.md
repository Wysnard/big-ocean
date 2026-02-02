# Infrastructure Setup Flow

## Step 1: Create Railway Project

```bash
# 1. Go to https://railway.app
# 2. Sign up (GitHub OAuth)
# 3. Create new project
```

## Step 2: Connect GitHub Repository

```bash
# In Railway dashboard:
# 1. New → GitHub repo (connect authorization)
# 2. Select: vincentlay/big-ocean
# 3. Railway watches for deployments
```

## Step 3: Add PostgreSQL Service

```bash
# In Railway dashboard → Add Service → PostgreSQL
# Configuration auto-set:
# - Version: Latest
# - Storage: 10GB
# - Connections: 10 (enough for MVP)

# Get connection string
# Settings → PostgreSQL → CONNECTION_STRING
DATABASE_URL=postgresql://...
```

## Step 4: Add Redis Service

```bash
# In Railway dashboard → Add Service → Redis
# Configuration auto-set:
# - Version: Latest
# - Memory: 256MB
# - Eviction policy: allkeys-lru

# Get connection string
# Settings → Redis → REDIS_URL
REDIS_URL=redis://...
```

## Step 5: Configure Backend Service

```bash
# Railway auto-detects:
# - apps/api/Dockerfile
# - apps/api/package.json
# - Start command: node dist/index.js

# Add environment variables in Railway Dashboard:
# Backend Settings → Variables:
DATABASE_URL=<from PostgreSQL>
REDIS_URL=<from Redis>
BETTER_AUTH_SECRET=<generate: openssl rand -hex 32>
ANTHROPIC_API_KEY=<your API key>
SENTRY_DSN=<from Sentry>
NODE_ENV=production
```

## Step 6: Deploy Backend

```bash
# Option A: Manual trigger
# In Railway dashboard → Backend → Deploy

# Option B: Automatic on git push
# (Default: Railway watches main branch)
git push origin main
# Railway auto-detects changes, builds, deploys
```

## Step 7: Run Database Migrations

```bash
# One-time: Initialize schema
pnpm -C apps/api drizzle-kit push

# Railway provides shell access:
# Dashboard → Backend → Shell
# Run: drizzle-kit push --config=drizzle.config.ts
```

## Step 8: (Optional) Configure Frontend Deployment

**Option A: Serve from Backend**
```typescript
// apps/api/src/index.ts
app.use(express.static("../front/dist"));
```

**Option B: Separate Railway Service (Frontend as separate service)****
```bash
# In Railway dashboard → Add Service → GitHub
# Select: apps/front
# Build command: pnpm -C apps/front build
# Start command: pnpm -C apps/front start
```

---
