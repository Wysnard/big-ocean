# Story 2.0: Linter Unification & Frontend Error Fixes

**Story ID:** 2.0
**Story Key:** 2-0-linter-unification-and-frontend-fixes
**Epic:** 2 - Assessment Backend Services (Prerequisite)
**Status:** ready-for-dev
**Created:** 2026-01-31
**Priority:** Critical (Prerequisite for Epic 2)

---

## Story

As a **Developer**,
I want **to unify all project linting to Biome with a shared configuration package**,
So that **the codebase has consistent code quality enforcement across all apps and packages, and the entire monorepo passes zero-error linting**.

---

## Acceptance Criteria

### Primary Acceptance Criteria

**Given** the project uses mixed linting tools (Biome for frontend, ESLint for UI package, no linting for API)
**When** I execute `/bmad-bmm-dev-story 2-0`
**Then** ALL apps and packages use Biome exclusively with a unified shared config

**Given** a new `packages/lint` shared configuration package
**When** an app or package references linting config
**Then** it imports from `@workspace/lint` (not local ESLint/Biome configs)

**Given** the entire monorepo
**When** I run `pnpm lint`
**Then** zero linting errors across all apps and packages
**And** all 26+ frontend errors fixed
**And** all API errors fixed (new)
**And** all package linting fixed (new)

**Given** ESLint is no longer needed
**When** the migration is complete
**Then** `packages/eslint-config` is removed
**And** no ESLint dependencies remain in any package
**And** documentation reflects Biome-only approach

---

## Technical Context

### Current State

**Linting Setup (Mixed):**
- **apps/front**: Biome via `biome.json`
- **packages/ui**: ESLint via `@workspace/eslint-config/react-internal`
- **apps/api**: NO linting
- **Other packages**: NO linting (contracts, domain, infrastructure)

**Frontend Errors:** 26 total from previous work
- useUniqueElementIds (8)
- noExplicitAny (4)
- useExhaustiveDependencies (11)
- useButtonType (6)
- Non-null assertions (1)

**Problem:**
- Inconsistent tooling across monorepo
- ESLint maintenance burden
- New packages can't easily adopt linting
- Mixed standards lead to inconsistent code quality

### Root Cause

The project evolved without a unified linting strategy:
1. Frontend (apps/front) adopted Biome for better performance
2. UI package (packages/ui) uses older ESLint approach
3. API and other packages never added linting
4. Result: No single source of truth for code quality

---

## Implementation Approach

### Phase 1: Create packages/lint Shared Config

**Goal:** Build centralized Biome configuration package

**Actions:**
- [ ] Create `packages/lint/` directory
- [ ] Write `package.json` with Biome dependency
- [ ] Write `biome.json` with shared ruleset
- [ ] Write `tsconfig.json` for package
- [ ] Create README with migration guide
- [ ] Add lint and format scripts

**Definition of Done:** `pnpm install` succeeds, @workspace/lint package available

### Phase 2: Migrate apps/front

**Goal:** Use shared config in existing Biome setup

**Actions:**
- [ ] Update `apps/front/biome.json` to extend from @workspace/lint
- [ ] Add @workspace/lint to `apps/front/package.json` devDependencies
- [ ] Run `pnpm lint --filter=front` to verify

**Definition of Done:** apps/front linting works with shared config

### Phase 3: Migrate apps/api

**Goal:** Add Biome linting to API

**Actions:**
- [ ] Add @biomejs/biome to `apps/api/package.json` devDependencies
- [ ] Create `apps/api/biome.json` extending @workspace/lint
- [ ] Add lint script: `"lint": "biome lint ."`
- [ ] Run `pnpm lint --filter=api` and fix errors
- [ ] Add api to turbo.json lint task

**Definition of Done:** apps/api has zero linting errors

### Phase 4: Migrate packages/ui

**Goal:** Replace ESLint with Biome in UI package

