# Sprint Change Proposal — Synchronous Final Analysis Pass

**Date:** 2026-02-18
**Triggered by:** Architecture review of Story 2.11 (Async Analyzer) + Story 8.4 (Portrait Generation)
**Scope:** Minor (direct implementation)
**Status:** Pending approval

---

## 1. Issue Summary

The 3-message async analysis cadence (BATCH at messages 3, 6, 9...) creates a blind window where the last 0-2 user messages may lack evidence extraction when results are generated. Since `processAnalysis` only fires as `Effect.forkDaemon` on batch messages, there is no guarantee all messages have been analyzed before the results path (score computation, portrait generation) executes.

**Impact:** Incomplete evidence at finalization affects facet score accuracy, trait score completeness, and personalized portrait quality (portrait prompt includes top evidence records).

**Discovery context:** Design review session analyzing the interaction between Story 2.11's async cadence and Story 8.4's portrait generation trigger at the free tier message threshold.

---

## 2. Impact Analysis

### Epic Impact
- **Epic 2 (Assessment Backend):** Done. Change is additive — no existing behavior modified.
- **Epic 8 (Results Content Enrichment):** In-progress. Story 8.4 (portrait generation) is the primary integration point.
- **All other epics:** No impact.

### Story Impact
- **Story 2.11:** Documentation update — add finalization exception to async cadence docs.
- **Story 8.4:** Integration point — synchronous analysis must run before portrait generation to ensure complete evidence.

### Artifact Conflicts
- **CLAUDE.md:** Message cadence section needs finalization note.
- **Epic 2 story file:** Story 2.11 technical details need finalization pattern.
- **PRD / UI / UX:** No conflicts.

### Technical Impact
- Single synchronous call addition in results finalization path.
- No new interfaces, repositories, or infrastructure.
- Uses existing `processAnalysis` which already handles idempotent partial analysis internally.

---

## 3. Recommended Approach

**Direct Adjustment** — Add an unconditional synchronous `processAnalysis` call at the start of results finalization.

### Design Principle

> Always call `processAnalysis` synchronously before generating results. Let it internally short-circuit if all messages already have evidence. No conditional check at the call site.

### Rationale

1. **`processAnalysis` is already idempotent** — it queries the evidence DB, diffs against the full message list, and only analyzes messages without evidence. When there's no work, it's a cheap DB query, not a wasted LLM call.
2. **Results generation is a different latency context** — users expect to wait for profile computation. A synchronous analysis pass (if needed) is acceptable here.
3. **Simplest mental model** — "before generating results, ensure all messages have evidence." One unconditional call, no branching.
4. **Correctness guarantee** — results always reflect 100% of the conversation, regardless of where in the 3-message cadence the session ended.

### Alternatives Considered

| Option | Description | Why Not Selected |
|--------|-------------|-----------------|
| Explicit check before calling | Check `analyzedMessageIndices` or evidence count, only call if gap exists | Unnecessary complexity — `processAnalysis` already handles the diff internally |
| Wait for pending daemon | If a BATCH daemon is still running, wait for completion | Complex — requires tracking daemon completion state, race conditions |
| No change | Accept 0-2 message blind window | Correctness gap in a personality assessment is not acceptable |

---

## 4. Detailed Change Proposals

### Change 1: Results Finalization Path

**Location:** Generate-results use-case (or equivalent finalization path)

**Change:** Add synchronous `processAnalysis` call before score computation and portrait generation.

```typescript
// Ensure all messages have been analyzed before computing final results
yield* orchestrator.processAnalysis({ sessionId, messages, messageCount });

// Now compute scores / generate portrait with complete evidence
```

**Rationale:** Closes the blind window. `processAnalysis` internally diffs evidence DB vs message list and short-circuits if no unanalyzed messages exist.

---

### Change 2: Story 2.11 Documentation Update

**File:** `_bmad-output/planning-artifacts/epics/epic-2-assessment-backend-services.md`
**Section:** Story 2.11 → Technical Details

**ADD** after the `Effect.forkDaemon` implementation pattern:

```
**Finalization Exception — Synchronous Analysis:**

When generating results (scores, portrait), `processAnalysis` is called
synchronously before computing the final profile. This closes the blind
window where the last 0-2 messages may not have been analyzed by the
async batch cadence. The call is unconditional — `processAnalysis`
internally short-circuits if all messages already have evidence
(queries evidence DB, diffs against message list, only analyzes the gap).
```

---

### Change 3: CLAUDE.md Documentation Update

**File:** `CLAUDE.md`
**Section:** Multi-Agent System → Message Cadence

**ADD** after the cadence table:

```
**Finalization:** When generating results, `processAnalysis` runs
synchronously before score computation and portrait generation,
ensuring all messages have evidence regardless of where in the
cadence the session ended. This call is idempotent — it short-
circuits if no unanalyzed messages exist.
```

---

## 5. Implementation Handoff

**Scope Classification:** Minor — direct implementation by dev team.

**Deliverables:**
1. Synchronous `processAnalysis` call in results finalization use-case
2. Documentation updates (CLAUDE.md + Story 2.11)

**No new stories required** — this is a surgical addition to the existing results generation path. Can be integrated when implementing the generate-results use-case or as a patch to existing code.

**Success Criteria:**
- Results always reflect evidence from all user messages in the session
- No regression in normal conversation flow (async cadence unchanged)
- `processAnalysis` short-circuits cleanly when all messages already have evidence
- Documentation updated to reflect the finalization pattern

---

*Generated by Correct Course workflow — 2026-02-18*
