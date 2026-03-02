---
status: ready-for-dev
story_id: "18-3"
epic: 3
created_date: 2026-03-02
completed_date: null
depends_on: ["18-1", "18-2"]
blocks: ["18-4"]
---

# Story 18-3: Rolling Evidence Budget and Cap Enforcement

## Story

As a **system managing evidence extraction cost**,
I want **per-message and session-level evidence caps enforced**,
So that **evidence volume is bounded without losing high-value signals**.

## Acceptance Criteria

### Per-Message Cap (Pattern 6)

**Given** ConversAnalyzer returns evidence for a message
**When** more than 5 records are returned
**Then** only the top 5 by `finalWeight` are kept (per-message cap)

### Session Cap

**Given** a session with 80+ existing evidence records
**When** a new message is processed in `send-message.use-case.ts`
**Then** ConversAnalyzer is skipped entirely — steering computed from existing evidence

### Code Location

**Given** cap enforcement logic
**When** located in the codebase
**Then** it lives in `send-message.use-case.ts` only — not in the repository layer (Pattern 6)
**And** constants `PER_MESSAGE_EVIDENCE_CAP = 5` and `SESSION_EVIDENCE_CAP = 80` are defined in the use-case

### Mock Update

**Given** the conversation_evidence mock in `__mocks__/conversation-evidence.drizzle.repository.ts`
**When** updated
**Then** it stores v2 fields

## Tasks

### Task 1: Add constants and per-message cap with finalWeight sorting

- Define `PER_MESSAGE_EVIDENCE_CAP = 5` and `SESSION_EVIDENCE_CAP = 80` in `send-message.use-case.ts`
- Replace naive `slice(0, 5)` with finalWeight-based sorting: sort evidence by `computeFinalWeight(strength, confidence)` descending, then take top 5
- Import `computeFinalWeight` from `@workspace/domain`

### Task 2: Add session-level evidence cap enforcement

- After querying existing evidence via `evidenceRepo.findBySession()`, check if `existingEvidence.length >= SESSION_EVIDENCE_CAP`
- If at cap, skip ConversAnalyzer call entirely — use existing evidence for steering
- Log a structured info message when session cap is hit

### Task 3: Write tests for cap enforcement

- Test: per-message cap sorts by finalWeight and keeps top 5
- Test: session evidence cap (80+) skips ConversAnalyzer entirely
- Test: session at exactly 80 records skips ConversAnalyzer (boundary)
- Test: session at 79 records still calls ConversAnalyzer

### Task 4: Verify mock stores v2 fields

- Confirm `__mocks__/conversation-evidence.drizzle.repository.ts` stores v2 fields (deviation, strength, confidence, note) — already done in Story 18-1