**Actions:**
- [ ] Remove ESLint dependencies from `packages/ui/package.json`
- [ ] Delete `packages/ui/.eslintrc.js`
- [ ] Add @biomejs/biome to devDependencies
- [ ] Create `packages/ui/biome.json` extending @workspace/lint
- [ ] Update lint script: `"lint": "biome lint . --max-diagnostics=0"`
- [ ] Run lint and fix errors
- [ ] Maintain zero-warnings policy

**Definition of Done:** packages/ui uses Biome, zero linting errors

### Phase 5: Add Linting to Other Packages

**Goal:** Enable linting for contracts, domain, infrastructure

**For each package (contracts, domain, infrastructure):**
- [ ] Add @biomejs/biome to devDependencies
- [ ] Create `biome.json` extending @workspace/lint
- [ ] Add lint script to package.json
- [ ] Run lint and fix errors

**Definition of Done:** All packages have lint scripts, zero errors

### Phase 6: Fix All Linting Errors

**Goal:** Achieve zero-error status across entire monorepo

**Actions:**
- [ ] Run `pnpm lint` (root)
- [ ] Categorize errors by app/package
- [ ] Fix systematically (same approach as original Story 2-0)
- [ ] Verify all 92 tests still pass

**Error Types Expected:**
- useUniqueElementIds (frontend)
- useExhaustiveDependencies (hooks)
- useButtonType (buttons)
- noExplicitAny (generics)
- Non-null assertions (type safety)
- Unused variables
- Inconsistent formatting

**Definition of Done:** `pnpm lint` returns zero errors

### Phase 7: Remove ESLint

**Goal:** Clean up old tooling

**Actions:**
- [ ] Delete `packages/eslint-config/` directory
- [ ] Remove from pnpm-workspace.yaml if listed
- [ ] Remove any root ESLint dependencies
- [ ] Remove ESLint from CLAUDE.md

**Definition of Done:** No ESLint references remain

### Phase 8: Update Documentation

**Goal:** Document new unified approach

**Actions:**
- [ ] Update CLAUDE.md "Linting & Code Quality" section
- [ ] Write `packages/lint/README.md` migration guide
- [ ] Update any deployment docs
- [ ] Remove old ESLint references

**Definition of Done:** Documentation reflects Biome-only approach

---

## Files to Create/Modify/Delete

### New Files (9)
- `packages/lint/package.json`
- `packages/lint/biome.json`
- `packages/lint/tsconfig.json`
- `packages/lint/README.md`
- `apps/api/biome.json`
- `packages/ui/biome.json`
- `packages/contracts/biome.json`
- `packages/domain/biome.json`
- `packages/infrastructure/biome.json`

### Modified Files (12)
- `apps/front/biome.json`
- `apps/front/package.json`
- `apps/api/package.json`
- `packages/ui/package.json`
- `packages/contracts/package.json`
- `packages/domain/package.json`
- `packages/infrastructure/package.json`
- `pnpm-workspace.yaml`
- `turbo.json`
- `CLAUDE.md`
- `.github/workflows/test.yml` (possibly, for verification)
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

### Deleted Files/Directories (1)
- `packages/eslint-config/` (entire directory)

### Source Files with Linting Fixes (9+)
- `apps/front/src/components/auth/login-form.tsx`
- `apps/front/src/components/auth/signup-form.tsx`
- `apps/front/src/components/storybook/dialog.stories.tsx`
- `apps/front/src/routes/demo/orpc-todo.tsx`
- `apps/front/src/routes/demo/start.server-funcs.tsx`
- `apps/front/src/routes/demo/table.tsx`
- `apps/front/src/routes/demo/storybook.tsx`
- `apps/front/src/components/TherapistChat.tsx`
- `apps/front/src/hooks/demo.useChat.ts`
- Plus any errors in api, packages/ui, and other packages

---

## Testing Requirements

### Build & Linting Validation
- [ ] `pnpm install` succeeds with new packages/lint
- [ ] `pnpm lint` returns zero errors (all packages)
- [ ] `pnpm build` compiles without errors
- [ ] `pnpm test` passes 100% (92/92 tests)

