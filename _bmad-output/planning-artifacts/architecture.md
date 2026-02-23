---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
lastStep: 8
status: 'complete'
completedAt: '2026-02-23'
inputDocuments:
  - '_bmad-output/innovation-strategy-2026-02-22.md'
  - '_bmad-output/planning-artifacts/ux-design-innovation-strategy.md'
  - '_bmad-output/planning-artifacts/prd.md'
  - '_bmad-output/planning-artifacts/architecture-assessment-pipeline.md'
  - 'docs/ARCHITECTURE.md'
workflowType: 'architecture'
project_name: 'big-ocean'
user_name: 'Vincentlay'
date: '2026-02-23'
elicitationMethods:
  - 'ADR: Relationship Pair Model, Portrait Pipeline, Polar Integration, Invitation Flow, Cross-User Access, Circuit Breaker'
  - 'First Principles Analysis: Purchase Events Event Log'
  - 'Constraint Mapping: Payment & Capability Architecture'
  - 'Party Mode: Tech Stack Review (Winston, Amelia, Victor)'
  - 'Failure Mode Analysis: Portrait Pipeline, Optimistic Payment, forkDaemon Recovery'
  - 'Sequence Diagramming: Teaser Flow, PWYW Payment Flow, Invitation Accept Flow'
  - 'Party Mode: Step 4 Review (John, Amelia, Quinn)'
  - 'Gap Analysis: Prompt Location, Token Flow, Notification Pin, Polar Config, Card States, Error Messages'
  - 'Decision Tree Mapping: Results Page State, Checkout Trigger, Invitation Creation, Link Click, Accept/Refuse'
  - 'Party Mode: Step 6 Review (Amelia, Winston, Quinn)'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements (Architectural Scope):**

This architecture addresses the innovation strategy features layered on top of the assessment pipeline redesign (documented in `architecture-assessment-pipeline.md`). Three new product domains require architectural support:

#### 1. Monetization via Polar.sh

- **PWYW portrait unlock** — minimum €1, no preset default. Polar embedded checkout overlay triggered directly from TeaserPortrait's "Reveal" button. No custom payment UI.
- **Relationship analysis credits** — 1 free credit per user (lifetime), additional singles at €5 or 5-packs at €15.
- **Extended conversation** — +25 messages bundled with full portrait for €20 (Phase B).
- **Full pack** — €30 bundle (Phase B).
- **Gift products** — Gift Portrait (PWYW) and Gift Relationship Pack (€10) (Phase B).
- **Payment processing** — Polar.sh as merchant-of-record handles EU VAT, invoicing, CNIL-compliant payment data. Backend receives webhooks for purchase verification. Frontend uses `@polar-sh/checkout` for embedded overlay.

#### 2. Relationship Analysis

- **Invitation system** — User spends one credit to generate a shareable link (unique token). Invitee clicks → anonymous-first Nerin conversation → signup after completion → sees notification pin + RelationshipCard with accept/refuse on results page → relationship analysis generated on accept.
- **One credit = one link** — Credit consumed at link creation, not at analysis generation. Each link is pre-paid and independent.
- **Pair deduplication** — Canonical pair ordering `(MIN(id), MAX(id))` with unique constraint. One analysis per unique user pair.
- **Analysis generation** — Sonnet/Opus LLM using both users' facet data + finalization evidence (quotes, facets, scores, domains, rawDomains). Growth-oriented framing, never judgmental.
- **Access model** — Both participants access analysis independently once invitee accepts. "Read together" is a ritual nudge, not a gate.
- **Credit model** — 1 free credit per user (lifetime baseline). Available = `1 + purchased_credits - created_invitations`. Credit not refunded on invitee refusal.
- **Existing-user invitees** — Always reuse existing assessment (Phase A). See notification on next visit.
- **Accept/Refuse UX** — Invitee sees notification pin on header avatar + RelationshipCard on results page: "[User A] is waiting for your response" with Accept/Refuse buttons. Accept triggers analysis generation. Refuse notifies inviter ("declined" state).

#### 3. Teaser/Full Portrait Two-Tier Generation

- **Teaser portrait (Haiku)** — Generated at assessment completion (free tier). 3-4 paragraphs surfacing named tensions from facet data. Plus locked section titles hinting at full portrait depth.
- **Full portrait (Sonnet/Opus)** — Generated only after PWYW payment. Deep narrative built around "spine" architecture.
- **Separate `portraits` table** — Supports multiple versions (teaser, full, future re-generations). All versions kept. FK to `assessment_results`.
- **Portrait status** — Derived from data: no portrait rows → `'none'`. Teaser exists, no full → `'teaser'`. Full exists → `'ready'`. Generation in progress → `'generating'`.
- **Conversation → Results transition** — Reduced from ~10s to ~3-5s (teaser is cheaper/faster).

#### 4. Viral/Growth Mechanics

