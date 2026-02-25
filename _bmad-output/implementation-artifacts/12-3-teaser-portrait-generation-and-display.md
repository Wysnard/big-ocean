# Story 12.3: Teaser Portrait Generation & Display

Status: ready-for-dev

## Story

As a **user who has completed an assessment**,
I want to **see a teaser portrait that previews my personality narrative with locked section titles**,
so that **I'm intrigued to unlock the full portrait**.

## Acceptance Criteria

1. **AC1 — Teaser stored in portraits table:** When finalization Phase 2 generates the teaser portrait, the result is stored in the `portraits` table with `tier='teaser'`, `content=<teaser text>`, and `locked_section_titles` populated with the 3 locked section names (Build, Turn, Landing), in addition to the existing `assessment_results.portrait` field.

2. **AC2 — Locked section titles from Haiku response:** The teaser portrait prompt is updated so Haiku returns both the Opening section text AND the titles for the 3 locked sections (Build, Turn, Landing) as structured output. These titles are stored in `portraits.locked_section_titles` as a JSON array.

3. **AC3 — Portrait status includes teaser tier:** The `GET /api/portrait/:sessionId/status` endpoint is extended to also return teaser portrait data (content + lockedSectionTitles) alongside the existing full portrait status.

4. **AC4 — TeaserPortrait component:** A `TeaserPortrait` component renders the teaser content (Opening section) followed by locked section placeholders showing the section titles with a lock icon and blurred/redacted preview.

5. **AC5 — Reveal Full Portrait CTA:** The TeaserPortrait component includes a prominent "Reveal Full Portrait" call-to-action button that triggers the Polar checkout overlay for portrait unlock.

6. **AC6 — Results page integration:** The results page renders `TeaserPortrait` (instead of `PersonalPortrait`) when the user has only a teaser (no full portrait). When a full portrait is available, it renders `PersonalPortrait` as before.

7. **AC7 — Portrait reading mode:** Navigating to `/results/:sessionId?view=portrait` renders a focused portrait reading view with minimal chrome (no trait scores, no evidence sections — just the portrait content).

8. **AC8 — Founder social proof (stretch):** A founder's completed portrait excerpt is shown below the teaser as conversion proof ("See what others discovered").

## Tasks / Subtasks

