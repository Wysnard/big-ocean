# Aspirational Architecture — Features NOT YET Built

> **This doc describes features NOT YET built.** For current system state, see [`docs/ARCHITECTURE.md`](../../docs/ARCHITECTURE.md).
>
> Last updated: 2026-02-23

---

## Epic 11: Finalization & Scoring

### FinAnalyzer (Sonnet)

Re-analyzes ALL messages at assessment end with full conversation context. Produces portrait-quality `finalization_evidence` — the single source of truth for results.

**Interface:**
```typescript
FinanalyzerRepository.analyze({
  messages: FinanalyzerMessage[]  // ALL messages with UUIDs
}): Effect<FinanalyzerOutput[], FinanalyzerError>
```

- Input: ALL messages with UUIDs: `[{ id, role, content }, ...]`
- Output: `{ messageId, bigfiveFacet, score, confidence, domain, rawDomain, quote }[]`
- Highlights computed server-side: `message.content.indexOf(quote)`
- Error handling: Retry once, then fail `generateResults` (user retries from wait screen)

### Portrait Generation (Sonnet)

```typescript
PortraitRepository.generate({
  facets: FacetResult[], traits: TraitResult[],
  domainCoverage: Record<LifeDomain, number>,
  evidenceHighlights: FinanalyzerOutput[]
}): Effect<{ portrait: string }, PortraitError>
```

### generateResults Use-Case

Two-phase execution with three-tier idempotency guards:

```
Guard 1: Result already exists → return it (no LLM call)
Guard 2: Finalization evidence exists → skip FinAnalyzer, recompute scores
Guard 3: Full finalization run (LLM calls)

Phase 1 — Analysis:
  FinAnalyzer re-analyzes ALL messages → finalization_evidence
Phase 2 — Portrait & Results:
  Compute scores from finalization evidence → generate portrait → assessment_results
```

### Assessment Results Storage

```
assessment_results:
  id, assessment_session_id (FK), facets (JSONB), traits (JSONB),
  domain_coverage (JSONB), portrait (TEXT), created_at
```

### Session Status Lifecycle

`active → finalizing → completed`

### Finalization Trigger

Frontend-only: `sendMessage` returns `isFinalTurn` when `messageCount >= MESSAGE_THRESHOLD` (30). Frontend navigates to auth gate → wait screen → calls `POST /generate-results`.