- **Archetype card sharing** — Downloadable branded images (9:16 + 1:1) generated server-side via Satori (JSX → SVG → PNG). Geometric signature + archetype name + OCEAN code + watermark. Cache-Control immutable with content-hashed URLs.
- **InvitationBottomSheet** — QR code (`qrcode.react`) + copy link + native share (`navigator.share`) + editable personal message.
- **Invitation framing** — "[User A] is curious about your personality" — leads with invitee benefit.
- **Two distinct viral loops** — Loop A (archetype sharing, one-to-many, low conversion) and Loop B (relationship invitations, one-to-one, high conversion). Track separately.

#### 5. Budget Protection & Waitlist

- **Waitlist/circuit breaker** — Extend `CostGuardRepository` with global daily assessment count via atomic Redis check-and-increment. When threshold reached → new conversations blocked, existing continue.
- **Waitlist storage** — Simple `waitlist_emails` table (email, created_at, notified_at).
- **Per-user message rate limit** — 2 messages/minute (existing).
- **Budget reservation for finalization** — Fixed reservation at session start (existing).

### Technical Constraints & Dependencies

**Existing Infrastructure (preserved):**
- Hexagonal architecture with Effect-ts Context.Tag DI
- Assessment pipeline architecture (two-tier analysis, formula steering, conversanalyzer/finanalyzer)
- `assessment_results` table with JSONB scores
- Anonymous-first session architecture (httpOnly cookies → authenticated transition)
- Better Auth for authentication
- Drizzle ORM + PostgreSQL
- TanStack Start SSR frontend

**New External Dependencies:**
- **Polar.sh** — `@polar-sh/checkout` npm package for embedded checkout. Webhook integration for payment verification. PWYW product configured in Polar dashboard. Merchant-of-record for EU VAT/invoicing.
- **Satori + `@resvg/resvg-js`** — Server-side archetype card generation (JSX → SVG → PNG). No DOM dependency, deterministic output, enables OG meta images.
- **`qrcode.react`** — Client-side QR code generation for invitation links.

**Dependencies on Assessment Pipeline Architecture:**
- Teaser portrait generation depends on `conversation_evidence` being available at assessment completion
- Full portrait generation reuses finanalyzer + portrait repository pattern from pipeline architecture
- Relationship analysis needs cross-user access to finalization evidence (new access pattern)
- Separate `portraits` table with FK to `assessment_results` supports teaser/full/version history
- Session completion flow branches: teaser generation (free, immediate) vs full portrait generation (paid, deferred)

**GDPR/CNIL Constraints:**
- Personality data may qualify as Article 9 special category
- Pre-launch: legal consultation (~€500), DPIA, explicit granular consent
- Relationship analysis shares evidence between two users — requires explicit consent from both (inviter at link creation, invitee at acceptance)
- Anthropic DPA review for EU adequacy

**Cross-cutting notes:** Teaser calibration requires A/B testing infrastructure for teaser variations (locked section titles generated alongside content). Results page has multiple state dimensions: `portraitStatus`, relationship card state, auth state, purchase state — see Decision Tree 1 for resolution logic.

### Architecture Decisions (from Advanced Elicitation)

#### ADR 1: Relationship Pair Data Model (revised in Step 4)

**Decision:** Separate `relationship_invitations` + `relationship_analyses` tables. `UNIQUE(invitation_id)` — one analysis per invitation, not per pair. Same pair can have multiple analyses over time via separate invitations.

**Schema:** `relationship_analyses` — `{ id (PK), invitation_id (FK, UNIQUE), user_a_id (canonical MIN), user_b_id (canonical MAX), content (nullable — NULL = generating placeholder), model_used, retry_count DEFAULT 0, created_at }`

**Rationale:**
- Different lifecycle (invitation vs completed analysis), different security concerns
- `relationship_invitations`: token, inviter_id, invitee_id (nullable until claimed), status (pending/accepted/refused/expired), expiry, created_at
- Multiple analyses per pair allowed — users retake assessments, relationship evolves over time
- Each analysis costs 1 credit (via invitation link)
- Placeholder pattern: INSERT with `content: null` before forkDaemon, daemon UPDATEs `WHERE invitation_id = X AND content IS NULL`

#### ADR 2: Portrait Pipeline — Separate `portraits` Table

