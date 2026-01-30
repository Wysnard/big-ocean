# Railway Deployment Guide

This guide covers deploying the big-ocean monorepo to Railway as separate services for the frontend and backend.

## Architecture

The application is deployed as **two separate Railway services**:

- **API Service** - Node.js backend (port 4000)
- **Frontend Service** - TanStack Start SSR frontend (port 3000)

Each service has its own:

- Dockerfile (`apps/api/Dockerfile`, `apps/front/Dockerfile`)
- Railway configuration (`apps/api/railway.json`, `apps/front/railway.json`)
- Independent scaling and environment variables

## Prerequisites

1. **Railway CLI** installed and authenticated:

   ```bash
   npm install -g @railway/cli
   railway login
   ```

2. **Railway Project** created:

   ```bash
   # Create new project or link existing one
   railway init
   # or
   railway link
   ```

3. **PostgreSQL Database** provisioned in Railway (for the API)

## Step 1: Deploy the API Service

### 1.1 Create the API Service

From the repository root:

```bash
# Create and link the API service
railway service create api
railway link --service api
```

### 1.2 Set Environment Variables

Set the required environment variables for the API service in the Railway dashboard or via CLI:

```bash
# Required for API
railway variables set NODE_ENV=production
railway variables set PORT=4000
railway variables set DATABASE_URL=<your-postgres-connection-string>

# Add your API-specific variables
railway variables set ANTHROPIC_API_KEY=<your-key>
railway variables set LOG_LEVEL=info
```

### 1.3 Deploy the API

```bash
# Deploy from root, Railway will use apps/api/railway.json
cd /path/to/big-ocean
railway up --service api
```

Railway will:

1. Build using `apps/api/Dockerfile`
2. Run health checks on `/health`
3. Start the service on port 4000

### 1.4 Get the API URL

```bash
# Generate a domain for the API
railway domain
```

Save this URL - you'll need it for the frontend configuration.

## Step 2: Deploy the Frontend Service

### 2.1 Create the Frontend Service

```bash
# Create and link the frontend service
railway service create front
railway link --service front
```

### 2.2 Set Environment Variables

Set the required environment variables for the frontend:

```bash
# Required for frontend
railway variables set NODE_ENV=production
railway variables set PORT=3000

# API connection
railway variables set VITE_API_URL=<your-api-url-from-step-1.4>

# Add your frontend-specific variables
railway variables set VITE_APP_NAME="Big Ocean"
```

### 2.3 Deploy the Frontend

```bash
# Deploy from root, Railway will use apps/front/railway.json
cd /path/to/big-ocean
railway up --service front
```

Railway will:

1. Build using `apps/front/Dockerfile`
2. Start the Nitro server on port 3000

### 2.4 Get the Frontend URL

```bash
# Generate a domain for the frontend
railway domain
```

This is your public application URL.

## Service Configuration Details

### API Service (`apps/api/railway.json`)

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "apps/api/Dockerfile"
  },
  "deploy": {
    "healthcheckPath": "/health",
    "healthcheckTimeout": 30,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

**Health Check**: Ensure your API has a `/health` endpoint that returns 200 OK.

### Frontend Service (`apps/front/railway.json`)

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "apps/front/Dockerfile"
  },
  "deploy": {
    "startCommand": "node .output/server/index.mjs",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

## Environment Variables Reference

### API Service

| Variable            | Required | Description                         |
| ------------------- | -------- | ----------------------------------- |
| `NODE_ENV`          | Yes      | Set to `production`                 |
| `PORT`              | Yes      | API port (default: 4000)            |
| `DATABASE_URL`      | Yes      | PostgreSQL connection string        |
| `ANTHROPIC_API_KEY` | Yes      | Claude API key for LangGraph agents |
| `LOG_LEVEL`         | No       | Logging level (default: info)       |

### Frontend Service

| Variable        | Required | Description                   |
| --------------- | -------- | ----------------------------- |
| `NODE_ENV`      | Yes      | Set to `production`           |
| `PORT`          | Yes      | Frontend port (default: 3000) |
| `VITE_API_URL`  | Yes      | Backend API URL from Railway  |
| `VITE_APP_NAME` | No       | Application name for branding |

## Updating Deployments

### Redeploy a Service

```bash
# Redeploy API
railway up --service api

# Redeploy frontend
railway up --service front
```

### View Logs

```bash
# View API logs
railway logs --service api

# View frontend logs
railway logs --service front
```

### Check Service Status

```bash
# List all services
railway service

# Get service details
railway status --service api
railway status --service front
```

## CI/CD Integration

You can automate deployments using GitHub Actions or other CI/CD tools:

```yaml
# .github/workflows/deploy.yml
name: Deploy to Railway

on:
  push:
    branches: [main]

jobs:
  deploy-api:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install Railway CLI
        run: npm install -g @railway/cli
      - name: Deploy API
        run: railway up --service api
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}

  deploy-frontend:
    runs-on: ubuntu-latest
    needs: deploy-api
    steps:
      - uses: actions/checkout@v3
      - name: Install Railway CLI
        run: npm install -g @railway/cli
      - name: Deploy Frontend
        run: railway up --service front
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

## Troubleshooting

### Build Failures

1. **Dependency issues**: Ensure `pnpm-lock.yaml` is committed
2. **Workspace resolution**: Verify all package.json files are included in Dockerfiles
3. **Build errors**: Check Railway build logs: `railway logs --service <service-name>`

### Runtime Issues

1. **Health check failures (API)**:
   - Verify `/health` endpoint is implemented
   - Check API is listening on correct PORT from environment variable
   - Review logs: `railway logs --service api`

2. **Frontend not loading**:
   - Verify `VITE_API_URL` is set correctly
   - Check Nitro build output in `.output/server/`
   - Review logs: `railway logs --service front`

3. **Database connection errors**:
   - Verify `DATABASE_URL` is set correctly
   - Check PostgreSQL service is running
   - Test connection from Railway shell: `railway run --service api`

### Connection Issues Between Services

If the frontend can't connect to the API:

1. Use Railway's **internal networking** for service-to-service communication:

   ```bash
   # Set internal API URL for frontend
   railway variables set VITE_API_URL=http://api.railway.internal:4000 --service front
   ```

2. Enable **public domains** for external access:
   ```bash
   railway domain --service api
   railway domain --service front
   ```

## Monorepo Build Scripts

The root `package.json` includes convenience scripts:

```bash
# Build specific apps locally (for testing)
pnpm build:api    # Build API only
pnpm build:front  # Build frontend only
pnpm build        # Build all apps
```

## Cost Optimization

- **Starter Plan**: Both services can run on Railway's free tier for development
- **Pro Plan**: Required for production workloads with dedicated resources
- **Scaling**: Scale services independently based on load

## Additional Resources

- [Railway Documentation](https://docs.railway.app)
- [Railway Monorepo Guide](https://docs.railway.app/deploy/monorepo)
- [Railway CLI Reference](https://docs.railway.app/develop/cli)
