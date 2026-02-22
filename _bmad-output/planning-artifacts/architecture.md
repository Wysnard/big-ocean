---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
lastStep: 8
status: 'complete'
completedAt: '2026-02-22'
inputDocuments:
  - '_bmad-output/design-thinking-2026-02-20.md'
  - 'new-formula.md'
  - '_bmad-output/planning-artifacts/prd.md'
  - '_bmad-output/planning-artifacts/confidence-algo.md'
  - '_bmad-output/planning-artifacts/research/domain-big-five-model-research-2026-02-19.md'
  - 'docs/ARCHITECTURE.md'
  - '_bmad-output/planning-artifacts/architecture/index.md'
workflowType: 'architecture'
project_name: 'big-ocean'
user_name: 'Vincentlay'
date: '2026-02-22'
elicitationMethods:
  - 'ADR: Three-Field Evidence Tagging → refined to Two-Field (domain + rawDomain)'
  - 'ADR: Multi-Evidence, Other in Formulas, Domain Boundaries'
  - 'Pre-mortem Analysis: Evidence Tagging System in Production'
  - 'Graph of Thoughts: System Interconnection Map'
  - 'First Principles: Assumption Validation + Haiku Fallback + Finalization Roadmap'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements (Architectural Scope):**

This architecture addresses a redesign of the assessment pipeline's analysis, scoring, steering, and evidence structure. It breaks six reinforcing feedback loops identified in the design thinking session (Depth Spiral, Reframing Echo, Rhetorical Dead End, flat evidence, 1D steering, portrait overload).

#### 1. Two-Tier Analysis Architecture

Replace the Sonnet-based 3-message cadence (BATCH/STEER/COAST with async daemon) with purpose-separated tiers:

- **Conversation-time analyzer (Haiku):** Runs synchronously on every message. Extracts basic facet signals + domain tags for steering. Disposable — exists only to guide the conversation. Fast enough (<1s) to run before Nerin responds.
- **Finalization analyzer (Sonnet/Opus):** Runs once at assessment end. Re-analyzes ALL messages with the complete conversation as context. Produces portrait-quality evidence — the single source of truth. Early conversation-time tags may be corrected (e.g., `domain: work` at msg 4 becomes `domain: solo` when msg 14 reveals the pattern is universal).

**Architectural simplification:** The BATCH/STEER/COAST cadence, `forkDaemon`, offset steering, graph state caching, and potentially LangGraph itself are eliminated. Every message follows the same flow: `Haiku analyze → steering update → Nerin respond`.

#### 2. Context Tagging System

The core architectural addition that enables cross-context deduction — the product's primary "wow" mechanism.

**Problem solved:** The Depth Spiral — user mentions work → Nerin drills into work → more work evidence → facet-only steering steers back to work → 80% of evidence from one context. Identity-level insights require the same pattern appearing across 3+ life contexts.

**Two fields on evidence — hard taxonomy + soft label:**

**a) `domain` — Hard taxonomy (5 steerable + 1 fallback, enum)**

Constrained set used for formula computation (context weights, entropy, signal power), steering, and evidence grouping. Enumerable and countable — the system can reliably say "we have zero evidence from Family."

| Domain | Description | Steerable? |
|---|---|---|
| `work` | Career, professional life, colleagues, work habits | Yes |
| `relationships` | Friends, social life, romantic partners, social dynamics | Yes |
| `family` | Parents, siblings, children, close bonds, upbringing | Yes |
| `leisure` | Play, hobbies, recreation, fun | Yes |
| `solo` | Alone time, personal routines, self-reflection, inner world | Yes |
| `other` | Fallback — evidence that doesn't fit the 5 domains | No — never targeted by steering |

**b) `rawDomain` — Soft taxonomy (free-text, LLM-inferred)**

The LLM's natural label for the life context — preserves nuance the hard domain compresses. Examples: "job interview prep", "friendship breakup", "childhood memory", "weekend hiking."

Used for:
- Portrait input (richer context labels when grouping evidence)
- Debugging/analytics (understanding what the hard domain compressed)

Not used in formulas or steering — purely descriptive.

**c) Multi-domain evidence generation**

When a message spans domains, the analyzer generates separate evidence records with the same quote but different domain + rawDomain. Each record feeds independently into its domain's formula weights.

Example: "I handle work stress by organizing everything alone" →
- `{ bigfive_facet: "orderliness", score: 18, confidence: 0.85, quote: "organizing everything alone", domain: "work", rawDomain: "deadline coping" }`
- `{ bigfive_facet: "self_discipline", score: 17, confidence: 0.80, quote: "organizing everything alone", domain: "solo", rawDomain: "personal coping ritual" }`

**Two separate evidence tables — different purpose, different lifecycle, different schema:**

**`conversation_evidence` (conversanalyzer output — steering only, disposable):**

```
conversation_evidence:
  id                    UUID PK
  assessment_session_id UUID FK → assessment_sessions  // denormalized for hot path query
  assessment_message_id UUID FK → assessment_messages
  bigfive_facet         pgEnum(bigfive_facet_name)   // 30 facets, model-specific
  score                 SMALLINT (0-20)
  confidence            NUMERIC(4,3) CHECK (confidence >= 0 AND confidence <= 1)
  domain                pgEnum(evidence_domain)
  created_at            TIMESTAMP
  // Cap: 3 records per message
```

**`finalization_evidence` (finanalyzer output — authoritative, portrait + results page):**

```
finalization_evidence:
  id                    UUID PK
  assessment_message_id UUID FK → assessment_messages (original source message)
  assessment_result_id  UUID FK → assessment_results
  bigfive_facet         pgEnum(bigfive_facet_name)   // 30 facets, model-specific
  score                 SMALLINT (0-20)
  confidence            NUMERIC(4,3) CHECK (confidence >= 0 AND confidence <= 1)
  domain                pgEnum(evidence_domain)
  raw_domain            TEXT NOT NULL                  // always populated
  quote                 TEXT NOT NULL                   // LLM outputs verbatim quote only
  highlight_start       INTEGER NULLABLE               // server-side computed via indexOf(quote)
  highlight_end         INTEGER NULLABLE               // nullable: graceful degradation if quote not found
  created_at            TIMESTAMP
  // No cap — authoritative source, extracts ALL evidence. Quality is non-negotiable.
```

**What this eliminates:** No `source` enum, no `archived` boolean, no nullable columns. Each table has exactly what it needs.

**Entity Relationships:**
```
assessment_sessions (1) ──→ (N) assessment_messages
assessment_sessions (1) ──→ (N) assessment_results
assessment_sessions (1) ──→ (N) conversation_evidence  (denormalized FK)
assessment_messages (1) ──→ (N) conversation_evidence
assessment_messages (1) ──→ (N) finalization_evidence
assessment_results  (1) ──→ (N) finalization_evidence
assessment_results  (1) ←── (0-1) public_profiles
```

**Column naming convention:** `bigfive_facet` (not `facet`) — explicitly scoped to Big Five model. If a new psychometric model is adopted, a new column + enum is added (e.g., `hexaco_facet`). No migration conflict.

**Evidence confidence scale:** Internal representation 0-1, frontend displays as percentage.

#### 3. New Scoring Formulas

Replace the current redundancy-adjusted confidence with a context-aware system. All formulas operate on the `domain` field (hard taxonomy).

**Facet Score** — Context-level weighted means with sqrt anti-redundancy:

```
Step 1: μ_g = sum(c_i * x_i) / sum(c_i)           (weighted mean per domain)
Step 2: w_g = sqrt(sum(c_i))                        (anti-redundancy weight)
Step 3: S_f = sum(w_g * μ_g) / sum(w_g)            (final facet score, 0-20)
```

**Facet Confidence** — Exponential saturation:

```
W = sum_g(w_g)                                      (total diversified evidence mass)
C_f = C_max * (1 - e^{-k * W})                     (0-1, monotonic, saturating)
```

Parameters: `C_max = 0.9`, `k = 0.5-0.7` (calibrate after testing)

**Signal Power (NEW)** — Cross-context robustness:

```
Step 1: p_g = w_g / sum_h(w_h)                     (context distribution)
Step 2: D = -sum(p_g * ln(p_g)) / ln(|G|)          (normalized entropy, 0-1)
Step 3: V = 1 - e^{-β * W}                         (volume saturation)
Final:  P_f = V * D                                 (signal power, 0-1)
```

Parameters: `β ≈ k`

**`other` domain in formulas:** Full participation in `w_g`, entropy `D`, and signal power `P_f`. It is real evidence mass. Excluded from steering target selection only.

#### 4. Formula-Driven Steering (No Domain-to-Facet Mapping)

**Two-step steering: facet selection → domain selection via signal power gain maximization.**

**Step 1 — Facet Priority (unchanged):**

```
FacetPriority_f = α * (C_target - C_f)+ + β * (P_target - P_f)+

Parameters: C_target = 0.75, P_target = 0.5, α = 1.0, β = 0.8
Select: f* = argmax_f FacetPriority_f
```

**Step 2 — Domain Selection via Expected Signal Power Gain:**

For target facet `f*`, for each steerable domain `g`:

```
Step A — Estimated mass delta:
  Δw_g ≈ sqrt(w_{f,g}² + c̄) - w_{f,g}
  Where c̄ = 0.5 (fixed Phase 1, refine after testing)

Step B — Projected total mass:
  W' = W_f + Δw_g

Step C — Projected volume saturation:
  V' = 1 - e^{-β * W'}

Step D — Projected diversity:
  Recompute p_h' with updated w_{f,g} + Δw_g, then:
  D' = -sum(p_h' * ln(p_h')) / ln(|G|)

Expected gain:
  ΔP(f,g) = V' * D' - V_f * D_f
```

**Step 3 — Switch cost penalty:**

```
Score(f,g) = ΔP(f,g) - λ * SwitchCost(g)

Where:
  SwitchCost(g) = 0 if g == previousDomain, else 1
  λ = 0.1 (default, configurable, range 0.05-0.15)

Domain* = argmax_g Score(f,g)
```

