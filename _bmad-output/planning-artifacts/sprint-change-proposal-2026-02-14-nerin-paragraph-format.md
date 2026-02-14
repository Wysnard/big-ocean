# Sprint Change Proposal
**Date:** 2026-02-14
**Project:** big-ocean
**Sprint:** Epic 2 (Assessment Backend Services)
**Trigger:** User request for Nerin response formatting enhancement
**Change Scope:** Minor (Direct Implementation)

---

## 1. Issue Summary

### Problem Statement
Nerin's empathy patterns (Story 2.10) need explicit structural formatting to ensure consistent, high-quality conversational responses. Currently, the system prompt describes three empathy behaviors (appreciation, positive reframing, contradiction reconciliation) but lacks guidance on message structure.

The requested enhancement formats Nerin's responses into two distinct paragraphs:
1. **Paragraph 1**: Empathetic reaction/rephrasing of the user's message
2. **Paragraph 2**: Natural follow-up question to continue the conversation

### Discovery Context
- **Triggering Story**: Story 2.10 (Nerin Conversational Empathy Patterns) — currently in BACKLOG
- **When Discovered**: During review of Story 2.10 implementation approach (2026-02-14)
- **User Request**: "I would like to format the response to Nerin now with the empathy path Nerin rephrase but ask follow up question. I would like to have a paragraph about the reaction of Nerin the user response and another paragraph about the follow up."

### Supporting Evidence
- **Current System Prompt** (`packages/domain/src/utils/nerin-system-prompt.ts`, lines 27-30): Defines empathy patterns but doesn't enforce response structure
- **Story 2.10 Scope**: "Backend-only — Nerin agent system prompt in LangGraph orchestrator. No API contract, schema, or frontend changes."
- **UX Design Spec**: Emphasizes "coaching tone" and "real understanding" — two-paragraph structure enhances these principles

---

## 2. Impact Analysis

### 2.1 Epic Impact

| Epic | Status | Impact | Action Required |
|------|--------|--------|-----------------|
| **Epic 2: Assessment Backend Services** | in-progress | ✅ **Minor refinement** | Update Story 2.10 implementation details |
| Epic 3: OCEAN Archetype System | done | ❌ None | No action |
| Epic 4: Frontend Assessment UI | in-progress | ❌ None | No action |
| Epic 5: Results & Profile Sharing | done | ❌ None | No action |
| Epic 7: UI Theme & Visual Identity | in-progress | ❌ None | No action |
| Epic 8: Results Page Content Enrichment | backlog | ❌ None | No action |

**Summary**: Epic 2 can be completed as planned. This change refines Story 2.10 implementation before the story file is created.

---

### 2.2 Story Impact

| Story ID | Current Status | Impact | Change Needed |
|----------|----------------|--------|---------------|
| **2-10** | backlog | ✅ **Implementation detail** | Update system prompt before story creation |
| 2-11+ | N/A (future) | ❌ None | No dependencies |

**Summary**: Story 2.10 already defines empathy patterns; this adds structural formatting guidance within the same scope.

---

### 2.3 Artifact Conflicts

#### ✅ PRD (Product Requirements Document)
- **Conflict**: None
- **Alignment**: Enhances conversational quality (PRD Section 3.2: "Nerin Agent")
- **Action**: No changes needed

#### ✅ Architecture Documentation
- **Conflict**: None
- **Current Contract**: `NerinResponseSchema.message: string` (plain text, no structure)
- **Impact**: System prompt modification is implementation detail (not architectural)
- **Action**: No changes needed

#### ✅ API Contracts & Schemas
- **Conflict**: None
- **`NerinResponseSchema`**: `message` field remains `string` type (no breaking change)
- **`NerinInvokeOutput`**: Interface unchanged (`response: string`)
- **Action**: No changes needed