### New API Endpoints (Epic 11)

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/assessment/generate-results` | POST | Finalization trigger (auth-required, idempotent) |
| `/api/assessment/finalization-status/:sessionId` | GET | Polling (every 2-3s) |
| `/api/assessment/results/:resultId` | GET | Scores + portrait + evidence |

### Files to Remove (Epic 11 Cleanup)

Domain: `orchestrator.repository.ts`, `orchestrator-graph.repository.ts`, `analyzer.repository.ts`, `facet-evidence.repository.ts`, `portrait-generator.repository.ts`

Infrastructure: `orchestrator.langgraph.repository.ts`, `orchestrator-graph.langgraph.repository.ts`, `orchestrator.nodes.ts`, `orchestrator.state.ts`, `checkpointer.*.repository.ts`, `analyzer.claude.repository.ts`, `facet-steering.ts`, `nerin-agent.langgraph.repository.ts`, all related `__mocks__/`

Use-cases: `calculate-confidence`, `save-facet-evidence`, `update-facet-scores`, `get-facet-evidence`, `get-message-evidence`, `resume-session`, `list-user-sessions`

LangGraph checkpoint tables: `checkpoint_blobs`, `checkpoint_writes`, `checkpoint_migrations` — drop in migration.

---

## Epic 12+: Innovation Features

### Monetization via Polar.sh

- **PWYW portrait unlock** — minimum €1, Polar embedded checkout overlay
- **Relationship analysis credits** — 1 free credit per user (lifetime), additional singles at €5 or 5-packs at €15
- **Extended conversation** — +25 messages bundled with full portrait for €20 (Phase B)
- **Full pack** — €30 bundle (Phase B)
- **Gift products** — Gift Portrait (PWYW) and Gift Relationship Pack (€10) (Phase B)
- **Payment processing** — Polar.sh as merchant-of-record handles EU VAT. Backend receives webhooks. Frontend uses `@polar-sh/checkout`

**Append-only `purchase_events` event log** for all transactions. Capabilities derived from immutable events.

**Event types:** `free_credit_granted`, `portrait_unlocked`, `credit_purchased`, `credit_consumed`, `extended_conversation_unlocked`, `portrait_refunded`, `credit_refunded`, `extended_conversation_refunded`

### Relationship Analysis

- Invitation system: user creates shareable link (1 credit consumed) → invitee completes assessment → accept/refuse
- `relationship_invitations` + `relationship_analyses` tables
- Sonnet/Opus LLM using both users' facet data + finalization evidence
- Two-step consent (inviter at link creation, invitee at acceptance)

### Teaser/Full Portrait Two-Tier Generation

- **Teaser (Haiku):** Generated at assessment completion (free). 3-4 paragraphs with locked section titles
- **Full (Sonnet/Opus):** Generated after PWYW payment. Deep narrative via `Effect.forkDaemon` + placeholder row pattern
- Separate `portraits` table with FK to `assessment_results`

### Viral/Growth Mechanics

- **Archetype card sharing** — Server-side Satori (JSX → SVG → PNG), content-hashed URLs, Cache-Control immutable
- **InvitationBottomSheet** — QR code + copy link + native share
- Two distinct viral loops: archetype sharing (one-to-many) and relationship invitations (one-to-one)

### Budget Protection & Waitlist

- Extend `CostGuardRepository` with global daily assessment count (atomic Redis gate)
- `waitlist_emails` table for overflow

### ADR-7: Remove Derived Archetype Fields from `public_profile`

**Decision:** Remove `archetypeName`, `description`, `color`, `traitSummary` from `public_profile`. Keep `oceanCode4` for DB queries. Derive archetype metadata at read-time via `lookupArchetype()` + `deriveTraitSummary()` in use-case layer.

**Rationale:** ADR-5 establishes archetype data as in-memory derivable constants. Storing them in DB contradicts single source of truth and prevents instant propagation of archetype wording updates.

### New Repository Interfaces (Innovation Features)

| Repository | Purpose | Implementation |
|---|---|---|
| `PaymentGatewayRepository` | Polar webhook verification + checkout URLs | `payment-gateway.polar.repository.ts` |
| `CardGeneratorRepository` | Archetype card generation (Satori) | `card-generator.satori.repository.ts` |
| `PortraitRepository` (teaser/full) | Portrait generation | `portrait.drizzle.repository.ts` |
| `RelationshipInvitationRepository` | Invitation CRUD | `relationship-invitation.drizzle.repository.ts` |
| `RelationshipAnalysisRepository` | Cross-user analysis | `relationship-analysis.drizzle.repository.ts` |
| `PurchaseEventRepository` | Event log queries | `purchase-event.drizzle.repository.ts` |
| `WaitlistRepository` | Waitlist email collection | `waitlist.drizzle.repository.ts` |

### Implementation Patterns (Innovation)

1. **Placeholder Row Pattern:** Insert with `content: null` before `forkDaemon`, daemon UPDATEs on completion
2. **Capability Derivation from Events:** Derive capabilities from `purchase_events`, never store computed state
3. **Webhook Handler → Use-Case Delegation:** Thin handler, business logic in `process-purchase.use-case.ts`
4. **Status Derivation from Data:** `portraitStatus` derived from `portraits` table rows, no status columns
5. **Transaction Boundaries:** Related writes in single `db.transaction()` (e.g., credit_consumed + invitation INSERT)
6. **Lazy Retry via Polling:** Polling checks staleness, triggers retry if generating > 5min AND retry_count < 3
7. **Provider-Prefixed Fields:** All Polar-specific fields use `polar_` prefix

### Decision Trees

See `_bmad-output/planning-artifacts/architecture.md` for detailed decision trees:
- Tree 1: Results Page State Resolution
- Tree 2: Polar Checkout Trigger
- Tree 3: Invitation Creation
- Tree 4: Invitation Link Click
- Tree 5: Accept/Refuse

---

## Source Documents

This consolidated doc was produced from:
1. `_bmad-output/planning-artifacts/architecture.md` — Innovation features (Polar.sh, portraits, relationships)
2. `_bmad-output/planning-artifacts/architecture-assessment-pipeline.md` — Pipeline redesign (ConversAnalyzer, FinAnalyzer, formulas)
3. `_bmad-output/planning-artifacts/architecture-archetype-description-storage.md` — ADR-7 archetype denormalization