**Behavior:**
- Same domain → no penalty → stays 1-2 turns naturally
- Different domain → needs `ΔP > λ` to justify switch → prevents "interview" feeling
- Empty domain → `ΔP` typically 0.2-0.4 → easily overcomes λ=0.1 → gets explored
- Slightly underrepresented domain → `ΔP` might be 0.08 → doesn't overcome λ=0.1 → stays put

**Key advantage:** Eliminates the domain-to-facet mapping constant entirely. The formula computes which domain would help which facet — no hand-crafted heuristics. Self-adapting to each user's actual evidence distribution.

**Steering output:** Natural language hint with conversational bridge:
```
"Bridge from [something user said] to [target domain] — explore [target facet]"
```

The bridge must reference something the user already said. Nerin connects threads, never introduces topics out of nowhere.

#### 5. Context-Grouped Portrait Input

At finalization, evidence is grouped by `domain` with `rawDomain` providing richer labels:

```
WORK:
- orderliness (19, 0.95) [project management]: "three backup plans for every backup plan"
- self_discipline (18, 0.88) [deadline pressure]: "can't stand winging it"

RELATIONSHIPS:
- altruism (13, 0.86) [close friendships]: "first to show up with food"

SOLO:
- anxiety (11, 0.73) [evening overthinking]: "feels chaotic and stressful"

(Queried from `finalization_evidence WHERE assessment_result_id = ?`)
```

The portrait LLM sees cross-domain patterns directly — its job shifts from "analyze flat list AND write story" to "see patterns organized by context AND tell the story."

### Technical Constraints & Dependencies

**Existing Infrastructure:**
- Hexagonal architecture with Effect-ts Context.Tag DI — well established
- Evidence stored in DB (Drizzle ORM) — currently `facet_evidence`, will be replaced by `conversation_evidence` + `finalization_evidence`
- Scores computed on-demand from evidence (no `facet_scores` table — removed in Story 2-9)
- LangGraph orchestrator with PostgresSaver checkpointer handles routing
- Story 7.18 (in-progress) depends on current orchestrator interface (farewell detection, `isFinalTurn`)
- Analyzer repository interface: `packages/domain/src/repositories/analyzer.repository.ts`
- Orchestrator graph: `packages/infrastructure/src/repositories/orchestrator.langgraph.repository.ts`

**Migration Strategy — Clean Slate:**

All assessment-related tables dropped and recreated. No data migration.

**DROP (everything assessment-related):**
- `facet_evidence`
- `assessment_message`
- `assessment_session`
- `public_profile`
- LangGraph `checkpoint_*` tables (3 tables)

**CREATE (new schema):**
- `assessment_session` — add `finalization_progress TEXT`, add `UNIQUE(user_id) WHERE user_id IS NOT NULL`
- `assessment_message` — add `target_domain pgEnum(evidence_domain)`, `target_bigfive_facet pgEnum(bigfive_facet_name)`
- `conversation_evidence` — new table (lean, steering)
- `finalization_evidence` — new table (rich, portrait)
- `assessment_results` — new table (immutable snapshots)
- `public_profile` — recreated with `session_id` FK (kept) + `assessment_result_id` FK (added)

**NEW pgEnums:**
- `evidence_domain` — 6 values from `LIFE_DOMAINS`
- `bigfive_facet_name` — 30 values from `ALL_FACETS`

**Session status lifecycle:** `active → paused → active → finalizing → completed`
- `active`: conversation in progress
- `paused`: budget limit reached ($75/day), resume next day
- `finalizing`: `generateResults` running
- `completed`: results saved

**Rationale:** Dev-only data, no production users. Clean slate avoids complex ALTER chains and ensures schema consistency from day one.

### Cross-Cutting Concerns Identified

1. **Schema evolution** — Clean slate migration: drop all assessment tables, recreate with two evidence tables, `assessment_results`, pgEnums, `public_profile` with dual FK (session + result). See Migration Strategy above for full table list.
2. **Formula configuration** — Hyperparameters (k, C_max, α, β, C_target, P_target, λ, c̄, η, ε) as domain constants
3. **Two analyzer implementations** — Conversanalyzer (lean output → `conversation_evidence`) and finanalyzer (rich output → `finalization_evidence`). Different schemas, likely different repository interfaces.
4. **Evidence lifecycle** — Two tables with clean separation. Conversation evidence deleted or kept for analytics at finalization. Finalization evidence linked to `assessment_results` via FK.
5. **Backward compatibility** — Existing assessments without domain tags; finalization re-analysis handles this naturally
6. **Coordination with Story 7.18** — Farewell/transition flow depends on orchestrator; analyzer changes should be compatible with `isFinalTurn` mechanism
7. **Test infrastructure** — Mock conversanalyzer + finanalyzer. Formula needs **property-based tests** (zero evidence, single domain, entropy edge cases where D=0). Highlight computation needs unit tests (unicode, emoji, newlines, multi-match). Advisory lock needs integration test for concurrent serialization. Finalization idempotency needs all three guard paths tested.
8. **Frontend impact** — Results page reads `assessment_results` table only (no computation). Evidence quotes link back to original messages with highlight positions. Signal power is a new metric (display TBD); confidence display changes to percentage; domain coverage visualization (TBD)
9. **LangGraph removal decision** — If removed, what replaces session state persistence? Simple DB-backed state may suffice.
10. **Finalization bottleneck** — Two serial LLM calls during wait screen (re-analysis + portrait). Expect 15-20s total.

---

## Architecture Decisions (from Advanced Elicitation)

### ADR: Evidence Tagging Schema

**Decision:** Two fields — `domain` (hard enum, 5+1) and `rawDomain` (free-text). No theme field.

**Rationale:**
- Hard taxonomy enables reliable formula computation (entropy requires known `|G|`)
- Soft rawDomain preserves narrative richness for portrait without computational overhead
- Theme was removed — portrait can detect psychological themes from evidence material without pre-tagging; reduces Haiku cognitive load

### ADR: Multi-Evidence from Same Quote

**Decision:** Allowed. Same confidence per record. Soft cap of 2 domains per quote. Hard cap of 3 evidence records per message.

**Rationale:**
- Semantically correct — a statement genuinely reveals behavior in multiple contexts
- Anti-redundancy in formula (`sqrt`) handles accumulation naturally
- No confidence splitting — analyzer is equally confident about both observations
- Caps prevent inflation: 2 domains/quote (soft), 3 records/message (hard)

### ADR: `other` Domain Behavior

**Decision:** Full participation in all formulas (weights, entropy, signal power). Excluded from steering target selection.

**Rationale:**
- `other` is real evidence mass — should increase confidence and signal power
- Never a steering target — "explore the other domain" is meaningless
- Analyzer prompted to prefer specific domains; `other` is a last resort, not default
- Target: <15% of evidence tagged as `other`

### ADR: Domain Classification by User Emphasis

**Decision:** Analyzer picks domain based on what the user emphasizes, not objective situation categorization.

**Key boundary cases:**
- "Work stress" → `work` (stressor context > stress response)
- "Playing video games alone" → `leisure` if emphasis on activity, `solo` if emphasis on aloneness
- "Childhood memories" → `family`
- "Abstract life philosophy" → `other`

### ADR: Formula-Driven Context Selection (Replaces Domain-to-Facet Mapping)

**Decision:** Domain selection via expected signal power gain maximization with switch cost penalty. No hand-crafted domain-to-facet mapping table.

**Rationale:**
- Mathematically principled — picks domain that maximizes ΔP(f,g)
- Self-adapting to each user's actual evidence distribution
- Eliminates maintenance of heuristic mapping table
- Switch cost (λ=0.1) prevents interview-like domain hopping
- Every facet can be steered toward any domain — no unmapped facets

**Note:** Full context selection algorithm (FacetPriority → ContextPriority → signal power gain ΔP) is specified in `new-formula.md` and implemented in the formula domain module. Architecture documents the hyperparameters and steering policy contract, not the full derivation.

---

## Pre-mortem Findings

### Prevention Priority Matrix

| Failure | Likelihood | Impact | Prevention |
|---|---|---|---|
| Haiku domain drift ("everything is work") | **High** | Medium | **P1** — Include domain distribution summary in Haiku prompt context |
| Multi-evidence over-generation | **High** | High | **P1** — Hard cap 3 records/message, recalibrate `k` based on actual rates |
| `other` dumping ground (>25%) | **Medium** | Medium | **P2** — Prompt anchoring, <15% target, finalization recovery |
| Solo vs leisure confusion | **Medium** | Medium | **P2** — Sharpen prompt distinction, monitor agreement rate, fallback merge plan |
| Finalization disagrees with Haiku tags | **Medium** | Low | **P3** — Expected by design, monitor Haiku-Sonnet agreement rate |
| User only discusses 2 domains | **Low** | Low | **P3** — Correct formula behavior, adapt portrait prompt for narrow context |

---

## System Architecture (Graph of Thoughts)

### Message Processing Flow

```
User message arrives
  → Query conversation_evidence WHERE assessment_session_id = ? (ONE read, no JOIN)
  → Pass domain summary to conversanalyzer
  → Conversanalyzer writes to conversation_evidence (max 3 records, lean schema)
  → Pass aggregates + new evidence to formula engine
    → computeFacetMetrics(evidence[]) → { S_f, C_f, P_f, w_g }
    → computeSteeringTarget(metrics, previousDomain, config) → { targetFacet, targetDomain }
  → Nerin receives hint (derived from targetDomain + targetFacet definitions) + responds
  → Save AI message with target_domain (pgEnum) + target_bigfive_facet (pgEnum)
```

### Cold Start Resolution

