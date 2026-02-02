# Decision 4: Infrastructure & Hosting ✅

**Selected Approach:** All-Railway Unified Platform with Docker Compose for Local Development

This decision addresses three interconnected concerns: deployment platform simplicity, database infrastructure, and backup/disaster recovery strategy.

## Context: Why Simplified Infrastructure Matters

For a self-funded MVP with complex LLM orchestration, **operational burden is a productivity killer**. Every additional platform means:
- Extra login credentials to manage
- Separate billing invoices
- Different learning curves
- More places for bugs to hide
- More monitoring dashboards

**Railway solves this:** single dashboard, single invoice, one ecosystem for backend + database + cache + monitoring.

---

## Decision 4A: Deployment Platform

**Selected: All-Railway (Single Unified Platform)**

### Why All-Railway vs. Vercel + Railway?

| Aspect | All Railway | Vercel + Railway |
|--------|------------|-----------------|
| **Platforms to manage** | 1 | 2 |
| **Dashboards** | 1 | 2 |
| **Billing** | 1 invoice | 2 invoices |
| **Latency** | Lowest (co-located) | Slight cross-platform overhead |
| **Learning curve** | Single ecosystem | Learn both platforms |
| **Docker Compose parity** | Perfect (same container runtime) | Good but two deployment styles |
| **MVP Friction** | Minimal | Additional context switching |

**Key Insight:** Vercel's main advantage is TanStack Start SSR optimization (built by same team). For MVP, this is **premature optimization**. Railway serves TanStack Start perfectly fine.

### All-Railway Architecture

```
Railway Dashboard (Single pane of glass):
├─ Backend Service
│  └─ Node.js (LangGraph + Effect-ts + Better Auth)
│  └─ Dockerfile: apps/api/Dockerfile
│  └─ Environment: PORT=4000
│
├─ Frontend Service
│  └─ Node.js / TanStack Start (optional separate service)
│  └─ Or: Served from backend + reverse proxy
│
├─ PostgreSQL Database (Managed)
│  └─ Connection pooling automatic
│  └─ Backups: 7-day retention (default)
│  └─ Server-side encryption at rest
│
└─ Redis Cache
   └─ For cost tracking + rate limiting
   └─ For session state (optional)
```

**Cost Estimate (MVP):**
- Backend service: $2-5/month (usage-based)
- PostgreSQL: $2-5/month (usage-based)
- Redis: $1-2/month (usage-based)
- **Total: $5-12/month** ✅ Cheapest option

**Key Benefits:**
- ✅ Single dashboard = single source of truth for monitoring
- ✅ Docker Compose locally → exact same container in production
- ✅ No cold starts (traditional VPS, not serverless)
- ✅ No timeout constraints (unlike Cloudflare Workers)
- ✅ Native PostgreSQL + Redis support
- ✅ Usage-based pricing = pay only what you use
- ✅ Free tier available for experimentation

**Constraints:**
- ⚠️ Less advanced SSR optimizations than Vercel (negligible for MVP)
- ⚠️ No global edge deployment (acceptable for MVP latency targets)

**When You'd Upgrade (Phase 2):**

If you need global edge deployment or advanced SSR optimizations, add **Vercel as a CDN in front** without changing backend:
```
Users → Vercel CDN (edge caching)
     → Railway backend (origin)
```

---

## Decision 4B: Database Infrastructure

**Selected: Railway-Managed PostgreSQL + Redis**

**Why Railway Database?**

| Aspect | Railway | Alternatives |
|--------|---------|--------------|
| **Cost (MVP)** | $2-5/month | Neon $0 (free), Render $7+, Supabase $0-25 |
| **Setup time** | 2 minutes (click "Add Postgres") | 5 minutes (external setup) |
| **Encryption at rest** | ✅ Supported | ✅ All support encryption |
| **Operational burden** | Minimal (managed by Railway) | Minimal (managed) |
| **Scaling** | Automatic | Automatic |
| **Backup included** | Yes (7 days) | Yes (varies by provider) |

**PostgreSQL Configuration:**

```bash
# Railway automatically enables:
# - SSL/TLS connections (required for security)
# - Automatic daily backups (7-day retention)
# - Connection pooling via built-in proxy
# - Server-side encryption at rest

# You get environment variables automatically:
DATABASE_URL=postgresql://user:pass@host:port/big_ocean
```

**Redis Configuration:**

```bash
# Railway Redis for:
# - Cost tracking (adaptive token budget)
# - Rate limiting (1 assessment/user/day)
# - Session cache (optional)

REDIS_URL=redis://user:pass@host:port
```

**No Additional Setup Required:**
- Railway manages schema migrations (you run `drizzle-kit push`)
- Railway manages backups automatically
- Railway manages connection pooling
- Railway handles SSL/TLS

---

## Decision 4C: Backup & Disaster Recovery

**Selected: Railway-Managed Backups + Manual Export Strategy**

**For MVP (Early Stage):**

```
Railway automatic backups (included):
├─ 7-day retention
├─ Daily snapshots
├─ Point-in-time recovery (within 7 days)
└─ Cost: $0 (included)
```

**Recovery Strategy:**

If disaster occurs:
1. **Within 7 days:** Use Railway's PITR (point-in-time recovery)
   ```bash
   # In Railway dashboard: Database → Restore → Choose timestamp
   ```

2. **After 7 days:** Recreate from source (conversations are recoverable via Anthropic API logs)

**When You'd Add 3-2-1 Backups (Phase 2):**

Once you have paying users, implement:
```bash
# Daily export to S3
* 0 1 * * * \
  pg_dump $DATABASE_URL \
  | gzip \
  | aws s3 cp - s3://backups-big-ocean/$(date +\%Y-\%m-\%d).sql.gz

# Weekly export to GCS (offsite)
* 0 0 * * 0 \
  aws s3 cp s3://backups-big-ocean/latest.sql.gz \
  gs://backups-big-ocean/weekly/
```

**Cost:** $0 MVP → $2-5/month Phase 2 (S3 storage)

---
