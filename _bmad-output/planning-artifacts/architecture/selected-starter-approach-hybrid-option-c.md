# Selected Starter Approach: Hybrid (Option C)

## Rationale for Selection

The **Hybrid approach** (TanStack Start CLI + Manual Effect-ts) scores **8.6/10** and provides optimal balance:

1. **Speed:** Frontend ready in hours via TanStack CLI; MVP-critical paths cleared early
2. **Architecture:** Backend scaffolding aligns precisely with effect-worker-mono pattern; no retrofitting
3. **Cost Control:** Effect layer integrates cost tracking, budget guards, graceful degradation naturally
4. **Nerin Orchestration:** LangGraph + Effect state machine is canonical pattern; no fighting framework
5. **Privacy & Sync:** Server-side encryption + RLS + RPC filtering feels coherent across stack
6. **Long-Term:** Clear separation between frontend (TanStack concerns) and backend (Effect concerns)

## Implementation Path

**Step 1: Frontend Initialization**
```bash
pnpm create @tanstack/start@latest apps/front \
  --add-ons shadcn,tanstack-query \
  --package-manager pnpm
```

**Step 2: Backend Scaffolding (Manual, effect-worker-mono pattern)**
```bash
# Create directory structure
mkdir -p apps/api/src/{agents,handlers,services,middleware,db,context}

# Initialize Node.js project
pnpm -C apps/api init -y

# Add Effect-ts + orchestration + database dependencies
pnpm -C apps/api add \
  effect @effect/rpc @effect/schema \
  @langchain/langgraph @anthropic-ai/sdk \
  drizzle-orm pg redis \
  express cors helmet

# Add development dependencies
pnpm -C apps/api add -D \
  typescript @types/node ts-node tsx \
  eslint prettier @typescript-eslint/parser \
  @typescript-eslint/eslint-plugin
```

**Step 3: Shared Packages (Already exist in monorepo)**
- No additional commands; pnpm workspace links automatically
- Existing: `packages/{domain,contracts,database,infrastructure,ui}`

**Step 4: Wire Up First Session (End-to-End Flow)**
- Implement `startAssessment` RPC handler
- Implement `sendMessage` RPC handler with Nerin orchestration
- Wire TanStack Query hooks (useSessionHistory, useSendMessage)
- Integrate cost tracking via middleware

## Timeline & Milestones

| Phase | Week | Deliverable |
|-------|------|-------------|
| **Phase 1: Setup** | Week 1 | TanStack Start initialized + backend directory structure + RPC contracts |
| **Phase 2: Core Session Flow** | Week 1-2 | First session end-to-end (startAssessment → sendMessage → resume via URL) |
| **Phase 3: Nerin Integration** | Week 2-3 | LangGraph agent orchestration working + streaming responses |
| **Phase 4: Cost Control** | Week 3 | Budget tracking + rate limiting operational |
| **Phase 5: Privacy & Sharing** | Week 3-4 | Server-side encryption + RLS + public profiles working |
| **Phase 6: Testing & QA** | Week 4 | Unit tests, integration tests, E2E tests, Storybook docs |

## Key References During Implementation

- **[TanStack Start Official Docs](https://tanstack.com/start/latest/docs/framework/react/overview)** — Frontend patterns, SSR, streaming
- **[effect-worker-mono Repository](https://github.com/backpine/effect-worker-mono)** — Your exact backend pattern (FiberRef bridges, RPC handlers, middleware)
- **[Effect-ts Official Docs](https://effect.website/)** — Effect Layer setup, FiberRef, error handling
- **[LangGraph Documentation](https://docs.langchain.com/oss/javascript/langgraph/overview)** — Agent orchestration patterns
- **Your ADRs (this document)** — Cost control, privacy model, archetype lookup decisions

## Risk Mitigation

**Risk 1: Manual backend scaffolding creates inconsistency**
- **Mitigation:** Use effect-worker-mono as strict reference; follow directory structure exactly
- **Prevention:** Create implementation checklist verifying against effect-worker-mono pattern

**Risk 2: Effect-ts learning curve delays backend work**
- **Mitigation:** Dedicate developer time to study effect-worker-mono handlers before implementation
- **Prevention:** Team review of Effect patterns + FiberRef bridges first

**Risk 3: TanStack Query caching edge cases (stale data)**
- **Mitigation:** Set appropriate `staleTime` and `refetchInterval` for assessment data (suggest: staleTime 1s, refetch on window focus)
- **Prevention:** Write integration tests for mutation + refetch cycles (test optimistic update rollback)

---