No cold start gap — the pre-generated greeting message is saved with `target_domain` + `target_bigfive_facet`:
- Greeting (msg 1) → **randomly selected from rotating pool of 3-5 curated `(domain, facet)` pairs** in formula config
- Example pool: `(leisure, imagination)`, `(relationships, gregariousness)`, `(work, achievement_striving)`, `(solo, self_consciousness)`, `(family, altruism)`
- First user reply (msg 2) → `previousDomain` = greeting's `target_domain`
- Formula-driven steering active from the very first user message
- All facets start with zero evidence → formula degenerates to equal priority → curated seed avoids arbitrary tie-breaking
- Rotating pool prevents monotony across users. Formula self-corrects any opening bias within a few messages.

### Indexing Strategy

**Conversation evidence (hot path)** — every message triggers read for formula computation:
```sql
CREATE INDEX ON conversation_evidence (assessment_session_id)
```
- Denormalized `session_id` enables direct query: `WHERE assessment_session_id = ?`
- No JOIN through assessment_messages needed — simple single-table scan

**Finalization evidence (results page):**
```sql
CREATE INDEX ON finalization_evidence (assessment_result_id)
```
- Results page reads by result ID — direct FK lookup

### Finalization Atomicity & Idempotency

**Three-tier idempotency guards** (cost-safe on retry):
```
generateResults use-case:
  Guard 1: SELECT FROM assessment_results WHERE session_id = ? AND status = 'completed'
    → If exists: return existing result (no LLM call)
  Guard 2: SELECT FROM finalization_evidence WHERE session_id = ?
    → If exists: skip finanalyzer LLM, recompute scores from existing evidence
  Guard 3: Full finalization run (LLM calls)
```

**Two-phase execution** (progress visible between steps, not hidden in one big transaction):

```
Phase 1 — Analysis:
  UPDATE assessment_sessions SET status = 'finalizing', finalization_progress = 'analyzing'
  db.transaction():
    Finanalyzer re-analyzes ALL messages → INSERT into finalization_evidence
  UPDATE finalization_progress = 'generating_portrait'

Phase 2 — Portrait & Results:
  db.transaction():
    Compute facet metrics + trait scores from finalization evidence
    Generate portrait narrative
    INSERT assessment_results row with scores + portrait
  UPDATE assessment_sessions SET status = 'completed', finalization_progress = 'completed'
  (conversation_evidence KEPT — analytics value for agreement rate measurement)
```

Two smaller transactions with progress updates between them. Polling endpoint reads `finalization_progress` which is updated outside transactions (visible immediately). If Phase 1 fails: no evidence inserted, retryable. If Phase 2 fails: evidence exists (idempotency Guard 2 skips LLM on retry).

### Session Status Lifecycle

```
active → finalizing → completed
```
- `active`: conversation in progress
- `finalizing`: wait screen showing, LLMs working. Retryable on failure.
- `completed`: results stored, ready to view

### Results Data Storage

**`assessment_results` table** — separate from `assessment_sessions` to support result history (future: continue conversation → generate new results).

```
assessment_results:
  id                   UUID PK
  assessment_session_id UUID FK → assessment_sessions
  facets               JSONB     // { orderliness: { score, confidence, signalPower }, ... }
  traits               JSONB     // { conscientiousness: { score, confidence, signalPower }, ... }
  domain_coverage      JSONB     // { work: 0.32, relationships: 0.24, ... }
  portrait             TEXT      // Generated narrative — own column, not inside JSONB
  created_at           TIMESTAMP
  // ocean_code: NOT stored — derived from traits via generateOceanCode() when needed
```

**Effect Schema `AssessmentResult`** in `packages/domain/src/schemas/` — validates JSONB on DB read.

**Principle:** Evidence is the raw material. `assessment_results` is the computed snapshot. Results page reads stored data only — zero recomputation. Trait scores derived from facet scores (avg of 6 facets per trait), computed at finalization. API returns both facet and trait levels. Frontend never computes.

**One session per user:** Each user has exactly one assessment session (lifetime). Enforced by **partial unique index on `(user_id) WHERE user_id IS NOT NULL`** in `assessment_sessions` + application-level check. Anonymous sessions have `user_id = null` (no constraint). On auth: assign session to user_id. If conflict (user already has a session): keep the one with more messages. "Continue conversation" generates new results on the same session, not a new one.

**Session re-entry routing:** When a user returns to the app, the frontend checks their session status:
- `status = 'active'` → resume chat (load messages, continue conversation)
- `status = 'finalizing'` → redirect to wait screen (poll `finalization-status`)
- `status = 'completed'` + result exists → redirect to results page
This ensures a user who closed the tab during finalization is routed back to the wait screen, and a user with completed results goes straight to their portrait.

**Immutability & Diversity:** Multiple results per session produce independent finalization evidence sets. Each finanalyzer run generates its own evidence linked to that specific result via FK. The portrait LLM is free to produce different interpretations from similar evidence — this creates diversity between profiles with close personalities. Two results from the same session can have different scores AND different portraits.

### LangGraph Checkpoint Cleanup

Drop all LangGraph checkpoint tables in migration: `checkpoint_blobs`, `checkpoint_writes`, `checkpoint_migrations`. Remove `tablesFilter` exclusion from `drizzle.config.ts`.

### Steering on Messages

`target_domain` (pgEnum) + `target_bigfive_facet` (pgEnum) on `assessment_messages`. No `steering_hint` column — the natural language hint is **derived at runtime** from domain + facet definitions in constants. Nerin's prompt constructs the bridge from `(targetDomain, targetFacet, conversationContext)`. Pure function, no storage needed.

### Public Profile → Assessment Results

`publicProfile` FK references `assessment_results` (not `assessment_sessions`). When a user generates multiple results (future: continue conversation), they can update their public profile to point to a newer result.

### Budget Reservation for Finalization

Finalization is a cost spike (Sonnet/Opus re-analysis + portrait generation). **Fixed reservation at session start** (e.g., $0.30) — deducted from daily budget immediately when the session begins. One session per user (lifetime) eliminates budget bloat from multiple sessions. If the user abandons without generating results, the reservation expires with the daily reset.

### Evidence Lifecycle (Two-Table Architecture)

```
Conversation-time (conversanalyzer → conversation_evidence):
  → Lean schema: bigfive_facet, score, confidence, domain
  → No quotes, no highlights, no rawDomain
  → Used by steering engine only
  → Kept at finalization (not deleted) — analytics value for agreement rate measurement

Finalization (finanalyzer → finalization_evidence):
  → Rich schema: + rawDomain, quote, highlightStart, highlightEnd
  → FK to assessment_results (linked to the specific result)
  → FK to assessment_messages (original source message for deep-linking)
  → Portrait and final scores exclusively use this table
  → Results page deep-links evidence quotes to original messages with highlighting
```

### Interface Boundaries

**Formula Input Type — Minimal intersection of both evidence tables:**

```typescript
// packages/domain/src/types/evidence-input.ts
type EvidenceInput = {
  bigfiveFacet: BigFiveFacetName;  // pgEnum
  score: number;                    // 0-20
  confidence: number;               // 0-1
  domain: EvidenceDomain;           // pgEnum
}
```

Both `conversation_evidence` and `finalization_evidence` map to `EvidenceInput[]`. The formula engine doesn't know or care which table the data came from.

**Domain Aggregation — Compute once, use twice:**

```
Query conversation_evidence WHERE assessment_session_id = ?
  → aggregateDomainDistribution(evidence[]) → { work: 12, relationships: 3, family: 0, ... }
    → Consumer 1: Conversanalyzer prompt context (prevents domain drift)
    → Consumer 2: computeFacetMetrics(evidence[]) → steering
```

Aggregation function lives in `packages/domain/src/utils/` alongside formula functions.

**Nerin Interface — Simplified:**

Nerin receives `(targetDomain, targetFacet)` only. No facetScores array. The natural language hint is derived at runtime from domain + facet definitions in constants. Nerin's prompt template constructs the bridge from steering target + conversation context.

**Analyzer Output Format — Tool Use (Function Calling):**

Both conversanalyzer and finanalyzer use Anthropic SDK tool use for structured extraction. Different input/output contracts:

**Conversanalyzer:**
- Input: current message + last 5 messages (sliding window — enough for domain disambiguation, cheap for Haiku)
- Output: `{ bigfiveFacet, score, confidence, domain }[]` — lean, max 3/message
- `assessment_message_id` set programmatically (always the current message) — not in LLM output
- Error handling: retry once on failure, then skip. Formula runs on stale data. Nerin responds normally. Log failure.