**Decision:** Portraits stored in a dedicated table with FK to `assessment_results`. Supports multiple versions (teaser, full, future re-generations). See [Portrait Generation Pipeline](#portrait-generation-pipeline) for authoritative schema.

**Rationale:**
- Multiple versions kept (teaser persists after full is generated — analytics value)
- Future: re-generate portraits with improved prompts, keep history
- `portraitStatus` derived from data, not stored as a state column
- `TeaserPortraitRepository` (Haiku) and `PortraitRepository` (Sonnet) insert different tiers

#### ADR 3: Polar Integration & Purchase Events Event Log (revised in Step 3)

**Decision:** Append-only `purchase_events` event log for all transactions. Capabilities derived from immutable events — no mutable counters. One credit = one link (pre-paid at creation). `free_credit_granted` event on signup eliminates magic constants.

**Credit formula:** `available = COUNT(free_credit_granted + credit_purchased) * units - COUNT(credit_consumed)`

**Schema:**
```
purchase_events:
  id                  UUID PK
  user_id             UUID FK → users
  event_type          TEXT NOT NULL
  polar_checkout_id   TEXT (unique, nullable — only for payment events)
  polar_product_id    TEXT (nullable)
  amount_cents        INTEGER (nullable — only for payment events)
  currency            TEXT (nullable)
  metadata            JSONB (nullable — invitation_id for credit_consumed, etc.)
  created_at          TIMESTAMP
```

**Event types (8):**

| Event | Trigger | Derives |
|-------|---------|---------|
| `free_credit_granted` | User signup (once per user) | +1 available credit |
| `portrait_unlocked` | Polar webhook confirms PWYW payment | Full portrait access |
| `credit_purchased` | Polar webhook confirms credit purchase | +1 or +5 available credits |
| `credit_consumed` | User creates invitation link | -1 available credit |
| `extended_conversation_unlocked` | Polar webhook confirms €20 bundle | +25 messages + full portrait access |
| `portrait_refunded` | Polar refund webhook | Revokes full portrait access |
| `credit_refunded` | Polar refund webhook | -N available credits |
| `extended_conversation_refunded` | Polar refund webhook | Revokes extended conversation |

**Derived capabilities:**
```typescript
// Credits
available_credits = COUNT(free_credit_granted + credit_purchased) * units - COUNT(credit_consumed)

// Portrait access
hasFullPortrait = EXISTS(portrait_unlocked OR extended_conversation_unlocked)
  AND NOT EXISTS(matching refund)

// Extended conversation
hasExtendedConversation = EXISTS(extended_conversation_unlocked)
  AND NOT EXISTS(extended_conversation_refunded)
```

**Transaction boundaries:**
- `credit_consumed` + `relationship_invitations` INSERT in a single Drizzle `db.transaction()` — both or neither
- `process-purchase.use-case.ts` handles webhook → event insertion → side effects (portrait generation trigger)

**Rationale:** Append-only events eliminate sync bugs, make refunds first-class, provide full audit trail. Event volume is tiny (< 100/user lifetime) — derive on read, no materialized views needed in Phase A.

**Constraints:**
- Polar is merchant-of-record — we never touch card data (PCI). EU VAT handled entirely by Polar.
- HMAC webhook verification + `polar_checkout_id` UNIQUE constraint for idempotent processing
- `polar_` prefix on provider-specific fields for future multi-provider support
- Event immutability — INSERT-only, corrections via compensating events (refunds)
- Bundle = single event (`extended_conversation_unlocked`) — split if partial revocation needed Phase B

#### ADR 4: Invitation Flow — Accept/Refuse UX

**Decision:** Invitee completes assessment normally, then sees notification pin + RelationshipCard with accept/refuse. One credit = one link, consumed at creation.

**Flow:**
1. Inviter creates link (1 credit consumed) → `relationship_invitations` row created with UUID v4 token
2. Invitee clicks link → anonymous-first Nerin conversation → completes → signs up
3. Invitee sees notification pin on header avatar + RelationshipCard on results page: "[User A] is waiting for your response"
4. Accept → relationship analysis generated → both see "Ready" state
5. Refuse → inviter sees "declined" state. Credit not refunded (link was the value)
6. Existing-user invitee → always reuse existing assessment (Phase A). Notification on next visit

**Token:** UUID v4, 30-day expiry, single-use per assessment link. Rotated on anonymous → auth transition.

#### ADR 5: Cross-User Data Access

**Decision:** Analysis receives both users' facet data + finalization evidence. Two-step consent.

**Repository interface:**
```typescript
RelationshipAnalysisRepository.analyze({
  inviterFacets, inviteeFacets,
  inviterTraits, inviteeTraits,
  inviterEvidence, inviteeEvidence  // finalization evidence: quotes, facets, scores, domains, rawDomains
})
```

**Consent chain:**
- Inviter consents at link creation ("Generate a relationship analysis invitation?")
- Invitee consents via Accept button on results page
- Fulfilled invitation (accepted) = authorization to read both users' data

#### ADR 6: Waitlist/Circuit Breaker

**Decision:** Extend `CostGuardRepository` with global daily assessment count. Atomic Redis gate. Simple waitlist email table.

**Rationale:**
- Reuses existing Redis infrastructure
- Atomic check-and-increment prevents race conditions on budget boundary
- `waitlist_emails` table: `{ email, created_at, notified_at }`
- Existing sessions continue when circuit trips — only new starts blocked

## Technology Stack Evaluation

### New External Dependencies

| Dependency | Purpose | Layer | Rationale |
|-----------|---------|-------|-----------|
| `@polar-sh/checkout` | Embedded PWYW checkout overlay | Frontend | Merchant-of-record for EU VAT/invoicing. Hosted fallback if embed fails |
| `satori` + `@resvg/resvg-js` | Server-side archetype card generation (JSX → SVG → PNG) | Backend (API route) | No DOM dependency, deterministic output, enables OG meta images |
| `qrcode.react` | QR code in InvitationBottomSheet | Frontend | Lightweight, React-native component |

### New Repository Interfaces (Hexagonal Adapters)

#### PaymentGatewayRepository

```typescript
interface PaymentGatewayRepository {
  verifyWebhook(headers, body): Effect<PurchaseEvent, WebhookVerificationError>
  getCheckoutUrl(product, options): Effect<string, PaymentGatewayError>
}
```

- Production implementation: `PaymentGatewayPolarRepositoryLive`
- Abstracts Polar-specific logic behind domain interface
- Future provider swap requires only new implementation, no use-case changes
- Webhook handler calls `verifyWebhook()` → delegates to `process-purchase.use-case.ts`

#### CardGeneratorRepository

```typescript
interface CardGeneratorRepository {
  generateArchetypeCard(data): Effect<Buffer, CardGenerationError>
}
```

- Production implementation: `CardGeneratorSatoriRepositoryLive` (JSX → SVG → PNG via Satori + resvg)
- Test implementation returns 1x1 PNG stub
- API route serves cards with `Cache-Control: immutable` + content-hashed URLs

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
1. Portrait generation pipeline — sync teaser, polled full, retry + manual fallback
2. Relationship analysis trigger — direct forkDaemon, use-case assembles cross-user data
3. Frontend state coordination — hybrid SSR + granular polling, optimistic post-payment

**Already Decided (Steps 1-3 + Existing Codebase):**
- Database: Drizzle + PostgreSQL | Auth: Better Auth | API: Effect/Platform HTTP contracts
- Frontend: TanStack Start + React 19 | Infrastructure: Railway + Docker
- Payment: Polar.sh via PaymentGatewayRepository | Event log: `purchase_events` append-only
- Card generation: Satori via CardGeneratorRepository | DI: Effect-ts Context.Tag

**Deferred Decisions (Post-MVP / Phase B):**
- SSE for real-time portrait/analysis status (replace polling)
- Background job queue for generation retry (replace lazy polling)
- Event-driven architecture for cross-domain side effects
- Gift product event types and flows
- Partial revocation for bundle products (split extended_conversation event)

### Portrait Generation Pipeline

- **Teaser (Haiku):** Sync inline during assessment finalization (~2-3s). Results page loads with teaser ready.
- **Full (Sonnet):** Async via `Effect.forkDaemon` triggered by `process-purchase.use-case.ts`.

**Placeholder row pattern:**
1. Insert `portraits` row with `content: null`, `tier: 'full'` before forking — gives polling a row to detect
2. Daemon updates on completion (`content = '...'`) or marks `failed`
3. `UNIQUE(assessment_result_id, tier)` prevents duplicate placeholders

**Portraits schema (updated):**
```
portraits:
  id                    UUID PK
  assessment_result_id  UUID FK → assessment_results
  tier                  TEXT ('teaser' | 'full')
  content               TEXT (nullable — NULL = generating placeholder)
  locked_section_titles JSONB (nullable — only for teaser)
  model_used            TEXT NOT NULL
  retry_count           INTEGER DEFAULT 0
  created_at            TIMESTAMP

  UNIQUE(assessment_result_id, tier)
```

**Polling:** TanStack Query `refetchInterval` only while `portraitStatus === 'generating'`. Stops on `ready` or `failed`.

**Error recovery:**
- Auto-retry (max 3, exponential backoff) managed by daemon via `retry_count`
- Lazy retry: polling endpoint checks staleness — if `generating` for > 5 min AND `retry_count < 3`, triggers retry
- Manual "Retry" button only shown after 3 auto-retries exhausted
- UX: "Taking longer than expected, we're still working on it..." during auto-retries

**Double-payment prevention:**
- Frontend disables "Reveal" button after click
- Backend checks existing `portrait_unlocked` / `extended_conversation_unlocked` event before opening checkout

### Relationship Analysis Data Flow

**Trigger:** `accept-invitation.use-case.ts`:
1. Verify invitation token + status = `pending`
2. Read inviter facets + evidence from DB
3. Read invitee facets + evidence from DB
4. UPDATE `invitation.status = 'accepted'`
5. INSERT placeholder `relationship_analyses` row (`content: null`)
6. `Effect.forkDaemon(RelationshipAnalysisRepository.analyze({ all data }))`
7. Return `{ accepted }` — analysis generating in background

**Daemon completion:** `UPDATE relationship_analyses SET content = '...', model_used = '...' WHERE invitation_id = X AND content IS NULL` — idempotent via NULL check.

**Portrait generation trigger:** `process-purchase.use-case.ts`:
1. Verify webhook (HMAC)
2. INSERT `purchase_events` row
3. INSERT placeholder `portraits` row
4. `Effect.forkDaemon(PortraitRepository.generateFull(...))`

**Pattern consistency:** Both follow forkDaemon + placeholder row + UPDATE on completion.

### Frontend State Coordination

**Initial load:** Single SSR endpoint (`/api/results-page`) returns all state dimensions. Server-rendered results page is immediately interactive.

**Dynamic updates — separate TanStack Query hooks:**
- `usePortraitStatus()` — `refetchInterval` while `generating`, stops on `ready` or `failed`
- `useRelationshipCards()` — refetch on accept/refuse mutation, `refetchInterval` while analysis generating
- `usePurchaseState()` — invalidated after Polar checkout overlay closes

**Optimistic post-payment flow:**
1. Polar `onSuccess(checkoutId)` fires → frontend shows **"Payment confirmed! Generating your full portrait..."**
2. Silent call to `/api/verify-purchase?checkoutId=X` (backend sync, not user-facing)
3. Polling starts via `usePortraitStatus()` — picks up placeholder row
4. If webhook hasn't arrived after 5 min with no portrait row, show support message
5. Payment confirmation and generation status are separate UX concerns

### Failure Mode Mitigations

| # | Failure Mode | Mitigation |
|---|-------------|------------|
| FM2 | Optimistic desync (webhook delay) | Polar `onSuccess` = payment confirmation. `/api/verify-purchase` is silent backend sync. 5-min timeout for missing portrait row |
| FM3 | forkDaemon silent failure | Placeholder row before fork, daemon updates status, `retry_count` for auto-retry, 5-min staleness check via lazy polling |
| FM4 | Double payment | Frontend disables button + backend dedup check on existing events |
| FM5 | Accept/refuse race | PostgreSQL status column — `accepted` blocks refuse |
| FM6 | Polling storm | Conditional polling only during `generating` state |

### Testing Strategy for Async Flows

- forkDaemon repositories use **synchronous mock implementations** in test layers — fork completes within test tick
- `TestClock.adjust()` for timeout/staleness testing
- Placeholder row pattern is testable via standard Drizzle assertions (INSERT → check NULL → UPDATE → check content)

### Cross-Component Dependencies

```
Assessment complete → sync teaser generation → redirect to results (teaser ready)
Polar checkout closes → "Payment confirmed!" → silent verify → placeholder row → forkDaemon → polling → "ready"
Invitee accepts → placeholder row → forkDaemon → polling → both users see analysis
```

## Implementation Patterns & Consistency Rules

### Existing Conventions (Preserved)

All established conventions from `CLAUDE.md`, `NAMING-CONVENTIONS.md`, and `docs/ARCHITECTURE.md` remain in effect. This section defines **new patterns specific to innovation features**.

### Pattern 1: Placeholder Row Pattern

All `Effect.forkDaemon` calls that produce a persisted result MUST follow this pattern:

```typescript
// ALWAYS: Insert placeholder → forkDaemon → daemon UPDATEs
// NEVER: forkDaemon → daemon INSERTs

yield* repo.insertPlaceholder({ id, ... })  // content: null
yield* Effect.forkDaemon(repo.generate({ id, ... }))
// Daemon: UPDATE ... SET content = '...' WHERE id = X AND content IS NULL
```

Applies to: `portraits` (full generation), `relationship_analyses` (analysis generation).

### Pattern 2: Capability Derivation from Events

Derive capabilities from `purchase_events` — never store computed state or mutable counters.

### Pattern 3: Webhook Handler → Use-Case Delegation

Webhook handler is thin (verify + delegate). Business logic lives in `process-purchase.use-case.ts`.

### Pattern 4: Status Derivation from Data

Derive `portraitStatus` from `portraits` table rows (`none | generating | teaser | ready | failed`). No status columns.

### Pattern 5: Optimistic Payment UX

Polar `onSuccess` = "Payment confirmed!" (immediate). Polling = generation status (backend truth). Never show "Processing payment..." after overlay closes.

### Pattern 6: Transaction Boundaries

Related writes in single `db.transaction()`: `credit_consumed` + `relationship_invitations`, `purchase_event` + placeholder `portraits` row.

### Pattern 7: Lazy Retry via Polling

Polling endpoint checks staleness: `generating > 5min AND retry_count < 3` → trigger retry. `retry_count >= 3` → return `failed`. No cron/job queue in Phase A.

### Pattern 8: Provider-Prefixed Fields

All Polar-specific fields use `polar_` prefix (e.g., `polar_checkout_id`, `polar_product_id`).

### Gap Patterns (from Gap Analysis)

#### G1: LLM Prompt Location

ALL LLM prompts live in `packages/domain/src/prompts/`. Typed functions that receive data and return strings. This includes existing prompts (Nerin, ConversAnalyzer, FinAnalyzer, scorer) and new ones (teaser portrait, full portrait, relationship analysis).

```typescript
// packages/domain/src/prompts/teaser-portrait.prompt.ts
export const buildTeaserPortraitPrompt = (facets: FacetScores, evidence: Evidence[]): string => ...
```

#### G2: Invitation Token Flow

1. `/invite/:token` route validates token via API
2. Stores `inviteToken` in httpOnly cookie (same pattern as anonymous session)
3. Redirects to `/chat` — Nerin conversation starts normally
4. On assessment completion + signup, backend reads `inviteToken` cookie to link invitee
5. Cookie cleared after linking

#### G3: Notification Pin Data

Root layout `beforeLoad` fetches `pendingInvitationCount` — available to header component on **all pages**. Lightweight query: `SELECT COUNT(*) FROM relationship_invitations WHERE invitee_id = ? AND status = 'pending'`.

#### G4: Polar Product Configuration

Vite public env vars accessed via `import.meta.env`:

```
VITE_POLAR_PRODUCT_PORTRAIT_UNLOCK=pol_xxx
VITE_POLAR_PRODUCT_RELATIONSHIP_SINGLE=pol_xxx
VITE_POLAR_PRODUCT_RELATIONSHIP_5PACK=pol_xxx
VITE_POLAR_PRODUCT_EXTENDED_CONVERSATION=pol_xxx
```

No config endpoint needed. Product ID changes require redeploy.

#### G5: RelationshipCard Discriminated Union

Single component with discriminated union prop:

```typescript
type RelationshipCardState =
  | { _tag: 'invite-prompt'; availableCredits: number }
  | { _tag: 'pending-sent'; inviteeName: string }
  | { _tag: 'pending-received'; inviterName: string; invitationId: string }
  | { _tag: 'generating' }
  | { _tag: 'ready'; analysis: RelationshipAnalysis }
  | { _tag: 'declined'; inviteeName: string }
  | { _tag: 'no-credits' }
```

#### G6: Payment Error Messages

All user-facing payment error messages defined as constants in `packages/domain/src/constants/payment-messages.ts`. Backend errors mapped to user-friendly messages in frontend, not in API responses.

### Decision Trees (Agent Branching Logic)

#### Tree 1: Results Page State Resolution

```
GET /api/results-page?assessmentId=X

1. Has assessment_result?
   ├─ NO → 404
   └─ YES
       2. Query portraits table
          ├─ No rows → portraitStatus = 'none'
          ├─ Teaser (content NOT NULL), no full → portraitStatus = 'teaser'
          ├─ Teaser + full (content NULL) → portraitStatus = 'generating'
          ├─ Teaser + full (content NULL, retry_count >= 3) → portraitStatus = 'failed'
          ├─ Teaser + full (content NOT NULL) → portraitStatus = 'ready'
          └─ Full only (no teaser) → portraitStatus = 'ready'
       3. Query invitations WHERE invitee_id = userId AND status = 'pending'
          ├─ Has pending → 'pending-received' (PRIORITY: invitee check FIRST)
          └─ No pending
              4. Query invitations WHERE inviter_id = userId
                 ├─ pending sent → 'pending-sent'
                 ├─ accepted, analysis NULL → 'generating'
                 ├─ accepted, analysis NOT NULL → 'ready'
                 ├─ refused → 'declined'
                 └─ None → check credits → 'invite-prompt' or 'no-credits'
```

#### Tree 2: Polar Checkout Trigger

```
User clicks "Reveal" / "Buy Credits"

1. Button disabled? → no-op
2. Check existing unlock events (portrait only)
   ├─ Already unlocked → skip checkout, trigger generation
   └─ Not unlocked → open Polar overlay
       ├─ onSuccess → "Payment confirmed!", silent verify, start polling
       ├─ onClose → re-enable button
       └─ onError → re-enable button, toast error
```

#### Tree 3: Invitation Creation

```
User clicks "Invite"

1. credits <= 0 → show "Get credits" CTA
2. credits > 0 → consent dialog
   ├─ cancel → no-op
   └─ confirm → POST /api/create-invitation
       Transaction: recheck credits → INSERT invitation → INSERT credit_consumed event
       Return: { token, shareUrl }
```

#### Tree 4: Invitation Link Click

```
/invite/:token

1. Validate token → not found/expired/claimed → error page
2. Valid token
   ├─ Authenticated + has assessment → reuse, link invitee, redirect /results
   ├─ Authenticated + no assessment → set cookie, redirect /chat
   └─ Anonymous → set cookie, redirect /chat → complete → signup → link → /results
```

#### Tree 5: Accept/Refuse

```
ACCEPT: verify pending + ownership → read both users' data → status='accepted'
        → INSERT placeholder analysis → forkDaemon → return { accepted }

REFUSE: verify pending + ownership → status='refused' → return { refused }
```

### Anti-Patterns

| Do | Don't |
|----|-------|
| Insert placeholder then forkDaemon | forkDaemon that INSERTs directly |
| Derive credits from events | `UPDATE users SET credits = credits - 1` |
| Thin webhook handler → use-case | Business logic in handler |
| `polar_checkout_id` | `checkout_id` |
| Conditional polling while `generating` | Unconditional polling on all states |
| Prompts in `domain/src/prompts/` | Hardcoded prompt strings in repositories |
| Discriminated union for card states | Multiple separate card components |
| Recheck credits inside transaction | Trust frontend credit check alone |

### Enforcement

All AI agents implementing innovation features MUST:
1. Follow existing conventions from `CLAUDE.md` and `NAMING-CONVENTIONS.md`
2. Use placeholder row pattern for any forkDaemon with persisted result
3. Derive status/capabilities from data — no mutable state columns
4. Keep webhook handlers thin, delegate to use-cases
5. Use `polar_` prefix for Polar-specific fields
6. Wrap related writes in single `db.transaction()`
7. Follow decision trees exactly for branching logic
8. Place all LLM prompts in `packages/domain/src/prompts/`

## Project Structure & Boundaries

### New Files & Directories (Innovation Features)

All new code follows existing monorepo conventions. New tables added to existing `schema.ts` (no per-file split).

#### Domain Layer (`packages/domain/src/`)

```
prompts/                                    # NEW — all LLM prompts (existing + new)
├── nerin-agent.prompt.ts                   # MOVE from current location
├── convers-analyzer.prompt.ts              # MOVE from current location
├── fin-analyzer.prompt.ts                  # MOVE from current location
├── scorer.prompt.ts                        # MOVE from current location
├── teaser-portrait.prompt.ts               # NEW
├── full-portrait.prompt.ts                 # NEW
└── relationship-analysis.prompt.ts         # NEW
repositories/
├── portrait.repository.ts                  # NEW — Context.Tag interface
├── relationship-invitation.repository.ts   # NEW
├── relationship-analysis.repository.ts     # NEW
├── purchase-event.repository.ts            # NEW
├── payment-gateway.repository.ts           # NEW
├── card-generator.repository.ts            # NEW
└── waitlist.repository.ts                  # NEW
constants/
└── payment-messages.ts                     # NEW
types/
├── portrait.types.ts                       # NEW — PortraitTier, PortraitStatus
├── relationship.types.ts                   # NEW — RelationshipCardState, InvitationStatus
└── purchase.types.ts                       # NEW — PurchaseEventType, ProductType
```

#### Infrastructure Layer (`packages/infrastructure/src/`)

```
db/drizzle/schema.ts                        # MODIFY — add 5 new tables:
  # portraits, relationship_invitations, relationship_analyses,
  # purchase_events, waitlist_emails
repositories/
├── portrait.drizzle.repository.ts          # NEW — Haiku teaser + Sonnet full
├── relationship-invitation.drizzle.repository.ts  # NEW
├── relationship-analysis.drizzle.repository.ts    # NEW — Sonnet/Opus LLM call
├── purchase-event.drizzle.repository.ts    # NEW
├── payment-gateway.polar.repository.ts     # NEW — Polar adapter
├── card-generator.satori.repository.ts     # NEW — Satori JSX→SVG→PNG
├── waitlist.drizzle.repository.ts          # NEW
└── __mocks__/
    ├── portrait.drizzle.repository.ts      # NEW
    ├── relationship-invitation.drizzle.repository.ts  # NEW
    ├── relationship-analysis.drizzle.repository.ts    # NEW
    ├── purchase-event.drizzle.repository.ts # NEW
    ├── payment-gateway.polar.repository.ts  # NEW
    ├── card-generator.satori.repository.ts  # NEW
    └── waitlist.drizzle.repository.ts       # NEW
```

#### Contracts Layer (`packages/contracts/src/http/groups/`)

```
portrait.ts                                 # NEW — portrait status, retry endpoints
relationship.ts                             # NEW — create invitation, accept, refuse, status
purchase.ts                                 # NEW — verify purchase, polar webhook
card.ts                                     # NEW — archetype card generation endpoint
waitlist.ts                                 # NEW — waitlist signup
```

#### API Layer (`apps/api/src/`)

```
handlers/
├── portrait.ts                             # NEW
├── relationship.ts                         # NEW
├── purchase.ts                             # NEW
├── card.ts                                 # NEW
└── waitlist.ts                             # NEW
use-cases/
├── generate-portrait.use-case.ts           # NEW — generateTeaser() + generateFull()
├── retry-portrait.use-case.ts              # NEW
├── process-purchase.use-case.ts            # NEW — webhook → event → side effects
├── verify-purchase.use-case.ts             # NEW
├── create-invitation.use-case.ts           # NEW — credit check → transaction
├── accept-invitation.use-case.ts           # NEW — data assembly → forkDaemon
├── refuse-invitation.use-case.ts           # NEW
├── get-results-page.use-case.ts            # NEW — SSR state resolution (Tree 1)
├── generate-archetype-card.use-case.ts     # NEW
└── join-waitlist.use-case.ts               # NEW
__tests__/
├── generate-portrait.test.ts               # NEW
├── process-purchase.test.ts                # NEW
├── verify-purchase.test.ts                 # NEW
├── create-invitation.test.ts               # NEW
├── accept-invitation.test.ts               # NEW
├── refuse-invitation.test.ts               # NEW
├── get-results-page.test.ts                # NEW — covers all Tree 1 branches
└── generate-archetype-card.test.ts         # NEW
```

#### Frontend Layer (`apps/front/app/`)

```
routes/
├── invite.$token.tsx                       # NEW — invitation link entry point
├── results.tsx                             # MODIFY — portrait + relationship state
└── chat.tsx                                # MODIFY — invitation token cookie handling
components/
├── portrait/
│   ├── teaser-portrait.tsx                 # NEW
│   ├── full-portrait.tsx                   # NEW
│   └── portrait-reveal-button.tsx          # NEW — Polar checkout trigger
├── relationship/
│   ├── relationship-card.tsx               # NEW — discriminated union (7 states)
│   ├── invitation-bottom-sheet.tsx         # NEW — QR + share + message
│   └── notification-pin.tsx               # NEW — header avatar badge
├── sharing/
│   └── archetype-share-card.tsx            # NEW
└── waitlist/
    └── waitlist-form.tsx                   # NEW
hooks/
├── use-portrait-status.ts                  # NEW — polling hook
├── use-relationship-cards.ts               # NEW — polling hook
└── use-purchase-state.ts                   # NEW — invalidation hook
```

### Architectural Boundaries

**API Boundaries:**

| Group | Endpoints | Auth |
|-------|-----------|------|
| Portrait | `GET /portrait-status/:assessmentId`, `POST /portrait-retry/:assessmentId` | Authenticated, owner only |
| Relationship | `POST /create-invitation`, `POST /accept-invitation`, `POST /refuse-invitation`, `GET /relationship-status/:invitationId`, `GET /validate-invitation/:token` | Mixed (validate is public) |
| Purchase | `POST /polar-webhook` (public, HMAC), `GET /verify-purchase` (authenticated) | Mixed |
| Card | `GET /archetype-card/:assessmentId` | Public, cached (`Cache-Control: immutable`) |
| Waitlist | `POST /waitlist` | Public |
| Results | `GET /results-page/:assessmentId` | Authenticated, owner only |

**Data Boundaries:**

| Table | FK | Write Access | Read Access |
|-------|----|-------------|-------------|
| `portraits` | → `assessment_results` | Use-case (teaser) + daemon (full) | Owner only |
| `relationship_invitations` | → `users` (inviter, invitee) | Use-cases | Both participants |
| `relationship_analyses` | → `relationship_invitations` | Daemon only (UPDATE) | Both participants |
| `purchase_events` | → `users` | Webhook use-case + invitation use-case | Owner only |
| `waitlist_emails` | none | Public endpoint | Admin only |

**External Integration Points:**

| Service | Integration | Direction |
|---------|------------|-----------|
| Polar.sh | `@polar-sh/checkout` (frontend) + webhook (backend) | Bidirectional |
| Anthropic | Haiku (teaser), Sonnet (full portrait), Sonnet/Opus (relationship) | Backend → Anthropic |
| Satori/resvg | Card generation (backend internal) | Internal |

### Feature → Structure Mapping

| Feature | Domain | Infrastructure | Contract | Handler | Use-Case | Frontend |
|---------|--------|---------------|----------|---------|----------|----------|
| Portrait | portrait.repository | portrait.drizzle | portrait | portrait | generate-portrait | teaser/full-portrait, reveal-button |
| Invitation | relationship-invitation.repository | relationship-invitation.drizzle | relationship | relationship | create/accept/refuse-invitation | relationship-card, invitation-bottom-sheet |
| Relationship Analysis | relationship-analysis.repository | relationship-analysis.drizzle | relationship | relationship | accept-invitation (triggers) | relationship-card |
| Payment | purchase-event + payment-gateway repos | purchase-event.drizzle + payment-gateway.polar | purchase | purchase | process-purchase, verify-purchase | reveal-button |
| Card Sharing | card-generator.repository | card-generator.satori | card | card | generate-archetype-card | archetype-share-card |
| Waitlist | waitlist.repository | waitlist.drizzle | waitlist | waitlist | join-waitlist | waitlist-form |

### Integration Testing

New integration tests in `apps/api/tests/integration/` for critical paths:
- Webhook → `purchase_events` → portrait generation flow (end-to-end payment path)
- Invitation creation → acceptance → relationship analysis generation
- Results page state resolution across all Tree 1 branches

## Requirements Coverage

| Requirement | Covered By |
|-------------|-----------|
| PWYW portrait unlock | Polar checkout → webhook → purchase_events → portrait generation |
| Relationship credits (1 free + purchased) | purchase_events event log, derived credit formula |
| Extended conversation (+25 msgs + full portrait) | `extended_conversation_unlocked` event |
| Invitation system (link → assess → accept/refuse) | Decision Trees 3-5, token cookie flow |
| Multiple analyses per pair | `UNIQUE(invitation_id)`, not per-pair |
| Teaser portrait at completion | Sync Haiku in finalize-assessment |
| Full portrait after payment | Async Sonnet, placeholder row, polling |
| Archetype card sharing | Satori via CardGeneratorRepository |
| InvitationBottomSheet | qrcode.react, navigator.share |
| Waitlist/circuit breaker | CostGuardRepository extension |
| Notification pin | Root layout beforeLoad count query |
| Accept/refuse UX | RelationshipCard discriminated union (7 states) |
| Gift products (Phase B) | Deferred — no event types needed in Phase A |

### Preparatory Note

Prompt migration to `packages/domain/src/prompts/` (moving existing Nerin/ConversAnalyzer/FinAnalyzer/scorer prompts) should be a separate preparatory story before innovation features begin, to avoid merge conflicts with in-progress work.

