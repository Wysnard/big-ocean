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

## ADR-51 stage split (forward plan)

Current production still uses a single `PortraitGeneratorRepository.generatePortrait` call with depth adaptation. ADR-51 prescribes:

1. UserSummary persisted (already required before portrait LLM).
2. Spine Extractor → Spine Verifier → Prose Renderer (separate Adapters, direct SDK per ADR-53).
3. Prose Renderer input: `SpineBrief` + craft context only — no raw conversation in Stage C.

Implement stage-specific Adapters and orchestration inside the worker use-case after lifecycle triggers are stable.

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
