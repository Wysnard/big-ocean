---
name: 'step-07-e2e-validation'
description: 'Run or write Playwright E2E tests validating the story from the frontend perspective'
---

# Step 7: E2E Validation

**Goal:** Validate the implemented story with Playwright E2E tests that exercise real UI interactions. This is the final gate before commit/PR.

---

## AVAILABLE STATE

From previous steps:

- `{baseline_commit}` - Git HEAD at workflow start
- `{execution_mode}` - "tech-spec" or "direct"
- `{tech_spec_path}` - Tech-spec file (if Mode A)
- Implementation complete and review findings resolved

---

## RULES (NON-NEGOTIABLE)

1. **Real UI interactions only.** Tests MUST use clicks, form fills, navigation, and assertions on visible DOM elements. Direct API calls (`request.post(...)`) are NOT E2E tests — they belong in integration tests.
2. **Extend existing specs first.** Before creating a new file, check `e2e/specs/` for an existing spec that covers the same user journey. Add new scenarios to that file. Only create a new spec file if no existing journey covers the feature.
3. **Use `data-testid` for selectors.** Never use fragile CSS class or DOM structure selectors. If a `data-testid` is missing, add it to the component.
4. **Never remove or rename existing `data-testid` attributes.**

---

## PROCESS

### 1. Determine E2E Scope

Based on what was implemented, identify:

- Which user-visible flows were added or changed?
- Which existing E2E specs (`e2e/specs/`) touch those flows?

If the story is purely backend with no UI changes (e.g., schema migration, background job), document why E2E is not applicable and skip to COMPLETION.

### 2. Extend or Write E2E Tests

**Check existing specs first:**

```
e2e/specs/
├── golden-path.spec.ts          # Full assessment journey
├── signup-redirect.spec.ts      # Auth redirects
├── profile-page.spec.ts         # Profile viewing
├── public-profile.spec.ts       # Public profile sharing
├── evidence-highlighting.spec.ts # Evidence UI
├── purchase-credits.spec.ts     # Monetization
├── invitation-system.spec.ts    # Relationship invitations
├── relationship-analysis.spec.ts # Relationship results
├── archetype-card.spec.ts       # Card generation
├── waitlist.spec.ts             # Waitlist signup
└── access-control/              # Auth guards
```

- If the feature extends an existing journey → add test cases to the existing spec
- If the feature is a new top-level journey → create a new spec file

### 3. Run E2E Tests

```bash
pnpm --filter e2e test          # Run all E2E specs
pnpm --filter e2e test -- --grep "test name"  # Run specific test
```

If Docker test environment is needed:

```bash
pnpm docker:test:up             # Start test containers
pnpm --filter e2e test          # Run E2E
pnpm docker:test:down           # Cleanup
```

### 4. Fix Failures

If E2E tests fail:

- Fix the test or the implementation (not both at once)
- Re-run `pnpm turbo typecheck` after any code changes (mandatory gate from step 6b)
- Re-run the failing E2E test until green

---

## COMPLETION

```
**E2E Validation Complete**

- Specs touched: {list of spec files}
- Tests added/modified: {count}
- All E2E tests passing: ✅
- Approach: {extended existing spec / created new spec / N/A (no UI changes)}

Ready to commit.
```

---

## WORKFLOW COMPLETE

This is the final step. The Quick Dev workflow is now complete.

User can:

- Commit changes
- Create PR
- Start new Quick Dev session

---

## SUCCESS METRICS

- E2E tests use real UI interactions (clicks, forms, navigation)
- Existing spec files extended before creating new ones
- All E2E tests pass
- `data-testid` attributes used for selectors
- Typecheck still passes after any E2E-related code changes

## FAILURE MODES

- Writing API-call-based tests instead of UI interactions
- Creating a new spec file when an existing one covers the journey
- Removing or renaming `data-testid` attributes
- Skipping E2E for a story with visible UI changes
- Not running typecheck after adding `data-testid` to components
