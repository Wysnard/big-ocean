# Cost Summary (All-Railway Path)

| Component | Monthly Cost | Notes |
|-----------|------------|-------|
| Backend | $2-5 | Usage-based (CPU hours, memory) |
| PostgreSQL | $2-5 | Usage-based (storage, queries) |
| Redis | $1-2 | Usage-based (memory, operations) |
| **Railway Total** | **$5-12** | Scales with usage |
| Claude API | ~$90 | Fixed (based on assessment volume) |
| Sentry | $0 | Free Developer plan |
| **MVP Total** | **~$95-102/month** | Dominated by LLM costs |

**Payment Model:**
- All Railway services: Usage-based (you can set spending limits)
- Claude API: Based on token usage (configure daily cap: $75/day)
- Billing: Single Railway invoice + Anthropic invoice

---
