# Sprint Change Proposal - Session Ownership Enforcement

Date: 2026-02-14
Workflow: correct-course
Mode: Batch
Trigger Story: 7-11-auth-gated-results-reveal-and-sign-up-flow (plus backend session APIs from Epic 2)

## Section 1: Issue Summary

A security/authorization gap was discovered after anonymous session linking during sign-up.

- Repro path:
  1. Anonymous user starts assessment and creates session.
  2. User signs up/signs in and session is linked (`assessment_session.user_id` is set).
  3. Another user (or unauthenticated client with leaked session ID) can still call session endpoints by raw `sessionId`.
- Expected behavior:
  - Once linked to a user account, that assessment session must only be accessible by that same user.
  - Non-owners should be blocked and redirected to home page in UI.
- Evidence:
  - Current assessment use cases only validate session existence; they do not enforce session ownership.
  - Session IDs are URL-addressable and currently treated as sufficient authorization in resume/results/message flows.

## Section 2: Impact Analysis

### Epic Impact

- Epic 2 (Assessment Backend Services): impacted
  - Session lifecycle currently lacks ownership guard on protected reads/writes.
- Epic 7 (Auth-gated Results Reveal): impacted
  - Story intent says full results are auth-gated, but backend access control for linked sessions is incomplete.

### Story Impact

- 7-11-auth-gated-results-reveal-and-sign-up-flow: needs explicit ownership constraint and unauthorized navigation behavior.
- 2-10-nerin-conversational-empathy-patterns (in review): no scope rewrite required, but API protection now becomes a hard prerequisite for safe release.

### Artifact Conflicts

- PRD conflict: privacy-by-default principle is weakened if linked sessions are retrievable by non-owners.
- Architecture conflict: Better Auth session linkage exists, but ownership is not enforced downstream on assessment endpoints.
- UX conflict: unauthorized session access does not consistently route user to safe entry (`/`).

### Technical Impact

Affected backend endpoints:
- `POST /api/assessment/message`
- `GET /api/assessment/:sessionId/resume`
- `GET /api/assessment/:sessionId/results`

Affected frontend behavior:
- Chat/results unauthorized access handling should redirect to home page for non-owner access attempts.

Checklist status summary:
- 1.1 [x] Done
- 1.2 [x] Done
- 1.3 [x] Done
- 2.1 [x] Done
- 2.2 [x] Done
- 2.3 [x] Done
- 2.4 [N/A] Skip
- 2.5 [N/A] Skip
- 3.1 [x] Done
- 3.2 [x] Done
- 3.3 [x] Done
- 3.4 [N/A] Skip
- 4.1 [x] Viable
- 4.2 [ ] Not viable
- 4.3 [ ] Not viable
- 4.4 [x] Done
- 5.1 [x] Done
- 5.2 [x] Done
- 5.3 [x] Done
- 5.4 [x] Done
- 5.5 [x] Done

## Section 3: Recommended Approach

Selected path: Option 1 - Direct Adjustment

Rationale:
- The issue is isolated to authorization checks and error routing.
- No rollback needed; no MVP scope reduction needed.
- Existing Better Auth integration already provides linked ownership identity.

Effort: Medium
Risk: Medium (touches core assessment API paths; must avoid regressions for anonymous pre-link sessions)
Timeline impact: Low (single sprint, no epic resequencing required)

## Section 4: Detailed Change Proposals

### A) Story Edit Proposal - Story 7.11 (Epic 7)

Story: 7.11 Auth-Gated Results Reveal & Sign-Up Flow
Section: Acceptance Criteria / Technical Details

OLD:
- "And the full results page is NOT accessible without authentication"
- Technical details mention linking anonymous session to account.

NEW:
- Add explicit ownership constraint:
  - "Given an assessment session has been linked to user account A, when any other user or anonymous client attempts to access that session via resume/results/message endpoints, then access is denied and the app redirects to home page."
- Add backend rule to technical details:
  - "Assessment endpoints must enforce owner-only access for linked sessions (session.userId != requester.userId => deny)."

Rationale:
- Clarifies that auth gate is not only a UX gate but a backend authorization rule.

### B) Story Edit Proposal - Epic 2 backend story scope note

Story: Epic 2 backend session management scope (2.x)
Section: Technical requirements

OLD:
- Session persistence and resume behavior centered on sessionId.

NEW:
- Add ownership enforcement requirement:
  - "Session read/write endpoints must allow anonymous access only while session.userId is null. Once userId is set, only that user may access session resources."

Rationale:
- Codifies security behavior in backend epic where session APIs are defined.

### C) Architecture Edit Proposal - Access control clarification

Artifact: architecture/core-architectural-decisions.md
Section: Authentication & Authorization / Session lifecycle

OLD:
- Describes anonymous->authenticated session linking.

NEW:
- Add rule:
  - "Linked assessment sessions are owner-scoped resources. API handlers must enforce ownership checks on resume/results/message operations."
- Add policy behavior:
  - "Non-owner access attempts should return not-found-equivalent or unauthorized response (implementation choice), and frontend must route to safe home entry."

Rationale:
- Prevents future implementation drift and aligns with privacy posture.

### D) UI/UX Edit Proposal - Unauthorized navigation rule

Artifact: ux-design-specification.md
Section: Error/edge states for session routes

OLD:
- Session expired and generic error states defined.

NEW:
- Add explicit unauthorized-linked-session state:
  - Message: "This assessment session is no longer available from this account."
  - Action: automatic redirect to home page (`/`) with optional toast.

Rationale:
- Aligns UX behavior with security policy and user expectation.

### E) Code-level Implementation Proposal (direct)

1. Backend enforcement (required):
- Add requester identity resolution in assessment handlers using Better Auth session from request headers/cookies.
- Pass `authenticatedUserId` into assessment use cases (`sendMessage`, `resumeSession`, `getResults`).
- In each use case:
  - if `session.userId` is null => allow (anonymous pre-link flow)
  - if `session.userId` is set and `authenticatedUserId !== session.userId` => deny access

2. Frontend redirect behavior (required):
- On ownership-denied session API response for chat/results routes, redirect to `/`.
- Keep existing flow for owner access and anonymous pre-link access.

3. Regression tests (required):
- Owner access succeeds after link.
- Non-owner and anonymous access to linked session denied.
- Frontend routes redirect home on denied access.

## Section 5: Implementation Handoff

Scope classification: Minor

Execution plan:
- Development team tasks:
  1. Implement backend ownership guard in assessment flows.
  2. Implement frontend redirect-to-home on denied access.
  3. Add tests for owner vs non-owner linked-session access.

Success criteria:
- Linked sessions are inaccessible to non-owners across resume/results/message.
- Owner continues normal assessment/resume/results behavior.
- Unauthorized linked-session access routes user to home page.
- No regressions in anonymous pre-link assessment flow.

---

## Final Recommendation

Proceed immediately with direct adjustment implementation in current sprint.
No rollback, no epic resequencing, no MVP scope reduction required.

## Approval and Handoff Log

- Approval status: Approved by user (`yes`)
- Approval date: 2026-02-14
- Scope classification: Minor
- Handoff route: Development team (direct implementation)
- Handoff deliverables:
  - This Sprint Change Proposal
  - Code-level implementation tasks (backend ownership guard + frontend home redirect)
  - Regression test requirements (owner/non-owner access matrix)
- Sprint status updates: Not required (no epic/story add/remove/renumber in this proposal)
