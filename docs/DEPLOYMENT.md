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
| `RESEND_API_KEY` | `re_...` | Resend API key (see setup below) |
| `EMAIL_FROM_ADDRESS` | `noreply@bigocean.dev` | Verified sender address |
| `DROP_OFF_THRESHOLD_HOURS` | `24` | Hours before drop-off email triggers |

## Resend Email Setup

Resend is used for transactional emails (drop-off re-engagement, future notification emails).

### 1. Create a Resend Account

Sign up at [resend.com/signup](https://resend.com/signup).

### 2. Add and Verify Your Domain

1. Go to [resend.com/domains](https://resend.com/domains)
2. Click **Add Domain** and enter `bigocean.dev` (or your domain)
3. Resend will provide DNS records to add:
   - **MX record** — for receiving bounces
   - **TXT record** (SPF) — authorizes Resend to send on your behalf
   - **CNAME records** (DKIM) — cryptographic email signing
4. Add these records in your DNS provider (Cloudflare, Route 53, etc.)
5. Click **Verify** in Resend — DNS propagation can take up to 72 hours

### 3. Create an API Key

1. Go to [resend.com/api-keys](https://resend.com/api-keys)
2. Click **Create API Key**
3. Name it (e.g., `big-ocean-production`)
4. Set permission to **Sending access**
5. Optionally restrict to your verified domain
6. Copy the key (`re_...`) — it's only shown once

### 4. Configure Environment Variables

Add to Railway (or `.env` for local dev):

```bash
RESEND_API_KEY=re_your_api_key_here
EMAIL_FROM_ADDRESS=noreply@bigocean.dev
DROP_OFF_THRESHOLD_HOURS=24
```

- `RESEND_API_KEY` — Required for sending emails. Defaults to `not-configured` (emails silently fail in dev).
- `EMAIL_FROM_ADDRESS` — Must match a verified domain. Defaults to `noreply@bigocean.dev`.
- `DROP_OFF_THRESHOLD_HOURS` — How long a session must be inactive before triggering a drop-off email. Defaults to `24`.

### 5. Test the Integration

Trigger the drop-off check endpoint:

```bash
curl -X POST https://your-api-url/api/email/check-drop-off
```

This scans for sessions inactive beyond the threshold and sends one-shot re-engagement emails. The endpoint is designed for cron invocation (e.g., Railway cron or external scheduler).

### Local Development

In local dev, `RESEND_API_KEY` defaults to `not-configured`, which means email sends will fail gracefully (fire-and-forget pattern — failures are logged, never block operations). To test real emails locally, add a valid key to your `.env` file.

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
