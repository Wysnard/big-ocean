# Story 44-3: Barrel Export Cleanup & ConversAnalyzer Mock Removal

**Status:** ready-for-dev
**Epic:** Epic 44 — Director Model Codebase Cleanup & Development Tools
**Source:** `_bmad-output/planning-artifacts/epics-director-model.md` — Story 2.3

## Story

As a **developer**,
I want barrel exports updated and dead mocks removed so that imports resolve cleanly and the test infrastructure matches the current architecture.

## Acceptance Criteria

### AC-1: Nerin Constants Barrel Cleaned

**Given** `domain/src/constants/nerin/index.ts` previously exported deleted modules
**When** the barrel is verified
**Then** all exports for deleted modules are removed (steering-templates, pressure-modifiers, contextual-mirrors, nerin-chat-context, reflect, observation-quality-common, threading-common, conversation-mode, origin-story)
**And** only `PORTRAIT_CONTEXT` remains as a live export from the nerin/ subdirectory

### AC-2: Domain Root Barrel Cleaned

**Given** `domain/src/index.ts` previously exported deleted types and constants
**When** the barrel is verified
**Then** all exports for deleted types are removed (PromptBuilderInput, ScorerOutput, SelectorOutput, GovernorDebug, UserState, Territory, TerritoryId, etc.)
**And** all exports for deleted constants are removed (territory-catalog, band-mappings, scorer-defaults, pacing-defaults)
**And** exports exist for nerin-actor-prompt, nerin-director-prompt, nerin-director-closing-prompt, coverage-analyzer, and nerin-director.repository

### AC-3: ConversAnalyzer User-State Mocks Removed

**Given** ConversAnalyzer user-state extraction mocks previously existed in `__mocks__/` and `conversanalyzer.mock.repository.ts`
**When** the mocks are verified
**Then** user-state-specific mock implementations (analyzeUserState, analyzeUserStateLenient) are absent
**And** evidence extraction mocks (analyzeEvidence, analyzeEvidenceLenient) remain functional
**And** the ConversanalyzerRepository interface only exposes evidence extraction methods

### AC-4: No Stale Import References

**Given** all cleanup is complete
**When** the full codebase is scanned
**Then** no import references exist for deleted files (steering/, e-target, territory-catalog, band-mappings, scorer-defaults, pacing-defaults, prompt-builder-input, scorer-output, selector-output, governor-debug, user-state.ts, territory.ts)
**And** no TypeScript types reference deleted types (PromptBuilderInput, ScorerOutput, SelectorOutput, GovernorDebug, UserState, Territory, TerritoryId, ConversanalyzerV2Output, ConversanalyzerUserStateOutput)

### AC-5: Build Passes

**Given** all cleanup is verified
**When** build validation runs
**Then** `pnpm typecheck` passes across all packages
**And** `pnpm test:run` passes
**And** `pnpm lint` passes
**And** no import errors or unresolved references remain

## Tasks

### Task 1: Verify Nerin Constants Barrel (AC-1)
- [ ] 1.1: Confirm `domain/src/constants/nerin/index.ts` only exports PORTRAIT_CONTEXT
- [ ] 1.2: Confirm no deleted nerin module files exist in the nerin/ directory
- [ ] 1.3: Confirm no imports reference deleted nerin modules anywhere in codebase

### Task 2: Verify Domain Root Barrel (AC-2)
- [ ] 2.1: Confirm `domain/src/index.ts` has no exports for deleted types or constants
- [ ] 2.2: Confirm exports exist for nerin-actor-prompt, nerin-director-prompt, coverage-analyzer, nerin-director.repository
- [ ] 2.3: Confirm no deleted type/constant files exist in types/ or constants/ directories

### Task 3: Verify ConversAnalyzer Mock Cleanup (AC-3)
- [ ] 3.1: Confirm `__mocks__/conversanalyzer.anthropic.repository.ts` has no user-state methods
- [ ] 3.2: Confirm `conversanalyzer.mock.repository.ts` has no user-state methods
- [ ] 3.3: Confirm ConversanalyzerRepository interface only exposes evidence methods
- [ ] 3.4: Confirm no test files reference analyzeUserState or ConversanalyzerV2Output

### Task 4: Scan for Stale References (AC-4)
- [ ] 4.1: Search entire codebase for imports of deleted files
- [ ] 4.2: Search for references to deleted type names
- [ ] 4.3: Fix any remaining stale references found

### Task 5: Build Validation (AC-5)
- [ ] 5.1: Run `pnpm turbo typecheck` — must pass
- [ ] 5.2: Run `pnpm test:run` — must pass
- [ ] 5.3: Run `pnpm lint` — must pass

## Dev Notes

- Story 44-1 already performed the bulk of file deletions and barrel export cleanup (Task 7 in that story).
- Story 43-6 already stripped user-state extraction from ConversAnalyzer repository, mocks, and tests.
- This story validates that all cleanup is complete and catches any remaining stale references or exports.
- If all verification passes with no changes needed, this story serves as a confirmation gate that the codebase is clean post-Director-Model cleanup.
- TDD is not applicable for verification/cleanup — validation is via typecheck, test suite, and lint.