**Finanalyzer:**
- Input: ALL messages with their UUIDs: `[{ id, role, content }, ...]` — single LLM call, ~5K tokens for 30 messages
- Output: `{ messageId, bigfiveFacet, score, confidence, domain, rawDomain, quote }[]` — rich, no cap. **No highlight positions from LLM.**
- `messageId` validated on insert — reject evidence referencing non-existent message IDs (log warning, don't crash)
- **Highlight positions computed server-side:** `message.content.indexOf(quote)` → exact match first, fuzzy match (Levenshtein < 5) as fallback, null if not found or if multiple matches (ambiguous). Stored at insert time. Prompt finanalyzer to extract longer, unique substrings.
- Error handling: session stays `finalizing` (retryable). Wait screen shows retry button after 30s timeout.

### Key Design Principles

1. **Formula computation is a pure domain function** — `computeFacetMetrics(evidence: EvidenceInput[])` lives in `packages/domain/src/utils/`, stateless, testable. Used by both steering (conversation-time) and final scores (finalization).
2. **Steering is a pure domain function** — `computeSteeringTarget(metrics, previousDomain, config)` — separate from formula computation. Composes with it.
3. **Two evidence tables** — `conversation_evidence` (conversanalyzer, kept for analytics, lean) and `finalization_evidence` (finanalyzer, authoritative, rich). No shared table, no lifecycle flags.
4. **Domain distribution computed once per message** — shared between conversanalyzer prompt and formula engine. Single query, single aggregation, two consumers.
5. **Nerin receives steering target only** — `(targetDomain, targetFacet)` + definitions. No formula data. Hint derived at runtime.

### Finalization Critical Path

```
Auth succeeds → Wait screen mounts
  → Sonnet re-analyzes ALL messages (single batch LLM call, ~8-10s)
    → computeFacetMetrics on finalization evidence
      → Portrait LLM generates portrait (~8-10s)
        → INSERT assessment_results (atomic transaction)
          → Results ready → Reveal
```

Two serial LLM calls. Expected total: 15-20s. Story 7.18 wait screen minimum default should be adjusted to 15-20s.

**Wait screen engagement:** Ephemeral only — Nerin chats with user for engagement but **messages are not stored anywhere**. Totally outside the assessment. No schema, no table, no persistence. The assessment picks up from the pre-finalization point if the user continues later.

### Concurrent Message Protection

Request-level serialization per session prevents race conditions AND cost abuse:
- **Backend:** `pg_try_advisory_lock(session_id)` — non-blocking. If lock held, return `409 FinalizationInProgressError` immediately. No connection pool exhaustion.
- **Frontend:** Debounce — disable send button while awaiting response.
- Applied to both `sendMessage` and `generateResults` use-cases.
- Per-user message rate limit: **2 messages/minute** (generous for natural conversation, blocks scripted abuse).

### Security — Anonymous Session Auth

Anonymous sessions (no `user_id`) use a **session token in httpOnly cookie**:
- Token returned at session creation, stored in httpOnly secure cookie
- All subsequent calls validate token: polling, send-message, generate-results
- On **anonymous → authenticated transition**: session token **rotated** (new token, old invalidated). Prevents session fixation.
- Authenticated users: normal Better Auth middleware. Token cookie cleared.

### JSONB Schema Validation

`assessment_results.facets`, `.traits`, `.domainCoverage` are JSONB — schemaless in DB. Validated on read via **Effect Schema `AssessmentResult`** in `packages/domain/src/schemas/`. New fields use `S.optional()` with defaults — no schema versioning column needed. Self-describing schema handles evolution gracefully.

### Finalization Trigger

- **Frontend-only trigger:** `sendMessage` detects `isFinalTurn` via **fixed message count threshold** (`MESSAGE_THRESHOLD`, e.g., 30). Returns `{ response, isFinalTurn: true }` but does **NOT** auto-trigger finalization internally. Frontend receives `isFinalTurn`, navigates to auth gate → wait screen, then calls `POST /generate-results`.
- **Separation of concern:** `sendMessage` can be anonymous. `generateResults` always requires authentication (Better Auth). This eliminates the deadlock risk of calling finalization while holding an advisory lock, and ensures the auth gate works every time.
- **Explicit retries:** `POST /generate-results` also used for retries (wait screen retry button) and future "continue conversation → re-generate" flow.

### API Endpoints

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/assessment/send-message` | POST | Modified — Effect pipeline. Returns `{ response, isFinalTurn }`. Anonymous-capable. Never triggers finalization internally. |
| `/api/assessment/generate-results` | POST | New — Frontend-only finalization trigger. Auth-required (Better Auth). Idempotent (three-tier guards). Retries + re-generation. |
| `/api/assessment/finalization-status/:sessionId` | GET | New — Polling (every 2-3s). Auth-scoped (own session only). |
| `/api/assessment/results/:resultId` | GET | New — Scores + portrait + evidence (with inlined message content). Single endpoint for entire results page. |

**Results response includes everything:** Scores, portrait, evidence with `messageContent` + `messageRole` inlined per record. No separate messages endpoint needed (~26KB total). Evidence sorted to match frontend results page layout.

**Facet result in response:**
```json
{
  "facet": "orderliness",
  "score": 18,
  "confidence": 0.85,
  "signalPower": 0.72,
  "level": "H"
}
```

**Trait result in response:**
```json
{
  "trait": "conscientiousness",
  "score": 15.3,
  "confidence": 0.78,
  "signalPower": 0.65,
  "level": "H"
}
```
Trait `confidence` = mean of its 6 underlying facets' confidence. Trait `signalPower` = mean of its 6 facets' signal power. Trait `score` = mean of 6 facet scores. Trait `level` derived from score thresholds (L/M/H).

**Evidence record in results response:**
```json
{
  "bigfiveFacet": "orderliness",
  "score": 18,
  "confidence": 0.85,
  "domain": "work",
  "rawDomain": "project management",
  "quote": "three backup plans for every backup plan",
  "highlightStart": 42,
  "highlightEnd": 83,
  "messageContent": "I always have three backup plans for every backup plan...",
  "messageRole": "user"
}
```

**Polling response:**
```json
{ "progress": "analyzing" | "generating_portrait" | "completed", "resultId": "uuid-xxx" }
```
`resultId` only when `completed` — frontend navigates immediately.

**Error types — complete inventory:**

HTTP-facing errors (in `domain/src/errors/http.errors.ts`):
- `BudgetPausedError` (503) — daily cost budget exceeded. Includes `resumeAfter` timestamp.
- `FinalizationInProgressError` (409) — session already finalizing. Response includes `{ reason: "in_progress" }` so frontend shows "your portrait is being created" (not retry button).
- `FinalizationFailedError` (500) — retryable. Response includes `{ reason: "failed", retryable: true }` so frontend shows retry button.
- `SessionCompletedError` (409) — `sendMessage` on a completed/finalizing session. Frontend should redirect to results.
- `AuthRequiredError` (401) — `generateResults` without authentication. Frontend redirects to auth gate.
- `SessionNotFoundError` (404) — invalid session ID.
- Removed: `OrchestrationError` (LangGraph removed)

Infrastructure errors (co-located with repository interfaces in `domain/src/repositories/`):
- `ConversanalyzerError` — Haiku call failure. **Non-fatal.** Retry once, then skip (message still gets Nerin response with stale steering). Conversation evidence is a steering optimization, not a data requirement — finanalyzer re-analyzes ALL messages at finalization regardless. Missing one conversation evidence record has zero impact on the final portrait.
- `FinanalyzerError` — Sonnet call failure. Retry once, then fail `generateResults` (user retries from wait screen).
- `PortraitError` — Portrait generation failure. Retry once, then fail `generateResults`.

**Retry policy:** All LLM errors use retry-once-then-skip/fail. No infinite retries. ConversanalyzerError is non-fatal (graceful degradation — Nerin responds with stale steering). Finanalyzer/Portrait errors are fatal for `generateResults` (user retries explicitly).

### Effect Pipeline (LangGraph Replacement)

**The use-case IS the orchestrator.** No separate `OrchestratorRepository`. The `sendMessage` use-case directly composes the pipeline — removes an entire abstraction layer.

New repository interfaces (replacing `OrchestratorRepository` + `OrchestratorGraphRepository`):
```
LLM Repositories (replace OrchestratorRepository + OrchestratorGraphRepository):
  ConversanalyzerRepository    // packages/domain/src/repositories/ (Haiku)
  FinanalyzerRepository        // packages/domain/src/repositories/ (Sonnet)
  PortraitRepository           // packages/domain/src/repositories/ (Sonnet)

Data Repositories (new tables):
  ConversationEvidenceRepository   // packages/domain/src/repositories/
  FinalizationEvidenceRepository   // packages/domain/src/repositories/
  AssessmentResultRepository       // packages/domain/src/repositories/

// Formula + steering = pure domain functions, no repository needed
```

**Interface contracts:**

```typescript
// ConversanalyzerRepository
analyze(params: {
  message: string;
  recentMessages: AssessmentMessage[];      // sliding window: current + last 5
  domainDistribution: Record<LifeDomain, number>;  // count per domain
}): Effect<EvidenceInput[], ConversanalyzerError>
// Output IS EvidenceInput — no mapping needed, direct insert

// FinanalyzerRepository
analyze(params: {
  messages: FinanalyzerMessage[];  // ALL messages with UUIDs
}): Effect<FinanalyzerOutput[], FinanalyzerError>
// FinanalyzerMessage = { id: UUID, role, content } — prompt adds [id] prefix
// FinanalyzerOutput = EvidenceInput + { rawDomain, quote, messageId: UUID }
// LLM receives [uuid] content format, outputs messageId = UUID from prefix
// Highlights computed server-side: originalMessage.content.indexOf(quote)

// PortraitRepository (Sonnet)
generate(params: {
  facets: FacetResult[];
  traits: TraitResult[];
  domainCoverage: Record<LifeDomain, number>;
  evidenceHighlights: FinanalyzerOutput[];
}): Effect<{ portrait: string }, PortraitError>

// Steering output (pure domain function)
computeSteeringTarget(
  evidence: EvidenceInput[],
  previousDomain: LifeDomain | null,
  config: FormulaConfig
): { targetDomain: LifeDomain; targetFacet: BigFiveFacet }
// Internal computation uses FacetMetrics + contextWeights — not exposed
```

Simple sequential `Effect.gen` pipeline — no graph nodes, no conditional routing:

```
sendMessage use-case (anonymous-capable):
  → acquire advisory lock (session_id)
  → save user message
  → query conversation_evidence WHERE assessment_session_id = ?
  → conversanalyzer(message, last5Messages, domainDistribution)
  → save conversation_evidence rows
  → computeFacetMetrics(allConversationEvidence)
  → computeSteeringTarget(metrics, previousDomain, config)
  → nerin(targetDomain, targetFacet, messages)
  → save AI message with target_domain + target_bigfive_facet
  → isFinalTurn = messageCount >= MESSAGE_THRESHOLD
  → release advisory lock
  → return { response, isFinalTurn }

generateResults use-case (auth-required, frontend-only):
  → acquire advisory lock (session_id)
  → three-tier idempotency check
  → map messages to FinanalyzerMessage[] (id, role, content)
  → finanalyzer(messages) → FinanalyzerOutput[]
  → save finalization_evidence rows (map messageId → FK)
  → compute highlight positions: originalContent.indexOf(quote)
  → compute facet scores + confidence from finalization evidence
  → compute trait scores (avg of 6 facets), trait confidence (mean), trait signalPower (mean)
  → derive domain coverage from evidence distribution
  → portrait.generate(facets, traits, domainCoverage, topEvidence) → Sonnet
  → save assessment_results (facets, traits, domainCoverage, portrait as JSONB/TEXT)
  → release advisory lock
  → return resultId
```

Each step feeds the next. Error handling via Effect's typed error channels. `sendMessage` never calls `generateResults` — clean separation of concern. Validates LangGraph removal — this is simpler in every way.

### New Module Map

```
@workspace/domain (NEW files)
├── constants/
│   ├── life-domain.ts          ← LIFE_DOMAINS, LifeDomain, LifeDomainSchema, STEERABLE_DOMAINS
│   ├── validation.ts           ← SCORE_MIN/MAX, CONFIDENCE_MIN/MAX
│   └── finalization.ts         ← FINALIZATION_PROGRESS, FinalizationProgress
├── types/
│   └── evidence.ts             ← EvidenceInput
├── utils/
│   ├── formula.ts              ← all formula functions + FORMULA_DEFAULTS (Object.freeze)
│   └── evidence-mapper.ts      ← conversationToEvidenceInput(), finalizationToEvidenceInput()
└── repositories/
    ├── conversanalyzer.repository.ts       ← ConversanalyzerRepository (Tag)
    ├── finanalyzer.repository.ts           ← FinanalyzerRepository (Tag) + FinanalyzerMessage, FinanalyzerOutput types
    ├── portrait.repository.ts              ← PortraitRepository (Tag)
    ├── conversation-evidence.repository.ts ← ConversationEvidenceRepository (Tag)
    ├── finalization-evidence.repository.ts ← FinalizationEvidenceRepository (Tag)
    └── assessment-result.repository.ts     ← AssessmentResultRepository (Tag)

@workspace/infrastructure (NEW files)
└── repositories/
    ├── conversanalyzer.anthropic.repository.ts     ← + __mocks__/
    ├── finanalyzer.anthropic.repository.ts         ← + __mocks__/
    ├── portrait.anthropic.repository.ts            ← + __mocks__/
    ├── conversation-evidence.drizzle.repository.ts ← + __mocks__/
    ├── finalization-evidence.drizzle.repository.ts ← + __mocks__/
    └── assessment-result.drizzle.repository.ts     ← + __mocks__/
```

**Dependency direction:** All imports flow domain ← infrastructure ← use-cases. No circular dependencies. `FinanalyzerMessage` and `FinanalyzerOutput` co-located with their repository interface in domain.

**pgEnum helper:** `ALL_FACETS` and `LIFE_DOMAINS` are `as const` arrays. Drizzle `pgEnum` requires `[string, ...string[]]`. Use a cast in `schema.ts`: `pgEnum("bigfive_facet_name", ALL_FACETS as [string, ...string[]])`.

**Evidence mappers:** Two typed functions in `evidence-mapper.ts` — `conversationToEvidenceInput(row)` and `finalizationToEvidenceInput(row)`. Same 4-field pick, but typed inputs prevent cross-table mistakes. Mapper accepts structural shape (`{ bigfiveFacet, score, confidence, domain }`) — not Drizzle row types. TypeScript structural typing means Drizzle rows satisfy the input without domain importing infrastructure types.

**Validation constants:** `packages/domain/src/constants/validation.ts` exports `SCORE_MIN = 0`, `SCORE_MAX = 20`, `CONFIDENCE_MIN = 0`, `CONFIDENCE_MAX = 1`. Used by Drizzle CHECK constraints, contract schemas (`S.between()`), and formula bounds assertions.

**Domain barrel exports** (`packages/domain/src/index.ts` — all new exports):
```
// constants
LIFE_DOMAINS, LifeDomain, LifeDomainSchema, STEERABLE_DOMAINS
SCORE_MIN, SCORE_MAX, CONFIDENCE_MIN, CONFIDENCE_MAX
FINALIZATION_PROGRESS, FinalizationProgress

// types
EvidenceInput

// utils
FORMULA_DEFAULTS, computeFacetScore, computeFacetConfidence,
computeSignalPower, computeSteeringTarget, computeContextMean, computeContextWeight
conversationToEvidenceInput, finalizationToEvidenceInput

// repositories (Tags)
ConversanalyzerRepository, FinanalyzerRepository, PortraitRepository
ConversationEvidenceRepository, FinalizationEvidenceRepository, AssessmentResultRepository

// repository types
FinanalyzerMessage, FinanalyzerOutput
```

**Formula test categories** (`packages/domain/src/utils/__tests__/formula.test.ts`):
1. **Bounds** — every output within documented range (score 0-20, confidence 0-C_max, power 0-1)
2. **Monotonicity** — more evidence → higher confidence (never decreases)
3. **Saturation** — confidence approaches C_max asymptotically, never exceeds
4. **Single evidence** — works with 1 evidence item (no division by zero)
5. **Empty evidence** — returns defaults (SCORE_MIDPOINT, 0 confidence, 0 power)
6. **All-same-domain** — signal power low (entropy ≈ 0)
7. **Perfectly balanced domains** — signal power high (entropy ≈ 1)
8. **Switch cost** — same domain penalized less than domain change

### Formula Parameters (All Configurable Domain Constants)

| Parameter | Default | Purpose |
|---|---|---|
| `C_max` | 0.9 | Maximum reachable confidence |
| `k` | 0.5-0.7 | Confidence saturation speed |
| `β` | ≈ k | Volume saturation speed (signal power) |
| `α` | 1.0 | Confidence gap weight in facet priority |
| `β_steer` | 0.8 | Signal power gap weight in facet priority |
| `C_target` | 0.75 | Target confidence for steering |
| `P_target` | 0.5 | Target signal power for steering |
| `λ` | 0.1 | Switch cost penalty (range 0.05-0.15) |
| `c̄` | 0.5 | Expected average confidence of next evidence |
| `η` | 0.3 | Bonus for zero-evidence contexts (in ContextPriority, if used) |
| `ε` | small | Division safety margin |
| `SCORE_MIDPOINT` | 10 | Population average on bipolar scale |
| `SCORE_RANGE` | [0, 20] | 0 = extreme low pole, 20 = extreme high pole |
| `MESSAGE_THRESHOLD` | 30 | Fixed message count for `isFinalTurn` detection (frontend reads this to trigger finalization) |

**Note:** Formula parameters live in `FORMULA_DEFAULTS` (`Object.freeze`) in `packages/domain/src/utils/formula.ts`. Formula functions accept config as parameter — never import globals internally. `MESSAGE_THRESHOLD` lives in `AppConfig` (not formula config) since it's an app-level constant.

### AppConfig New Fields

| Field | Default | Env Var | Purpose |
|---|---|---|---|
| `MESSAGE_THRESHOLD` | 30 | `MESSAGE_THRESHOLD` | Fixed message count for isFinalTurn |
| `CONVERSANALYZER_MODEL` | `"claude-haiku-..."` | `CONVERSANALYZER_MODEL` | Model for real-time evidence extraction |
| `FINANALYZER_MODEL` | `"claude-sonnet-..."` | `FINANALYZER_MODEL` | Model for finalization re-analysis |
| `PORTRAIT_MODEL` | `"claude-sonnet-..."` | `PORTRAIT_MODEL` | Model for portrait generation |

Model names in config allow switching models without code changes. Test environment uses `MOCK_LLM=true` to bypass.

### Cold Start Formula Handling

Messages 1-3 have zero conversation evidence. Formula functions must handle empty input gracefully:

- `computeSteeringTarget([])` → returns greeting seed default `{ targetDomain, targetFacet }` from a rotating pool
- `computeFacetScore([])` → returns `SCORE_MIDPOINT` (10)
- `computeFacetConfidence([])` → returns `0`
- `computeSignalPower([])` → returns `0`

**Guard pattern in sendMessage:** Check `evidence.length === 0` before calling steering. If empty, use greeting seed defaults. This avoids division-by-zero in formula internals.

---

## First Principles Validation

### Assumptions Validated

| Assumption | Verdict | Action |
|---|---|---|
| Haiku <1s synchronous | **Likely true, must validate** | Benchmark before committing; fallback to one-message-stale if Haiku takes >1.5s |
| Finalization >> Haiku quality | **Reasonable Phase 1** | Always re-analyze in Phase 1. Measure Haiku-Sonnet agreement rate. If >85%, switch to selective re-analysis in Phase 2. If >90%, skip re-analysis in Phase 3. |
| 5 steerable domains | **Survives** | Entropy resolution value outweighs classification imperfection. Monitor solo-leisure confusion; merge if >30% disagreement. |
| Binary switch cost | **Survives** | Simple and effective. Tune λ rather than add weighted matrix. |
| Pure domain functions | **Confirmed correct** | Extends existing hexagonal pattern (`computeFacetMetrics` + `computeSteeringTarget` in `packages/domain/src/utils/`). |
| Single-turn previousDomain | **Sufficient** | Formula's diminishing returns naturally prevent oscillation. No multi-turn history needed. |

### Haiku Latency Fallback

If Haiku synchronous execution exceeds 1.5s consistently:
- Run Haiku as fire-and-forget (every message, not every 3rd)
- Steering uses data from the previous message (one-message stale)
- Nerin still gets a hint — just from the previous cycle
- Degrades gracefully while preserving every-message analysis benefit

### Finalization Optimization Roadmap

```
Phase 1: Always re-analyze all messages (Sonnet). Measure Haiku-Sonnet agreement.
Phase 2: If agreement >85%, selective re-analysis (only low-confidence + other-tagged messages)
Phase 3: If agreement >90%, skip re-analysis. Portrait uses Haiku evidence directly.
```

### Pre-mortem: Data Architecture in Production

| Failure | Likelihood | Impact | Prevention | Priority |
|---|---|---|---|---|
| Finalization timeout (45s+) | **High** | High | **No cap on evidence** — quality is non-negotiable. Engage user during wait: chat with Nerin, feedback prompts, progress via SSE. Session survives abandonment (`finalizing` status). | **P1** |
| Highlight mismatch | **Medium** | Medium | Insert-time validation: `message.content.substring(start, end) === quote`. Fallback to quote text search on display. | **P1** |
| Silent domain drift | **Medium** | Low | Already mitigated by formula-driven steering (low D → high ΔP for empty domains). Monitor only. | **P3** |
| Orphan public profile | **Low** | Low | UX notification when new result generated. Not an architecture concern. | **P3** |
| Agreement metric misuse | **Low** | Low | Compare domain agreement (meaningful) not facet agreement (different inputs). Define before Phase 2. | **P3** |

### First Principles Validation: Data Architecture

| Assumption | Verdict | Rationale |
|---|---|---|
| Two LLM calls/msg (conversanalyzer + Nerin) | **Confirmed** | Separation of concerns, independent tuning, $0.012/session cost |
| Formula-driven steering helps | **Confirmed** | Prevents Depth Spiral. Switch cost prevents aggression. |
| SMALLINT 0-20 for scores | **Confirmed** | Aggregation provides sub-integer precision. LLM can't distinguish finer. |
| NUMERIC(4,3) for confidence | **Confirmed** | Exact arithmetic for formulas. 3 decimals is cheap insurance. |
| Keep conversation_evidence | **Confirmed** | Per-message granularity for Phase 2 debugging. 3KB/session storage. |

### Pre-mortem: Data Architecture in Production (Round 2)

| Failure | Likelihood | Impact | Prevention | Priority |
|---|---|---|---|---|
| Anonymous → auth orphan | **High** | High | Partial unique index `WHERE user_id IS NOT NULL` + auth transition flow | **P1** |
| Concurrent message race | **Medium** | Medium | Postgres advisory lock per session + frontend debounce | **P1** |
| Duplicate quote position | **Medium** | Low | Longer quotes + multi-match null fallback | **P2** |
| JSONB drift between versions | **Low** | Medium | Effect Schema with `S.optional()` + defaults | **P2** |
| Greeting seed bias | **Low** | Low | Rotating pool of 3-5 seeds. Formula self-corrects. | **P3** |

### Comparative Analysis Matrix — Data Architecture Validation

Weighted scoring (Query simplicity 25%, Schema clarity 20%, Future flexibility 20%, Data integrity 20%, Migration simplicity 15%):

| Decision (chosen → alternative) | Chosen Score | Alt Score | Delta |
|---|---|---|---|
| Two evidence tables → single table with source+archived | **4.85** | 3.05 | +1.80 |
| `assessment_results` table → JSONB on sessions | **4.65** | 3.45 | +1.20 |
| `bigfive_facet` naming → generic `facet` | **4.50** | 3.65 | +0.85 |
| Fixed budget reservation → dynamic estimation | **4.35** | 3.35 | +1.00 |
| `session_id` denormalized → JOIN through messages | **4.30** | 4.20 | +0.10 |
| pgEnum → text+CHECK | **4.10** | 4.10 | 0.00 |
| Keep conversation evidence → delete | **3.95** | 3.90 | +0.05 |

**Strongest decisions:** Two evidence tables (4.85), separate results table (4.65). **Closest calls:** pgEnum vs text+CHECK (tie, resolved by Big Five model stability). No decision scored below 3.9.

### Future Enhancement: Theme-Based Switch Cost

Deferred to Phase 2. Concept: emergent conversational themes (e.g., "control", "belonging") that group facet + domain based on user responses. Within a theme, switch cost = 0 (natural flow). Between themes, switch cost applies. Would replace binary SwitchCost with a more nuanced model that allows domain transitions when they follow the same psychological thread.

Requires real conversation data to define theme detection logic.

---

## Technology Stack Evaluation (Brownfield)

### Existing Stack Confirmation

This is a **brownfield** project with an established, production-deployed tech stack. No changes to foundational technology choices.

**Preserved as-is:**
- Effect-ts + @effect/platform (backend framework, HTTP contracts, DI)
- React 19 + TanStack ecosystem (frontend)
- Drizzle ORM + PostgreSQL (database)
- Anthropic SDK (LLM access — serves both Haiku and Sonnet/Opus tiers)
- Better Auth (authentication)
- Railway (deployment)
- Docker Compose (development)
- Pino (structured logging)
- ElectricSQL + TanStack DB (frontend sync)

**New dependency:** Claude Haiku model access via existing Anthropic SDK — no new infrastructure required.

### Decision: LangGraph Removal

**Status:** Explicit removal decision — the two-tier architecture eliminates the need for LangGraph.

**What gets removed:**
- LangGraph graph definition and compilation
- PostgresSaver checkpointer (graph state persistence)
- Cadence routing logic (BATCH/STEER/COAST)
- `OrchestratorGraphRepository` (Effect ↔ LangGraph bridge)
- `CheckpointerRepository` interface and implementations
- `forkDaemon` async analysis pipeline

**What replaces it:**
- Sequential Effect pipeline: `Haiku → formulas → steering → Nerin`
- Session state stored directly in existing PostgreSQL tables (no checkpointer)
- `previousDomain` derived from last AI message's `target_domain`
- `isFinalTurn` detection moves from LangGraph router to simple message count check in `sendMessage` use-case (frontend triggers finalization separately)

**Rationale (from design thinking session):**
- LangGraph was needed for complex routing (cadence, async daemon, graph state caching)
- Two-tier model has uniform flow — every message follows the same path
- Effect-ts already provides all needed orchestration primitives (pipe, gen, forkDaemon if needed)
- Removes significant complexity: graph compilation, checkpointer management, state serialization
- Story 7.18 compatibility: `isFinalTurn` is a simple message count check, not a graph node decision

---

## Implementation Patterns & Consistency Rules

> Brownfield context: most patterns already established in `CLAUDE.md`, `NAMING-CONVENTIONS.md`, `ARCHITECTURE.md`, `API-CONTRACT-SPECIFICATION.md`. This section covers **only new patterns** introduced by the two-tier analyzer + formula architecture.

### Naming Patterns

**New repositories** follow existing convention (`{slug}.repository.ts` / `{slug}.{impl}.repository.ts`):

| Component | Interface File | Implementation File | Live Layer Export |
|---|---|---|---|
| Conversanalyzer | `conversanalyzer.repository.ts` | `conversanalyzer.anthropic.repository.ts` | `ConversanalyzerAnthropicRepositoryLive` |
| Finanalyzer | `finanalyzer.repository.ts` | `finanalyzer.anthropic.repository.ts` | `FinanalyzerAnthropicRepositoryLive` |
| Portrait | `portrait.repository.ts` | `portrait.anthropic.repository.ts` | `PortraitAnthropicRepositoryLive` |
| Conversation Evidence | `conversation-evidence.repository.ts` | `conversation-evidence.drizzle.repository.ts` | `ConversationEvidenceDrizzleRepositoryLive` |
| Finalization Evidence | `finalization-evidence.repository.ts` | `finalization-evidence.drizzle.repository.ts` | `FinalizationEvidenceDrizzleRepositoryLive` |
| Assessment Result | `assessment-result.repository.ts` | `assessment-result.drizzle.repository.ts` | `AssessmentResultDrizzleRepositoryLive` |

### Enum Pattern (Single Source of Truth)

All enum-like values follow the same pattern — `as const` array → derive TypeScript type + Effect Schema + pgEnum:

```typescript
// Domain: packages/domain/src/constants/life-domain.ts
export const LIFE_DOMAINS = ["work", "relationships", "family", "leisure", "solo", "other"] as const;
export type LifeDomain = typeof LIFE_DOMAINS[number];
export const LifeDomainSchema = S.Literal(...LIFE_DOMAINS);
export const STEERABLE_DOMAINS = LIFE_DOMAINS.filter(d => d !== "other");

// Infrastructure: schema.ts consumes the const
import { LIFE_DOMAINS } from "@workspace/domain";
export const evidenceDomainEnum = pgEnum("evidence_domain", LIFE_DOMAINS as [string, ...string[]]);
```

Same pattern for `ALL_FACETS` → `bigfive_facet_name` pgEnum, and `FINALIZATION_PROGRESS` → `FinalizationProgress` type.

### Formula Module Pattern

**Single file:** `packages/domain/src/utils/formula.ts` — all formula functions + `FORMULA_DEFAULTS` (`Object.freeze`).

**Config-as-parameter:** Formula functions accept config as argument, never import globals internally. Enables testing with custom parameters.

**`MESSAGE_THRESHOLD` in AppConfig** (not formula config) — app-level constant, not a mathematical parameter.

### Evidence Mapper Pattern

**File:** `packages/domain/src/utils/evidence-mapper.ts`

Two typed functions: `conversationToEvidenceInput(row)` and `finalizationToEvidenceInput(row)`. Accepts structural shape `{ bigfiveFacet, score, confidence, domain }` — not Drizzle row types. TypeScript structural typing means Drizzle rows satisfy the input without domain importing infrastructure.

**Mandatory:** Always map DB rows to `EvidenceInput` before passing to formula functions.

### LLM Tool Schema Pattern

Tool schemas are **infrastructure-internal** — defined in each `.anthropic.repository.ts` file. Not shared in domain.

Both schemas import validation bounds (`SCORE_MIN`, `SCORE_MAX`, `CONFIDENCE_MIN`, `CONFIDENCE_MAX`) from `@workspace/domain` for range definitions. This prevents divergence (e.g., one schema defining score 0-20, another 1-20).

### Error Handling Pattern

- `ConversanalyzerError` → **non-fatal**. Retry once, skip. Conversation evidence is a steering optimization — finanalyzer re-analyzes ALL messages at finalization regardless.
- `FinanalyzerError` / `PortraitError` → **fatal for generateResults**. Retry once, then fail. User retries from wait screen.
- No infinite retries anywhere. All LLM errors use `Effect.retry(Schedule.once)`.

### Mock Pattern

New repository mocks follow existing `__mocks__/` pattern. Key addition: **multiple response profiles** for LLM mocks.

```typescript
// In test files, override specific responses:
vi.mocked(conversanalyzer).analyze.mockResolvedValueOnce(skewedDomainEvidence);
```

Default mock returns balanced evidence. Tests requiring specific distributions override per-test.

### Enforcement Summary

**All agents MUST:**
- Import domain constants from `@workspace/domain` — never hardcode enum values
- Use `EvidenceInput` for formula function signatures — always map via `conversationToEvidenceInput` / `finalizationToEvidenceInput`
- Keep LLM tool schemas in infrastructure — never in domain or contracts
- Follow existing `__mocks__/` pattern for new repository mocks
- Use `as const` + derived type for all new enum-like values
- Document numeric field scales per `API-CONTRACT-SPECIFICATION.md`
- Export all new types/functions through `packages/domain/src/index.ts` barrel

### Anti-Patterns

- Importing from `__mocks__/` directly (use `vi.mock()` + original path)
- Putting formula logic in repositories (formulas are pure domain functions)
- Hardcoding `"work" | "relationships" | ...` instead of using `LifeDomain` type
- Mixing `conversation_evidence` and `finalization_evidence` queries in the same function
- Passing full DB row types to formula functions (use `EvidenceInput` mapping)
- Mutating `FORMULA_DEFAULTS` (it's frozen — create a new config object for overrides)
- Adding a domain/facet value to `as const` array without generating a Drizzle migration

---

## Project Structure & Boundaries

> Brownfield delta — only what changes from the existing codebase.

### Files to REMOVE

**Domain repositories (replaced by new interfaces):**
```
packages/domain/src/repositories/
├── orchestrator.repository.ts
├── orchestrator-graph.repository.ts
├── analyzer.repository.ts
├── facet-evidence.repository.ts
├── portrait-generator.repository.ts
```

**Infrastructure implementations (LangGraph + old pipeline):**
```
packages/infrastructure/src/repositories/
├── orchestrator.langgraph.repository.ts
├── orchestrator-graph.langgraph.repository.ts
├── orchestrator.nodes.ts
├── orchestrator.state.ts
├── facet-steering.ts                        ← check for salvageable steering logic → migrate to formula.ts
├── analyzer.claude.repository.ts
├── analyzer.mock.repository.ts
├── checkpointer.repository.ts
├── checkpointer.memory.repository.ts
├── checkpointer.postgres.repository.ts
├── facet-evidence.drizzle.repository.ts
├── nerin-agent.langgraph.repository.ts
├── nerin-agent.mock.repository.ts
├── portrait-generator.claude.repository.ts
├── portrait-generator.mock.repository.ts
├── __mocks__/orchestrator*.ts
├── __mocks__/orchestrator-graph*.ts
├── __mocks__/nerin-agent.langgraph.repository.ts
├── __mocks__/facet-evidence.drizzle.repository.ts
├── __mocks__/analyzer.claude.repository.ts
├── __mocks__/portrait-generator.claude.repository.ts
```

**Use-cases (no longer needed):**
```
apps/api/src/use-cases/
├── calculate-confidence.use-case.ts
├── save-facet-evidence.use-case.ts
├── update-facet-scores.use-case.ts
├── get-facet-evidence.use-case.ts
├── get-message-evidence.use-case.ts
├── resume-session.use-case.ts              ← one-session-per-user, resumption is implicit
├── list-user-sessions.use-case.ts          ← at most one session per user, trivial
```

**Handlers:**
```
apps/api/src/handlers/
├── evidence.ts                              ← calls removed use-cases, evidence now inlined in results
```

**Domain services (replaced or moved):**
```
packages/domain/src/services/
├── confidence-calculator.service.ts         ← REMOVE (replaced by formula.ts)
├── __tests__/                               ← REMOVE related tests
```

**Domain utils (replaced):**
```
packages/domain/src/utils/
├── confidence.ts                            ← REMOVE (replaced by formula.ts)
├── scoring.ts                               ← REMOVE (replaced by formula.ts)
```

**Domain errors (old evidence errors):**
```
packages/domain/src/errors/
├── evidence.errors.ts                       ← REMOVE (replaced by new error types in http.errors.ts)
```

**Contracts (evidence group + schema):**
```
packages/contracts/src/
├── http/groups/evidence.ts                  ← REMOVE (evidence inlined in results)
├── schemas/evidence.ts                      ← REMOVE (replaced by new result schemas)
```

**Test files (old pipeline):**
```
apps/api/src/use-cases/__tests__/
├── orchestrator-integration.test.ts         ← REMOVE
├── nerin-steering-integration.test.ts       ← REMOVE
├── analyzer-scorer-integration.test.ts      ← REMOVE
├── evidence.use-case.test.ts               ← REMOVE
├── resume-session.use-case.test.ts         ← REMOVE

packages/domain/src/repositories/__tests__/
├── analyzer.repository.test.ts             ← REMOVE

packages/infrastructure/src/repositories/__tests__/
├── orchestrator.langgraph.repository.test.ts ← REMOVE
├── analyzer.claude.repository.test.ts       ← REMOVE
```

**Frontend hooks:**
```
apps/front/src/hooks/
├── use-evidence.ts                          ← REMOVE (evidence inlined in results response)
```

**Scripts:**
```
scripts/
├── eval-portrait.ts                         ← REMOVE or REWRITE (imports old AnalyzerRepository + PortraitGeneratorRepository)
```

### Files to ADD

**Domain — new constants, types, utils, repositories:**
```
packages/domain/src/
├── constants/
│   ├── life-domain.ts                       ← LIFE_DOMAINS, LifeDomain, LifeDomainSchema, STEERABLE_DOMAINS
│   ├── validation.ts                        ← SCORE_MIN/MAX, CONFIDENCE_MIN/MAX
│   └── finalization.ts                      ← FINALIZATION_PROGRESS, FinalizationProgress
├── types/
│   └── evidence.ts                          ← EvidenceInput
├── utils/
│   ├── formula.ts                           ← all formula functions + FORMULA_DEFAULTS (frozen)
│   ├── formula.test.ts                      ← or __tests__/formula.test.ts — property-based tests
│   ├── evidence-mapper.ts                   ← conversationToEvidenceInput, finalizationToEvidenceInput
│   └── cost-calculator.ts                   ← MOVED from services/ (pure function, belongs in utils)
└── repositories/
    ├── conversanalyzer.repository.ts         ← ConversanalyzerRepository (Tag)
    ├── finanalyzer.repository.ts             ← FinanalyzerRepository (Tag) + FinanalyzerMessage/Output
    ├── portrait.repository.ts                ← PortraitRepository (Tag)
    ├── conversation-evidence.repository.ts   ← ConversationEvidenceRepository (Tag)
    ├── finalization-evidence.repository.ts   ← FinalizationEvidenceRepository (Tag)
    └── assessment-result.repository.ts       ← AssessmentResultRepository (Tag)
```

**Infrastructure — new implementations + mocks:**
```
packages/infrastructure/src/repositories/
├── conversanalyzer.anthropic.repository.ts   ← NEW + __mocks__/
├── finanalyzer.anthropic.repository.ts       ← NEW + __mocks__/
├── portrait.anthropic.repository.ts          ← NEW + __mocks__/
├── nerin-agent.anthropic.repository.ts       ← NEW + __mocks__/ (replaces .langgraph)
├── conversation-evidence.drizzle.repository.ts ← NEW + __mocks__/
├── finalization-evidence.drizzle.repository.ts ← NEW + __mocks__/
└── assessment-result.drizzle.repository.ts     ← NEW + __mocks__/
```

**Use-cases + tests:**
```
apps/api/src/use-cases/
├── generate-results.use-case.ts             ← NEW (finalization pipeline)
├── __tests__/generate-results.use-case.test.ts ← NEW (three-tier idempotency tests)
```

### Files to MODIFY

```
packages/domain/src/
├── constants/big-five.ts                    ← ensure ALL_FACETS export works with pgEnum cast
├── config/app-config.ts                     ← add MESSAGE_THRESHOLD, model name fields
├── config/__mocks__/app-config.ts           ← add test defaults for new fields
├── errors/http.errors.ts                    ← add new errors (FinalizationInProgress, SessionCompleted, etc.), remove OrchestrationError
├── repositories/nerin-agent.repository.ts   ← update interface: targetDomain + targetFacet instead of graph state
├── index.ts                                 ← add all new exports (see barrel export list)

packages/infrastructure/src/
├── db/drizzle/schema.ts                     ← MAJOR: drop old tables, new schema, pgEnums, CHECK constraints
├── config/app-config.live.ts                ← add new env var mappings
├── utils/test/app-config.testing.ts         ← add test defaults for new fields

packages/contracts/src/
├── http/groups/assessment.ts                ← MAJOR: new endpoints, FacetResultSchema, TraitResultSchema
├── http/api.ts                              ← remove EvidenceGroup import + .add()
├── schemas/                                 ← add result schemas (FacetResultSchema, TraitResultSchema, EvidenceDetailSchema)

apps/api/src/
├── index.ts                                 ← remove EvidenceGroupLive handler registration
├── handlers/assessment.ts                   ← add generate-results, finalization-status, results handlers
├── use-cases/send-message.use-case.ts       ← REWRITE: Effect pipeline replaces orchestrator call
├── use-cases/__tests__/send-message.use-case.test.ts ← REWRITE: new mocks, new pipeline
├── use-cases/start-assessment.use-case.ts   ← one-session-per-user enforcement
├── use-cases/get-results.use-case.ts        ← reads from assessment_results now
├── use-cases/create-shareable-profile.use-case.ts ← dual FK (session + result)
├── use-cases/toggle-profile-visibility.use-case.ts ← dual FK (session + result)

apps/api/tests/integration/
├── assessment.test.ts                       ← update for new endpoints + MOCK_LLM

apps/front/src/
├── hooks/useTherapistChat.ts                ← handle isFinalTurn response
├── hooks/use-assessment.ts                  ← new result shape
├── routes/results/$assessmentSessionId.tsx  ← reads from new results structure

e2e/specs/
├── golden-path.spec.ts                      ← full flow changes with new endpoints + finalization

drizzle.config.ts                            ← remove checkpoint tablesFilter exclusion

packages/infrastructure/src/
├── index.ts                                 ← remove old Layer exports (Orchestrator, Checkpointer, AnalyzerClaude, NerinLangGraph), add new ones

scripts/
├── seed-completed-assessment.ts             ← update for new schema (assessment_results, new evidence tables)

apps/api/src/use-cases/
├── get-public-profile.use-case.ts           ← CHECK: imports FacetEvidenceRepository, may need update
├── __tests__/get-results.use-case.test.ts   ← swap PortraitGenerator → Portrait mock
├── __tests__/shareable-profile.use-case.test.ts ← update for dual FK
```

**Total impact: ~32 files removed, ~25 files added, ~20 files modified.**

### Directory to REMOVE

```
packages/domain/src/services/               ← delete directory after moving cost-calculator to utils
```

### Integration Boundaries

```
Frontend (apps/front)
  │
  ├─ POST /send-message ─────→ sendMessage use-case (anonymous-capable)
  │   │                          ├── ConversanalyzerRepository (Haiku LLM)
  │   │                          ├── Formula functions (pure domain)
  │   │                          ├── NerinAgentRepository (Claude LLM)
  │   │                          ├── ConversationEvidenceRepository (Drizzle)
  │   │                          └── AssessmentMessageRepository (Drizzle)
  │   └─ returns { response, isFinalTurn }
  │
  ├─ POST /generate-results ──→ generateResults use-case (auth-required)
  │   │                          ├── FinanalyzerRepository (Sonnet LLM)
  │   │                          ├── PortraitRepository (Sonnet LLM)
  │   │                          ├── FinalizationEvidenceRepository (Drizzle)
  │   │                          └── AssessmentResultRepository (Drizzle)
  │   └─ returns resultId
  │
  ├─ GET /finalization-status ─→ reads assessment_sessions.finalization_progress
  │
  └─ GET /results/:resultId ──→ reads assessment_results JOIN finalization_evidence JOIN assessment_messages
```

### Data Flow Summary

```
User message → sendMessage:
  DB read (evidence) → Haiku (conversanalyzer) → DB write (conversation_evidence)
  → Formula (steering) → Claude (Nerin) → DB write (AI message + targets)
  → return { response, isFinalTurn }

Finalization → generateResults:
  DB read (all messages) → Sonnet (finanalyzer) → DB write (finalization_evidence)
  → Formula (scores) → Sonnet (portrait) → DB write (assessment_results)
  → return resultId
```

### Migration Sequence (Implementation Order)

**Critical rule:** Add first, modify consumers, remove last. Schema + code in same commit.

```
Phase 1 — Foundation (no breaking changes):
  1. Add new domain constants (life-domain.ts, validation.ts, finalization.ts)
  2. Add new domain types (evidence.ts)
  3. Add new domain utils (formula.ts, evidence-mapper.ts)
  4. Add new repository interfaces (6 files)
  5. Move cost-calculator.service.ts → utils/cost-calculator.ts, delete services/

Phase 2 — Infrastructure (schema + implementations):
  6. Update Drizzle schema (pgEnums, new tables, alter existing)
  7. Generate + apply migration
  8. Add new repository implementations (7 files + 7 mocks)

Phase 3 — Rewire (swap old → new):
  9. Rewrite send-message.use-case.ts (new pipeline)
  10. Add generate-results.use-case.ts
  11. Update handlers (assessment.ts, remove evidence.ts)
  12. Update contracts (remove evidence group, add new endpoints, new schemas)
  13. Update api.ts composition + server registration (apps/api/src/index.ts)
  14. Update domain barrel exports + error types (add new, keep old until Phase 4)

Phase 4 — Cleanup (remove old):
  15. Remove old repository interfaces (orchestrator, analyzer, facet-evidence, portrait-generator)
  16. Remove old infrastructure files (LangGraph, checkpointer, old mocks)
  17. Remove old use-cases (calculate-confidence, save-facet-evidence, resume-session, etc.)
  18. Remove old utils (confidence.ts, scoring.ts), old errors (evidence.errors.ts)
  19. Remove old barrel exports from domain/index.ts
  20. Update drizzle.config.ts (remove checkpoint filter)

Phase 5 — Frontend + Tests:
  21. Update frontend hooks (useTherapistChat, use-assessment), remove use-evidence
  22. Update frontend routes (results page, session re-entry routing)
  23. Rewrite unit tests (send-message, add generate-results)
  24. Update integration tests (new endpoints + MOCK_LLM)
  25. Update E2E golden path
```

**API group removal checklist** (atomic, never partial):
1. Delete `contracts/src/http/groups/evidence.ts`
2. Remove `.add(EvidenceGroup)` from `contracts/src/http/api.ts`
3. Delete `apps/api/src/handlers/evidence.ts`
4. Remove `EvidenceGroupLive` from `apps/api/src/index.ts`

**Mock audit rule:** Every test file rewrite must verify:
- Each `vi.mock()` path has a matching `__mocks__/` file
- No `vi.mock()` calls reference removed repositories
- Local `TestLayer` uses new Layer names

---

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:** All technology choices work together without conflicts. Effect-ts sequential pipeline cleanly replaces LangGraph. Anthropic SDK serves both Haiku and Sonnet tiers via single dependency. Drizzle pgEnums from `as const` arrays use documented cast. `NUMERIC(4,3)` provides exact arithmetic for formulas. No contradictory decisions.

**Pattern Consistency:** All naming conventions match existing codebase. Enum pattern (`as const` → type → Schema → pgEnum) is consistent across all new enums. Error types follow existing `S.TaggedError` pattern. Mock pattern follows `__mocks__/` convention. Evidence mapper uses structural typing (domain doesn't import infrastructure).

**Structure Alignment:** New domain files extend existing directory structure. Infrastructure follows `*.{impl}.repository.ts` pattern. Use-cases remain the business logic layer. Barrel exports through existing `index.ts`. No structural conflicts with brownfield codebase.

### Requirements Coverage Validation ✅

**Feature Coverage:** All 9 functional requirements have explicit architectural support — two-tier analysis, context tagging, formula steering, cross-context portrait, frontend-only finalization, session re-entry routing, one-session-per-user, cold start handling, LangGraph removal.

**Non-Functional Coverage:** Performance (Haiku <1s + fallback), concurrency (advisory lock + debounce), idempotency (three-tier guards), cost control (budget reservation), security (httpOnly token + rotation), data integrity (CHECK constraints + Effect Schema).

### Implementation Readiness Validation ✅

**Decision Completeness:** All repository interfaces have typed signatures. Formula parameters documented with defaults. Error types inventoried with status codes and retry policies. Migration has 25 ordered steps in 5 phases.

**Structure Completeness:** 32 remove, 25 add, 20 modify — all identified by file path with purpose descriptions. Integration boundaries mapped with data flow diagrams. API group removal checklist specified.

**Pattern Completeness:** 7 implementation patterns documented with code examples. 7 anti-patterns listed. Enforcement summary provides clear agent guardrails.

### Gap Analysis Results

**Critical Gaps:** None.

**Important (non-blocking):**
1. `FacetResult`/`TraitResult` Effect Schemas for JSONB storage — derivable from documented response shapes
2. Updated Nerin repository method signature — inferable from documented interface changes
3. `finalization_progress` column should use pgEnum from `FINALIZATION_PROGRESS` constant for enum consistency

**Nice-to-Have:**
1. Per-user rate limit (2/min) implementation file not mapped
2. Wait screen polling interval not formalized as AppConfig field

### Architecture Completeness Checklist

**✅ Requirements Analysis**
- [x] Project context thoroughly analyzed (design thinking session + formula document)
- [x] Scale and complexity assessed (30 facets, 6 domains, two LLM tiers)
- [x] Technical constraints identified (brownfield, Effect-ts, Drizzle, Anthropic SDK)
- [x] Cross-cutting concerns mapped (10 concerns documented)

**✅ Architectural Decisions**
- [x] Critical decisions documented (6 ADRs)
- [x] Technology stack fully specified (LangGraph removal confirmed)
- [x] Integration patterns defined (Effect pipeline, tool use, evidence mapping)
- [x] Performance considerations addressed (Haiku latency fallback, denormalized indexes)

**✅ Implementation Patterns**
- [x] Naming conventions established (repository files, enum pattern, evidence mappers)
- [x] Structure patterns defined (config-as-parameter, structural typing, tool schema location)
- [x] Communication patterns specified (evidence mapper, formula input type)
- [x] Process patterns documented (error handling, retry policies, mock audit)

**✅ Project Structure**
- [x] Complete file delta defined (32 remove, 25 add, 20 modify)
- [x] Component boundaries established (domain/infrastructure/use-cases/handlers)
- [x] Integration points mapped (4 API endpoints with data flow)
- [x] Migration sequence specified (5 phases, 25 steps)

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION

**Confidence Level:** High — all critical decisions documented, no blocking gaps, comprehensive pattern coverage.

**Key Strengths:**
- Clean two-table evidence architecture eliminates lifecycle complexity
- Formula functions are pure domain — fully testable without infrastructure
- Sequential Effect pipeline is dramatically simpler than LangGraph graph
- Frontend-only finalization trigger eliminates deadlock risk
- 5-phase migration sequence prevents cascading import failures

**Areas for Future Enhancement:**
- Theme-based switch cost (Phase 2 — needs real conversation data)
- Finalization optimization roadmap (selective re-analysis when agreement >85%)
- Haiku-Sonnet agreement rate measurement (analytics, not architecture)
- `other` domain monitoring — merge plan if >30% of evidence

### Implementation Handoff

**AI Agent Guidelines:**
- Follow all architectural decisions exactly as documented
- Use implementation patterns consistently (enum pattern, evidence mapper, config-as-parameter)
- Respect project structure and boundaries (domain never imports infrastructure)
- Refer to this document for all architectural questions
- Follow migration sequence strictly — add first, remove last

**First Implementation Priority:** Phase 1 foundation — domain constants, types, utils, repository interfaces. Zero breaking changes. Then Phase 2 schema migration.