### Package-Specific Validation
- [ ] apps/front: `pnpm lint --filter=front` passes
- [ ] apps/api: `pnpm lint --filter=api` passes
- [ ] packages/ui: `pnpm lint --filter=ui` passes (zero-warnings policy maintained)
- [ ] packages/contracts: `pnpm lint --filter=contracts` passes
- [ ] packages/domain: `pnpm lint --filter=domain` passes
- [ ] packages/infrastructure: `pnpm lint --filter=infrastructure` passes

### Cleanup Validation
- [ ] packages/eslint-config/ deleted
- [ ] No ESLint dependencies in package-lock
- [ ] No .eslintrc files remain
- [ ] pnpm-lock.yaml regenerated

### CI/CD Validation
- [ ] GitHub Actions test workflow passes
- [ ] All linting checks pass in CI
- [ ] No ESLint-related warnings

---

## Deployment Impact

**Risk Level:** Medium (breaking change to tooling)
- Linting behavior may differ (Biome vs ESLint rules)
- New error categories may appear
- All packages affected simultaneously

**Rollback Plan:**
1. Revert feature branch to master
2. Restore packages/eslint-config from git history
3. Restore old biome.json configurations
4. Railway redeploys automatically

**Mitigation:**
- Comprehensive testing before merge
- Careful error categorization and fixes
- Documentation of all changes
- Feature branch testing before PR

---

## Architecture Compliance

### Project Structure
- New package follows monorepo conventions
- Maintains pnpm workspace structure
- No external directory changes
- Follows existing patterns

### Coding Standards
- Use Biome recommended rules
- Maintain existing code style
- Apply same patterns to all packages
- Keep zero-warnings policy for UI

### Testing Standards
- All existing tests must pass
- No new test files needed (infrastructure change)
- Linting is the primary validation
- Manual verification of config migration

---

## Success Metrics

- ✅ `pnpm lint` produces ZERO errors across all packages
- ✅ `pnpm build` compiles without errors
- ✅ `pnpm test` passes all 92 tests
- ✅ GitHub Actions CI/CD pipeline passes
- ✅ All apps have lint scripts
- ✅ All packages have lint scripts
- ✅ ESLint completely removed
- ✅ Shared config in @workspace/lint
- ✅ Documentation updated
- ✅ Feature branch ready for code review

---

## Dependencies

**Blocks:** Stories 2-1 through 2-5 (need clean codebase)
**Blocked By:** None (depends on current codebase)

**Critical Path:**
- Must complete before other Epic 2 stories
- Unblocks clean development environment
- Enables code quality enforcement for all new work

---

## Dev Notes

### Linting Strategy
- **Single Tool:** Biome for all linting (not ESLint)
- **Shared Config:** @workspace/lint for consistency
- **Zero Errors:** Must achieve zero across all packages
- **Enforcement:** CI/CD enforces via `pnpm lint`

### Biome Configuration
- File: `packages/lint/biome.json`
- Rules: Recommended + strict accessibility + type safety
- Extends: None (is the base config)
- Used by: All apps/packages via extends

### Migration Checklist
- [ ] Phase 1: Create packages/lint
- [ ] Phase 2: apps/front migration
- [ ] Phase 3: apps/api migration
- [ ] Phase 4: packages/ui migration
- [ ] Phase 5: Other packages
- [ ] Phase 6: Fix all errors
- [ ] Phase 7: Remove ESLint
- [ ] Phase 8: Update docs

---

## Dev Agent Record

**Status:** PENDING - Ready for implementation

**Branch:** `feat/story-2-0-linter-unification`

**Implementation Timeline:**
- Phase 1: 1 hour (packages/lint creation)
- Phase 2: 30 min (apps/front update)
- Phase 3: 1-2 hours (apps/api migration + error fixes)
- Phase 4: 2-3 hours (packages/ui migration + error fixes)
- Phase 5: 1-2 hours (other packages)
- Phase 6: 2-4 hours (fix all errors systematically)
- Phase 7: 30 min (remove ESLint)
- Phase 8: 1 hour (documentation)

**Total Scope:** ~10-15 hours of focused development

### Implementation Notes

(To be filled during development)

---

## Change Log

**2026-01-31:** Story 2-0 rewritten with linter unification scope, ready-for-dev status, feature branch created

---
