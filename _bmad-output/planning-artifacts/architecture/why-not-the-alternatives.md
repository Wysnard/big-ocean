# Why Not the Alternatives?

## Cloudflare Workers (Pages + Workers)
- ❌ **10-30 second timeout** is dealbreaker for Nerin agent reasoning
- ⚠️ LangGraph compatibility uncertain under timeout constraint
- ⚠️ Effect-ts requires bridge pattern (extra complexity)
- 🚨 Risk: Long reasoning chains would timeout

## Cloudflare Containers (Pages + Containers)
- ⏳ **Still in beta** (launched June 2025, stability unproven)
- ⚠️ **Pricing model unclear** (free during beta, unknown at GA)
- ⚠️ Community track record thin
- Later: Once Containers GA + pricing transparent, consider as alternative

## Vercel + Railway
- ✅ Works well
- ⚠️ **Extra complexity:** Two platforms, two dashboards, two invoices
- ⚠️ Vercel's SSR advantages negligible for MVP
- Later: Add Vercel CDN in Phase 2 if needed

## Docker VPS (Linode, Vultr, DigitalOcean)
- ✅ Works, full control
- ⚠️ **Operational burden:** You manage OS patching, backups, monitoring
- ⚠️ Fixed cost ($20/month minimum)
- ❌ Not worth the overhead for MVP

---
