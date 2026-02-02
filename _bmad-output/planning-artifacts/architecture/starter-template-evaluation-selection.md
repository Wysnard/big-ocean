# Starter Template Evaluation & Selection

## Evaluation Criteria (Weighted)

| Criterion | Weight | Why It Matters |
|-----------|--------|----------------|
| **Setup Speed (MVP Timeline)** | 15% | Need working frontend + backend quickly |
| **Effect-ts / RPC Alignment** | 20% | Must follow effect-worker-mono pattern cleanly |
| **Cost Control Integration** | 15% | Budget enforcement is existential for self-funded MVP |
| **LLM Orchestration (LangGraph)** | 15% | Nerin orchestration is your competitive moat |
| **TanStack Query Integration** | 10% | Server-state management needs clean patterns |
| **Long-Term Maintainability** | 15% | Avoid tech debt that haunts you post-launch |
| **Documentation & Community** | 10% | Can you find help when stuck? |

## Comparative Analysis: Starter Options

### **Option A: TanStack Start CLI Only** (Not Recommended)

**Approach:** Run `pnpm create @tanstack/start@latest` for both frontend AND backend

| Criterion | Score | Analysis |
|-----------|-------|----------|
| Setup Speed | 9/10 | Fastest possible — one command, everything ready |
| Effect-ts Alignment | 2/10 | ❌ TanStack Start doesn't include Effect-ts; retrofitting feels awkward |
| Cost Control | 3/10 | ❌ No built-in Redis/budget tracking; requires custom bolting-on |
| LangGraph Ready | 2/10 | ❌ Designed for tRPC/Server Functions, not multi-agent orchestration |
| TanStack Query | 8/10 | ✅ TanStack Start integrates Query patterns well |
| Maintainability | 4/10 | ⚠️ Mixing backend logic in TanStack blurs concerns; hard to separate |
| Documentation | 9/10 | ✅ Excellent docs (for TanStack, not Effect-ts integration) |
| **WEIGHTED SCORE** | **4.8/10** | ❌ **AVOID** |

**Why This Fails:**
- TanStack Start optimized for SSR + Server Functions (tRPC-style), not Effect-ts/RPC
- Cost control, LangGraph orchestration, privacy layer feel bolted-on
- Architectural confusion mixing frontend + backend in same framework

---

### **Option B: Manual Everything** (Pure but Slow)

**Approach:** Build frontend + backend scaffolding from scratch (no starters)

| Criterion | Score | Analysis |
|-----------|-------|----------|
| Setup Speed | 3/10 | ❌ Slowest — you build everything from scratch |
| Effect-ts Alignment | 10/10 | ✅ Full control; follow effect-worker-mono perfectly |
| Cost Control | 10/10 | ✅ Build cost tracking exactly as envisioned |
| LangGraph Ready | 10/10 | ✅ LangGraph + Effect layers integrate seamlessly |
| TanStack Query | 7/10 | ⚠️ Works, but manual state management patterns needed |
| Maintainability | 9/10 | ✅ Clear separation; no framework assumptions to fight |
| Documentation | 4/10 | ❌ You write docs as you go; Effect-ts community is small |
| **WEIGHTED SCORE** | **7.5/10** | ⚠️ **ACCEPTABLE** (slow to first working state) |

**Trade-off:**
- ✅ Architectural purity
- ❌ Weeks of scaffolding before first session runs
- ❌ Risk: Solo decisions may miss best practices

---

### **Option C: Hybrid (TanStack CLI + Manual Effect-ts)** ✅ RECOMMENDED

**Approach:** TanStack Start for `apps/front` + Manual Effect-ts for `apps/api` + effect-worker-mono pattern

| Criterion | Score | Analysis |
|-----------|-------|----------|
| Setup Speed | 8/10 | ✅ Frontend ready immediately; backend scaffolding manageable |
| Effect-ts Alignment | 9/10 | ✅ Backend follows effect-worker-mono exactly; frontend separate |
| Cost Control | 9/10 | ✅ Effect layer for cost tracking feels natural; FiberRef bridges work seamlessly |
| LangGraph Ready | 9/10 | ✅ LangGraph agents + Effect state machine is canonical pattern |
| TanStack Query | 9/10 | ✅ TanStack Query provides proven server-state patterns seamlessly |
| Maintainability | 9/10 | ✅ Clear split: frontend (TanStack) + backend (Effect) concerns |
| Documentation | 8/10 | ✅ Reference TanStack Start docs + effect-worker-mono as guides |
| **WEIGHTED SCORE** | **8.6/10** | ✅ **STRONGLY RECOMMENDED** |

**Why This Wins:**
- ✅ Frontend ready in hours (leverage TanStack CLI)
- ✅ Backend clarity (manual scaffolding = exact effect-worker-mono alignment)
- ✅ Cost control, LangGraph, TanStack Query feel like natural extensions
- ✅ Long-term: Clear separation means can evolve independently
- ✅ Reference implementation (effect-worker-mono) available to copy from

---

## Scoring Summary

```
Option A (TanStack Only):        4.8/10  ❌ Avoid — Framework misalignment
Option B (Manual Full):          7.5/10  ⚠️ Acceptable — Too slow to MVP
Option C (Hybrid):               8.6/10  ✅ Optimal — Speed + Architecture
```

---
