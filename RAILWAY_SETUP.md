# Railway Deployment Setup Guide

This guide walks you through deploying big-ocean to Railway.

## Prerequisites

- Railway account (https://railway.app)
- GitHub repository with this code
- Railway CLI installed (already done: `railway --version`)

## Phase 2: Railway Project Setup

### Step 1: Login to Railway

```bash
railway login
```

This will open a browser window for authentication.

### Step 2: Create New Project

```bash
cd /Users/vincentlay/Projects/big-ocean
railway init
```

Select:
- **Project name:** big-ocean
- **Environment:** production

### Step 3: Link GitHub Repository

Option A: Via Railway Dashboard (Recommended)
1. Go to https://railway.app/dashboard
2. Open your `big-ocean` project
3. Click "Settings" → "Connect GitHub"
4. Select your repository
5. Enable "Auto-deploy on push to main"

Option B: Via CLI
```bash
# After pushing code to GitHub
railway link
```

### Step 4: Add PostgreSQL Service

```bash
railway add --database postgres
```

This creates a PostgreSQL 16 instance with:
- Automatic connection string (DATABASE_URL)
- 1GB storage (expandable)
- Logical replication enabled

### Step 5: Add Redis Service

```bash
railway add --database redis
```

This creates a Redis 7 instance with:
- Automatic connection string (REDIS_URL)
- 128MB memory (expandable)

### Step 6: Configure Backend Service

The backend will auto-deploy from the Dockerfile. Set environment variables:

```bash
# Set required environment variables
railway variables set ANTHROPIC_API_KEY=sk-ant-your-actual-key-here
railway variables set NODE_ENV=production
railway variables set PORT=4000

# Optional: Add Sentry for error tracking
railway variables set SENTRY_DSN=https://your-sentry-dsn
```

**Important:** Railway automatically provides:
- `DATABASE_URL` (from PostgreSQL service)
- `REDIS_URL` (from Redis service)

### Step 7: Verify Services

```bash
# Check all services are running
railway status

# View environment variables
railway variables

# View logs
railway logs
```

## Phase 3: Database Migrations

### Option 1: Manual Migration (Temporary - no schemas yet)

```bash
# SSH into Railway backend
railway run bash

# Once inside the container, migrations will run automatically
# (when packages/database exists with Drizzle schemas)
```

### Option 2: Automatic via railway.json (Already configured)

The `railway.json` file is already configured. When you push code:
1. Railway builds the Dockerfile
2. Runs the backend
3. Migrations will auto-run when Drizzle schemas are added in Story 1.3

**Note:** Database migrations are blocked until Story 1.3 creates the database package.

## Phase 4: Production Validation

### Step 1: Get Backend URL

```bash
railway domain
```

Or check the Railway dashboard for your backend's public URL (e.g., `https://big-ocean-production-xxxx.up.railway.app`)

### Step 2: Test Health Endpoint

```bash
curl https://your-backend-url.up.railway.app/health
# Should return: {"status":"ok"}
```

### Step 3: Verify Database Connection

```bash
# View logs to confirm PostgreSQL connection
railway logs --service backend

# Look for: "Server listening on http://0.0.0.0:4000"
# Should NOT see: "Error: Connection refused" or "ECONNREFUSED"
```

### Step 4: Verify Redis Connection

```bash
# SSH into backend
railway run bash

# Test Redis connection
node -e "const redis = require('ioredis'); const client = new redis(process.env.REDIS_URL); client.ping().then(r => console.log(r)); client.quit();"
# Should output: PONG
```

### Step 5: Check Cost Tracking

1. Go to Railway dashboard → Project → Usage
2. Verify costs are within expected range:
   - PostgreSQL: ~$2-5/month
   - Redis: ~$1-3/month
   - Backend: ~$2-5/month
   - **Total: ~$5-12/month** (as specified in requirements)

## Troubleshooting

### Backend won't start

**Symptom:** Logs show "Error: Anthropic API key not found"
**Fix:** Set ANTHROPIC_API_KEY environment variable
```bash
railway variables set ANTHROPIC_API_KEY=sk-ant-your-key-here
```

### Health check failing

**Symptom:** Railway shows "Unhealthy" status
**Fix:** Check logs and verify:
1. Server is listening on 0.0.0.0:4000 (not 127.0.0.1)
2. PORT environment variable is set to 4000
3. No crashes on startup

### Database connection failed

**Symptom:** Logs show "ECONNREFUSED" or "Connection refused"
**Fix:** Verify DATABASE_URL is set:
```bash
railway variables | grep DATABASE_URL
```

If missing, re-add PostgreSQL service:
```bash
railway add --database postgres
```

## Cost Optimization Tips

1. **Start small:** Railway free tier includes $5/month credit
2. **Monitor usage:** Check dashboard weekly
3. **Set budget alerts:** Configure in Railway settings
4. **Scale gradually:** Only increase resources when needed

## Next Steps After Deployment

1. ✅ Verify all services healthy
2. ✅ Test health endpoint publicly accessible
3. ✅ Confirm logs are visible in dashboard
4. 🔄 Story 1.3: Set up Effect RPC contracts (adds database schemas)
5. 🔄 Story 1.2: Integrate Better Auth (after RPC setup)

## Quick Reference

```bash
# Common Railway commands
railway login              # Authenticate
railway init               # Create/link project
railway add --database postgres  # Add PostgreSQL
railway add --database redis     # Add Redis
railway variables          # View environment variables
railway variables set KEY=value  # Set environment variable
railway logs               # View logs
railway status             # Check service health
railway domain             # Get public URL
railway run bash           # SSH into backend
```

## Support

- Railway Docs: https://docs.railway.app
- Railway Community: https://discord.gg/railway
- Railway Status: https://status.railway.app
