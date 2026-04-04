# Story 44-1: Delete Old Pipeline Code — Functions, Constants, and Types

**Status:** ready-for-dev
**Epic:** Epic 2 — Director Model Codebase Cleanup & Development Tools
**Source:** `_bmad-output/planning-artifacts/epics-director-model.md` — Story 2.1

## Story

As a **developer**,
I want all dead pipeline code removed from the codebase after the Director model replacement,
So that the codebase reflects the current architecture with no ghost imports, stale types, or misleading code paths.

## Acceptance Criteria

### AC-1: Delete Old Pipeline Function Files

**Given** the Director model pipeline is operational (Epic 43 complete)
**When** old pipeline function files are deleted
**Then** the following files are removed from `packages/domain/src/utils/`:
- `e-target.ts`
- `steering/territory-scorer.ts`
- `steering/territory-selector.ts`
- `steering/move-governor.ts`
- `steering/prompt-builder.ts`
**And** the `steering/` subdirectory is removed (empty after deletions)

### AC-2: Delete Old Pipeline Constant Files

**Given** old pipeline constants are no longer referenced
**When** constant files are deleted
**Then** the following files are removed from `packages/domain/src/constants/`:
- `territory-catalog.ts`
- `band-mappings.ts`
- `scorer-defaults.ts`
- `pacing-defaults.ts`

### AC-3: Delete Old Pipeline Type Files

**Given** old pipeline types are no longer referenced
**When** type files are deleted
**Then** the following files are removed from `packages/domain/src/types/`:
- `prompt-builder-input.ts`
- `scorer-output.ts`
- `selector-output.ts`
- `governor-debug.ts`
- `user-state.ts`
- `territory.ts`

### AC-4: Delete Old Nerin Prompt Modules

**Given** old Nerin prompt modules are distributed or deleted per ADR-DM-8
**When** module files are deleted
**Then** the following are removed from `packages/domain/src/constants/nerin/`:
- `steering-templates.ts`
- `pressure-modifiers.ts`
- `contextual-mirrors.ts` (or `mirror-lookup.ts`)
- `nerin-chat-context.ts`
- `reflect.ts`
- `observation-quality-common.ts`
- `threading-common.ts`
- `conversation-mode.ts`
- `origin-story.ts`

### AC-5: Delete Associated Test Files

**Given** all associated test files exist in `__tests__/` directories
**When** the source files are deleted
**Then** all corresponding test files are deleted
**And** TypeScript compilation succeeds with no import errors
**And** `pnpm typecheck` passes across all packages

## Tasks

### Task 1: Identify All Files to Delete
- [ ] 1.1: Verify each file listed in AC-1 through AC-4 actually exists
- [ ] 1.2: Identify all corresponding test files in `__tests__/` directories
- [ ] 1.3: Search for any imports of these files across the entire codebase to confirm they are dead code

### Task 2: Delete Pipeline Function Files (AC-1)
- [ ] 2.1: Delete `packages/domain/src/utils/e-target.ts`
- [ ] 2.2: Delete `packages/domain/src/utils/steering/territory-scorer.ts`
- [ ] 2.3: Delete `packages/domain/src/utils/steering/territory-selector.ts`
- [ ] 2.4: Delete `packages/domain/src/utils/steering/move-governor.ts`
- [ ] 2.5: Delete `packages/domain/src/utils/steering/prompt-builder.ts`
- [ ] 2.6: Remove `packages/domain/src/utils/steering/` directory if empty

### Task 3: Delete Pipeline Constant Files (AC-2)
- [ ] 3.1: Delete `packages/domain/src/constants/territory-catalog.ts`
- [ ] 3.2: Delete `packages/domain/src/constants/band-mappings.ts`
- [ ] 3.3: Delete `packages/domain/src/constants/scorer-defaults.ts`
- [ ] 3.4: Delete `packages/domain/src/constants/pacing-defaults.ts`

### Task 4: Delete Pipeline Type Files (AC-3)
- [ ] 4.1: Delete `packages/domain/src/types/prompt-builder-input.ts`
- [ ] 4.2: Delete `packages/domain/src/types/scorer-output.ts`
- [ ] 4.3: Delete `packages/domain/src/types/selector-output.ts`
- [ ] 4.4: Delete `packages/domain/src/types/governor-debug.ts`
- [ ] 4.5: Delete `packages/domain/src/types/user-state.ts`
- [ ] 4.6: Delete `packages/domain/src/types/territory.ts`

### Task 5: Delete Old Nerin Prompt Modules (AC-4)
- [ ] 5.1: Delete `packages/domain/src/constants/nerin/steering-templates.ts`
- [ ] 5.2: Delete `packages/domain/src/constants/nerin/pressure-modifiers.ts`
- [ ] 5.3: Delete `packages/domain/src/constants/nerin/contextual-mirrors.ts` or `mirror-lookup.ts`
- [ ] 5.4: Delete `packages/domain/src/constants/nerin/nerin-chat-context.ts`
- [ ] 5.5: Delete `packages/domain/src/constants/nerin/reflect.ts`
- [ ] 5.6: Delete `packages/domain/src/constants/nerin/observation-quality-common.ts`
- [ ] 5.7: Delete `packages/domain/src/constants/nerin/threading-common.ts`
- [ ] 5.8: Delete `packages/domain/src/constants/nerin/conversation-mode.ts`
- [ ] 5.9: Delete `packages/domain/src/constants/nerin/origin-story.ts`

### Task 6: Delete Associated Test Files (AC-5)
- [ ] 6.1: Delete all test files corresponding to deleted source files
- [ ] 6.2: Remove any empty `__tests__/` directories after deletion

### Task 7: Clean Up Barrel Exports and Remaining References
- [ ] 7.1: Remove exports for deleted files from `packages/domain/src/utils/index.ts` (or equivalent barrel)
- [ ] 7.2: Remove exports for deleted files from `packages/domain/src/constants/index.ts`
- [ ] 7.3: Remove exports for deleted files from `packages/domain/src/types/index.ts`
- [ ] 7.4: Remove exports for deleted files from `packages/domain/src/constants/nerin/index.ts`
- [ ] 7.5: Remove exports for deleted files from `packages/domain/src/index.ts` (top-level barrel)

### Task 8: Verify Clean Build
- [ ] 8.1: Run `pnpm turbo typecheck` — must pass with zero errors
- [ ] 8.2: Verify no remaining imports reference deleted files

## Dev Notes

- This is a deletion-only story. No new code is written (except barrel export cleanup).
- The pipeline replacement in Epic 43 made all these files dead code.
- Story 44-2 and 44-3 depend on this story completing first (they update seed scripts and barrel exports that reference deleted files).
- TDD is not applicable for pure deletion — validation is via typecheck and ensuring no broken imports.
