# Monitoring & Operations (Phase 1)

**What Railway Provides:**

```
Dashboard → Backend Service:
├─ CPU usage
├─ Memory usage
├─ Disk usage
├─ Network I/O
└─ Deployment history (with rollback capability)

Dashboard → PostgreSQL:
├─ Connection count
├─ Query performance
└─ Storage usage

Dashboard → Redis:
├─ Memory usage
├─ Hit rate
├─ Commands/sec
└─ Connected clients
```

**No Additional Tools Needed (MVP):**

- Railway dashboard covers 80% of monitoring needs
- Sentry covers error tracking (already configured)
- Pino logs appear in Railway logs tab
- Cost tracking via Pino + Sentry breadcrumbs

**Alerting (Phase 2):**

When database grows, add:
- Railway alerts (CPU, memory, disk thresholds)
- Custom metrics via Sentry

---
