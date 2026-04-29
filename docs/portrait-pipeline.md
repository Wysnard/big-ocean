# Portrait Pipeline Module

Authoritative ADR references: `_bmad-output/planning-artifacts/architecture.md` — ADR-7 (async queue), ADR-13 (reconciliation contract), ADR-46 (focused reading / polling), ADR-47 (MVP billing), ADR-51–55 (three-stage portrait + UserSummary).

## Active triggers (queue → worker)

| Trigger | Source | When |
|--------|--------|------|
| Initial free portrait | `generate-results.use-case.ts` | Assessment Finalization completes a **base** session (`parentConversationId` absent). |
| Bundled first-extension portrait | `generate-results.use-case.ts` | Assessment Finalization completes the **first** subscriber extension session (`shouldQueueBundledPortrait`). |
| Manual retry | `retry-portrait.use-case.ts` | User retries after failure; deletes failed row and `Queue.offer`. |

All active jobs go through `PortraitJobQueue` → `portrait-generation.worker.ts` → `generateFullPortrait`.

## Legacy (no longer triggers generation)

| Source | Notes |
|--------|------|
| `portrait_unlocked` Polar webhook / `process-purchase` | Purchase events may still be **recorded** for historical capability derivation; they do **not** enqueue portrait work. |
| `Effect.forkDaemon(generateFullPortrait)` | Removed; worker is the only execution path. |

## Module responsibilities

1. **Assessment Finalization** completes scoring, UserSummary, public profile row, session completion; then enqueues portrait work when product rules require a new portrait.
2. **Worker** runs `generateFullPortrait` with mandatory `userId`, authenticated session scope, UserSummary required before LLM; persists portrait success or failure rows.
3. **Status (read path)** derives `generating` from `assessment_results.stage === "completed"` and absence of a terminal portrait row, not from purchase events.

## ADR-51 three-stage module (live)

Production uses **Spine Extractor → Spine Verifier → Prose Renderer** (separate `Context.Tag` Adapters, direct `@anthropic-ai/sdk` per ADR-53). There is no single-shot portrait generator or feature flag.

1. **Stage A (Spine Extractor)** input: persisted `UserSummary` + facet/trait score maps only — no raw messages or evidence objects in the LLM call.
2. **Stage B (Spine Verifier)** input: `SpineBrief` JSON only.
3. **Stage C (Prose Renderer)** input: `SpineBrief` + `NERIN_PERSONA` + `PORTRAIT_CONTEXT` — no `UserSummary`, messages, or evidence.

On success, `portraits` rows persist `spine_brief`, `spine_verification`, and `portrait_pipeline_models` (JSON) alongside `content` and `model_used` (prose model id). On failure, a row with `failed_at` is inserted (artifacts null).

Orchestration: `apps/api/src/use-cases/generate-full-portrait.use-case.ts` (worker: `portrait-generation.worker.ts`).

## Test matrix (regression targets)

| Case | Expect |
|------|--------|
| Base assessment finalization | Exactly one `PortraitJob` enqueued with `sessionId` + `userId`. |
| First extension completion | One bundled portrait job enqueued. |
| Subsequent extension completion | No portrait job. |
| `generateFullPortrait` | Fails closed if `userId` missing or UserSummary missing for result. |
| `getPortraitStatus` | `generating` when result `completed` and no portrait row; not tied to `portrait_unlocked`. |
| Purchase / webhook | No queue offer for portrait from purchase handlers. |
| `retryPortrait` | Failed row deleted, job re-queued. |
| ADR-51 Stage A/C seams | Stage A prompt has UserSummary + scores, not raw transcript arrays; Stage C prompt has no UserSummary block (`portrait-pipeline.matrix.test.ts`). |
| Persisted artifacts | Success inserts include `spine_brief`, `spine_verification`, pipeline model audit JSON. |