#### ✅ UX Design Specification
- **Conflict**: None
- **Alignment**: Two-paragraph structure enhances "coaching tone" and "real understanding" principles
- **Evidence Highlighting**: Character indices preserved (newlines don't break `highlightRange` accuracy)
- **Action**: No changes needed

#### ✅ Frontend Implementation
- **Conflict**: None
- **Chat UI**: Renders plain text with newlines (native paragraph support)
- **Streaming**: Plain string supports real-time SSE/WebSocket streaming
- **Action**: No changes needed

#### ✅ Testing & Infrastructure
- **Unit Tests**: No changes needed (`NerinResponseSchema` validation unchanged)
- **Integration Tests**: No changes needed (output format still plain text)
- **Token Counting**: Natural language formatting doesn't inflate token costs
- **Action**: No changes needed

---

### 2.4 Technical Impact Summary

| Area | Impact Level | Details |
|------|--------------|---------|
| **Contracts** | ✅ None | `NerinResponseSchema.message` stays as `string` |
| **Schemas** | ✅ None | No schema changes |
| **API Endpoints** | ✅ None | Response structure unchanged |
| **Database** | ✅ None | `assessment_messages.content` stores plain text |
| **Frontend** | ✅ None | Chat UI renders newlines naturally |
| **Streaming** | ✅ None | Plain string supports real-time streaming |
| **Token Counting** | ✅ None | Natural language formatting (no metadata overhead) |
| **Evidence Highlighting** | ✅ None | Character indices stay valid (newlines = 1 char) |
| **Testing** | ✅ None | Output validation unchanged |

**Conclusion**: Zero breaking changes. This is a pure quality enhancement via system prompt refinement.

---

## 3. Recommended Approach

### Selected Path: **Option 1 — Direct Adjustment**

**Rationale**:
- ✅ **Zero risk**: No contracts, schemas, APIs, or databases affected
- ✅ **Minimal effort**: Single-file change (10 minutes)
- ✅ **No dependencies**: Pure function modification
- ✅ **Immediate value**: Enhances conversational quality without infrastructure changes
- ✅ **Backward compatible**: Existing tests, frontend, and streaming all continue working

**Alternatives Considered**:
- ❌ **Option 2 (Rollback)**: Not applicable — Story 2.10 not yet implemented
- ❌ **Option 3 (MVP Review)**: Not needed — this is a quality enhancement, not scope change

**Effort Estimate**: **Low** (10-minute implementation)
**Risk Level**: **Low** (isolated change, no breaking impacts)
**Timeline Impact**: None (change made before Story 2.10 creation)

---

## 4. Detailed Change Proposals

### CHANGE PROPOSAL #1: Update Nerin System Prompt

**File**: `packages/domain/src/utils/nerin-system-prompt.ts`
**Location**: Lines 17-44 (system prompt template)
**Type**: Enhancement (non-breaking)

#### OLD (Current):
```typescript
Empathy patterns (use naturally, never formulaically):
- Appreciation: When someone shares something vulnerable or honest, actively acknowledge it. Vary your phrasing — never repeat the same appreciation twice in one conversation. Examples: "That's really honest of you", "Not everyone has that level of self-awareness", "Thank you for being so open about that."
- Positive reframing: When someone describes themselves negatively, reflect it back with a more generous interpretation that doesn't contradict their experience. "I'm indecisive" → "You weigh options carefully." "I'm a pushover" → "You genuinely care about others' feelings." Never say "you're not [negative thing]" — instead show the positive side of the same trait.
- Contradiction reconciliation: When you notice conflicting signals across the conversation (e.g., organized at work but messy at home), don't ignore them. Find the coherent deeper truth that connects both. "That makes sense — you invest your organizing energy where it matters most to you." Contradictions are often the most revealing insights about someone's personality.
```

#### NEW (Proposed):
```typescript
Empathy patterns (use naturally, never formulaically):
- Appreciation: When someone shares something vulnerable or honest, actively acknowledge it. Vary your phrasing — never repeat the same appreciation twice in one conversation. Examples: "That's really honest of you", "Not everyone has that level of self-awareness", "Thank you for being so open about that."
- Positive reframing: When someone describes themselves negatively, reflect it back with a more generous interpretation that doesn't contradict their experience. "I'm indecisive" → "You weigh options carefully." "I'm a pushover" → "You genuinely care about others' feelings." Never say "you're not [negative thing]" — instead show the positive side of the same trait.
- Contradiction reconciliation: When you notice conflicting signals across the conversation (e.g., organized at work but messy at home), don't ignore them. Find the coherent deeper truth that connects both. "That makes sense — you invest your organizing energy where it matters most to you." Contradictions are often the most revealing insights about someone's personality.

Response structure (follow this format for every message):
- Paragraph 1: Respond to what they shared using one of the empathy patterns above. Acknowledge, reframe, or reconcile — showing you genuinely heard and understood them.
- Paragraph 2: Ask a natural follow-up question to continue the conversation. Make it open-ended and connected to what they just said.

Example:
"That's really insightful — recognizing that you organize differently in different contexts shows real self-awareness. It sounds like you're intentional about where you invest your energy.

What helps you decide when something is worth organizing versus when you let it be?"
```

#### Rationale:
1. **Explicit Structure**: Guides LLM to separate empathetic reaction from follow-up question
2. **Natural Flow**: Uses paragraph break (native plain text), not rigid JSON structure
3. **Concrete Example**: Provides reference implementation for LLM understanding
4. **Preserves Existing Patterns**: All three empathy behaviors remain unchanged
5. **Zero System Impact**: No contracts, schemas, APIs, or tests affected

#### Implementation Checklist:
- [x] Update system prompt in `nerin-system-prompt.ts` (lines 27-44) ✅ **COMPLETED 2026-02-14**
- [ ] Test with sample conversation (verify two-paragraph output) — **Ready for validation**
- [ ] Verify streaming works (real-time paragraph-by-paragraph rendering) — **Ready for validation**
- [ ] Confirm token counting accuracy (no unexpected cost increase) — **Ready for validation**
- [ ] Validate evidence highlighting (character indices still correct) — **Ready for validation**

---

## 5. Implementation Handoff

### Change Scope Classification: **Minor**

**Definition**: Can be implemented directly by development team without backlog reorganization or strategic replanning.

### Handoff Recipients

| Role | Responsibility | Action Required |
|------|----------------|-----------------|
| **Development Team** | Implement system prompt update | Update `nerin-system-prompt.ts` before Story 2.10 creation |
| **Scrum Master / PO** | N/A (no backlog changes) | No action — Story 2.10 stays in backlog |
| **Product Manager / Architect** | N/A (no strategic changes) | No action — within approved scope |

### Success Criteria

✅ **System Prompt Updated**: `buildSystemPrompt()` includes response structure guidance
✅ **Two-Paragraph Output**: Nerin generates responses with distinct reaction + follow-up paragraphs
✅ **No Regressions**: All existing tests pass (schema validation, token counting, streaming)
✅ **Evidence Highlighting Works**: Character indices remain accurate with newlines
✅ **Story 2.10 Ready**: System prompt enhancement completed before story file creation

### Next Steps

1. **Immediate**: Implement Change Proposal #1 (update system prompt)
2. **Validation**: Test with sample conversation to verify two-paragraph structure
3. **Story Creation**: Proceed with Story 2.10 creation workflow (change already incorporated)

---

## 6. Approvals & Sign-Off

**Proposal Status**: ✅ **APPROVED & IMPLEMENTED** (2026-02-14)

**User Approval**: **YES** (approved 2026-02-14)
**Implementation Status**: **COMPLETED** ✅

**Actions Taken**:
- ✅ Implemented Change Proposal #1 (system prompt updated)
- ✅ Story 2.10 system prompt enhancement completed
- ⏳ Ready for validation testing
- ⏳ Ready for Story 2.10 create-story workflow

**Next Steps**:
1. Validation testing (verify two-paragraph structure in live conversation)
2. Proceed with Story 2.10 creation workflow (enhancement already incorporated)

---

## 7. Appendix: Analysis Documentation

### Checklist Completion Status

| Section | Status | Notes |
|---------|--------|-------|
| 1. Understand Trigger & Context | ✅ Done | Story 2.10 (backlog), user request for paragraph structure |
| 2. Epic Impact Assessment | ✅ Done | Epic 2 refinement only, no future epic impacts |
| 3. Artifact Conflict Analysis | ✅ Done | Zero conflicts (PRD, Architecture, UX, API, Frontend) |
| 4. Path Forward Evaluation | ✅ Done | Option 1 (Direct Adjustment) selected — low effort, low risk |
| 5. Sprint Change Proposal Components | ✅ Done | Issue summary, impact analysis, recommendations compiled |
| 6. Final Review & Handoff | ⏳ Pending | Awaiting user approval |

### Key Files Referenced

**Planning Artifacts**:
- `_bmad-output/planning-artifacts/epics/epic-2-assessment-backend-services.md` (Story 2.10 definition)
- `_bmad-output/planning-artifacts/ux-design-specification/core-experience-the-30-minute-conversation-with-nerin.md` (conversation principles)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (Epic 2 status)

**Implementation Files**:
- `packages/domain/src/utils/nerin-system-prompt.ts` (system prompt builder — **TARGET FILE**)
- `packages/domain/src/schemas/agent-schemas.ts` (NerinResponseSchema definition)
- `packages/domain/src/repositories/nerin-agent.repository.ts` (contract interface)
- `packages/infrastructure/src/repositories/nerin-agent.langgraph.repository.ts` (LangGraph implementation)

**Architecture Documentation**:
- `docs/ARCHITECTURE.md` (hexagonal architecture, agent flow)
- `_bmad-output/planning-artifacts/architecture/adr-6-hexagonal-architecture-dependency-inversion.md` (repository pattern)

---

## Document Metadata

**Generated by**: BMad Correct-Course Workflow
**Workflow Config**: `_bmad/bmm/workflows/4-implementation/correct-course/workflow.yaml`
**Execution Mode**: Batch (all changes presented together)
**User Skill Level**: Intermediate (conversational, collaborative)
**Communication Language**: English

---

**END OF SPRINT CHANGE PROPOSAL**