- [ ] **Task 1: Update teaser portrait prompt to return structured output** (AC: #2)
  - [ ] 1.1 Modify `TEASER_SYSTEM_PROMPT` in `packages/infrastructure/src/repositories/teaser-portrait.anthropic.repository.ts` to instruct Haiku to return JSON with two fields: `opening` (the teaser text) and `lockedSectionTitles` (array of 3 strings for Build/Turn/Landing section names)
  - [ ] 1.2 Update `TeaserPortraitOutput` type in `packages/domain/src/repositories/teaser-portrait.repository.ts` to include `lockedSectionTitles: ReadonlyArray<string>`
  - [ ] 1.3 Parse the structured JSON response in the Anthropic repository, falling back to raw text + default titles `["Your Inner Landscape", "The Unexpected Turn", "Where It All Leads"]` if JSON parsing fails
  - [ ] 1.4 Update mock in `__mocks__/teaser-portrait.anthropic.repository.ts` to return `lockedSectionTitles`

- [ ] **Task 2: Store teaser in portraits table during finalization** (AC: #1)
  - [ ] 2.1 In `apps/api/src/use-cases/generate-results.use-case.ts`, after teaser generation succeeds, insert a row into `portraits` table via `PortraitRepository.insertPlaceholder()` followed by `PortraitRepository.updateContent()`:
    ```typescript
    // Insert teaser into portraits table (additive — assessment_results.portrait stays)
    const teaserPlaceholder = yield* portraitRepo.insertPlaceholder({
      assessmentResultId,
      tier: "teaser" as const,
      modelUsed: "claude-haiku-4-5-20251001",
    }).pipe(Effect.catchTag("DuplicatePortraitError", () => Effect.succeed(null)));

    if (teaserPlaceholder) {
      yield* portraitRepo.updateContent(teaserPlaceholder.id, teaserOutput.portrait);
    }
    ```
  - [ ] 2.2 Store `lockedSectionTitles` — extend `insertPlaceholder` or add a dedicated method to set `locked_section_titles` on the portrait row
  - [ ] 2.3 Add `PortraitRepository` to generate-results use-case dependencies (import + yield*)
  - [ ] 2.4 Ensure existing `assessment_results.portrait` field is still populated (backward compat)

- [ ] **Task 3: Extend portrait status endpoint to include teaser data** (AC: #3)
  - [ ] 3.1 In `get-portrait-status.use-case.ts`, also fetch teaser portrait via `portraitRepo.getByResultIdAndTier(resultId, "teaser")`
  - [ ] 3.2 Add `teaser` field to response: `{ status, portrait, teaser: { content, lockedSectionTitles } | null }`
  - [ ] 3.3 Update `GetPortraitStatusResponseSchema` in `packages/contracts/src/http/groups/portrait.ts` to include teaser schema
  - [ ] 3.4 Update portrait handler to serialize teaser data

- [ ] **Task 4: Create TeaserPortrait component** (AC: #4, #5)
  - [ ] 4.1 Create `apps/front/src/components/results/TeaserPortrait.tsx`:
    - Props: `teaserContent: string`, `lockedSectionTitles: string[]`, `sessionId: string`, `onUnlock: () => void`
    - Renders Opening section as readable markdown
    - Renders 3 locked section placeholders with:
      - Lock icon (from lucide-react)
      - Section title text
      - Blurred/gradient-masked placeholder text (2-3 lines of lorem-style blurred content)
    - Add `data-testid="teaser-portrait"` to root
    - Add `data-testid="locked-section"` to each locked placeholder
  - [ ] 4.2 Add "Reveal Full Portrait" CTA button:
    - Prominent styling, positioned after the locked sections
    - `data-testid="reveal-portrait-cta"`
    - Calls `onUnlock` prop which triggers Polar checkout overlay
  - [ ] 4.3 Style locked sections following FRONTEND.md patterns (ocean depth theme, glass-morphism cards for locked sections)

- [ ] **Task 5: Integrate TeaserPortrait in results page** (AC: #6)
  - [ ] 5.1 In `apps/front/src/routes/results/$assessmentSessionId.tsx`:
    - If user has full portrait (status "ready") → render `PersonalPortrait` (existing behavior)
    - If user has teaser only → render `TeaserPortrait` with locked sections
    - If user has no portrait at all → render existing `PersonalPortrait` fallback with `personalDescription`
  - [ ] 5.2 Wire `onUnlock` to trigger Polar checkout for `portrait_unlock` product (reuse existing `polar-checkout.ts` logic)
  - [ ] 5.3 After successful purchase + full portrait generation, automatically switch from TeaserPortrait to PersonalPortrait (existing polling handles this)

- [ ] **Task 6: Portrait reading mode** (AC: #7)
  - [ ] 6.1 Add `view` search param to results route schema: `view: z.enum(["default", "portrait"]).optional()`
  - [ ] 6.2 When `view=portrait`, render a focused layout:
    - Full-width portrait content (teaser or full, depending on purchase state)
    - Minimal header with back navigation
    - No trait scores, evidence sections, or other results content
    - Add `data-testid="portrait-reading-mode"` to container
  - [ ] 6.3 If full portrait is available, show all 4 sections in reading mode. If teaser only, show teaser + locked sections + CTA

- [ ] **Task 7: Unit tests** (AC: #1, #2, #3)
  - [ ] 7.1 Update `generate-results.use-case.test.ts`:
    - Test teaser is stored in portraits table with tier='teaser'
    - Test lockedSectionTitles are stored
    - Test assessment_results.portrait is still populated (backward compat)
    - Test DuplicatePortraitError is caught (idempotent re-run)
  - [ ] 7.2 Update `get-portrait-status.use-case.test.ts`:
    - Test teaser data is included in response
    - Test response when no teaser exists (null)
  - [ ] 7.3 Test TeaserPortraitOutput parsing with and without lockedSectionTitles

- [ ] **Task 8: E2E test** (AC: #4, #5, #6)
  - [ ] 8.1 Add test in `e2e/specs/` verifying:
    - Teaser portrait is visible on results page for authenticated user
    - Locked sections are displayed with section titles
    - "Reveal Full Portrait" CTA is visible
  - [ ] 8.2 Add `data-testid` attributes to all new components per CLAUDE.md rule

## Dev Notes

### What Already Exists

The teaser portrait generation pipeline is fully built (Stories 11.5 + 8.4):

- **`TeaserPortraitRepository`** interface (`packages/domain/src/repositories/teaser-portrait.repository.ts`) — `generateTeaser(input)` method
- **`teaser-portrait.anthropic.repository.ts`** — Haiku-based generation with Nerin persona, Spine Opening section (~200-400 words)
- **`generate-results.use-case.ts`** — Phase 2 calls `teaserPortraitRepo.generateTeaser()` and stores result in `assessment_results.portrait`
- **`portraits` table** (Story 13.3) — exists with `tier`, `content`, `locked_section_titles` columns and `UNIQUE(assessment_result_id, tier)` constraint
- **`PortraitRepository`** + `PortraitDrizzleRepositoryLive` — 5 methods: insertPlaceholder, updateContent, incrementRetryCount, getByResultIdAndTier, getFullPortraitBySessionId
- **`PersonalPortrait.tsx`** — renders full portrait markdown with generating/failed states
- **`usePortraitStatus` hook** — polls `GET /api/portrait/:sessionId/status` every 2s while generating
- **Polar checkout** — `polar-checkout.ts` with embedded overlay for purchases

### What This Story Adds

1. **Structured teaser output** — Haiku returns JSON with `opening` + `lockedSectionTitles` instead of raw text
2. **Dual storage** — Teaser stored in BOTH `assessment_results.portrait` (backward compat) AND `portraits` table (with locked section titles)
3. **Teaser-aware status endpoint** — Returns teaser data alongside full portrait status
4. **TeaserPortrait component** — New UI with readable Opening + locked section placeholders + CTA
5. **Portrait reading mode** — `?view=portrait` for focused reading experience
6. **Smart rendering** — Results page auto-selects TeaserPortrait vs PersonalPortrait based on purchase state

### Prompt Update Strategy

The existing `TEASER_SYSTEM_PROMPT` asks Haiku to generate an Opening section as markdown. This story modifies it to request JSON output:

```
Return your response as a JSON object with exactly these fields:
{
  "opening": "The teaser portrait text (Opening section, 200-400 words)",
  "lockedSectionTitles": [
    "Title for Build section (evocative, personalized)",
    "Title for Turn section (hints at paradox/surprise)",
    "Title for Landing section (forward-looking, integrative)"
  ]
}
```

The section titles should be personalized based on the user's assessment (e.g., "The Architecture of Your Empathy", "When Logic Meets Longing", "Your Emerging Edge"). These titles are the primary conversion hook — they must intrigue without revealing.

### Backward Compatibility

The `assessment_results.portrait` field continues to be populated with the teaser text for backward compatibility. The `portraits` table row is additive. Frontend code should prefer `portraits` table data when available, falling back to `assessment_results.portrait`.

### Architecture Compliance

- **Hexagonal architecture:** All business logic in use-cases, handlers thin
- **Error propagation:** DuplicatePortraitError caught in use-case (idempotent), not remapped
- **data-testid rule:** All new components get data-testid attributes for e2e
- **No business logic in handlers:** Portrait data assembly happens in use-case

### Frontend Patterns

Follow FRONTEND.md:
- Ocean depth glass-morphism for locked sections
- `data-testid` on all interactive elements
- TanStack Query for data fetching
- Consistent with existing results page layout

### References

- [Source: apps/api/src/use-cases/generate-results.use-case.ts — Phase 2 teaser generation, lines 274-298]
- [Source: packages/infrastructure/src/repositories/teaser-portrait.anthropic.repository.ts — TEASER_SYSTEM_PROMPT]
- [Source: packages/domain/src/repositories/teaser-portrait.repository.ts — TeaserPortraitOutput type]
- [Source: packages/domain/src/repositories/portrait.repository.ts — PortraitRepository interface]
- [Source: apps/front/src/components/results/PersonalPortrait.tsx — existing portrait renderer]
- [Source: packages/contracts/src/http/groups/portrait.ts — portrait status endpoint]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.3 — acceptance criteria]
- [Source: _bmad-output/implementation-artifacts/13-3-full-portrait-async-generation.md — portraits table, status endpoint]

## Anti-Patterns

Do NOT introduce any of these patterns during implementation:

1. **Removing assessment_results.portrait** — This field must continue to be populated for backward compatibility. The portraits table row is additive.

2. **Storing status as a column** — Portrait status is derived from data (content IS NULL + retry_count). No status column.

3. **Business logic in handlers** — All teaser/full portrait selection logic belongs in use-cases, not handlers.

4. **Error remapping** — DuplicatePortraitError on teaser insert is caught and swallowed (idempotent), not remapped to a different error.

5. **Polling for teaser** — Teaser is generated synchronously during finalization. No polling needed for teaser — only for full portrait (already implemented).

6. **Breaking existing PersonalPortrait** — The existing component must continue to work for full portraits. TeaserPortrait is a NEW component, not a modification.

7. **Removing data-testid attributes** — Per CLAUDE.md, never remove existing data-testid attributes. Only add new ones.

8. **Over-engineering the reading mode** — Keep it simple: same route, conditional layout based on search param. No new route needed.
