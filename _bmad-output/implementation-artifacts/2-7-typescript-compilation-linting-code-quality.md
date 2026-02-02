# Story 2.7: TypeScript Compilation, Linting, and Code Quality Improvements

**Status:** ready-for-dev

**Epic:** 2 - Assessment Backend Services
**Story ID:** 2.7
**Created:** 2026-02-02
**Source:** Brainstorming Session (Improving TypeScript compilation, linting, and code quality)

---

## Story

As a **Backend Team Lead**,
I want **to establish unified TypeScript compilation, fix linting warnings, eliminate `as any` casts, and implement sustainable type safety patterns across the monorepo**,
So that **the codebase becomes easier to maintain, new developers can navigate it confidently, and type safety prevents bugs at compile-time instead of runtime**.

---

## Business Context

This story addresses technical debt accumulated during rapid development of the assessment backend (Epic 2). Current pain points:
- Manual import management (`.js` extensions requiring constant attention)
- Unresolved linting warnings (especially `useImportType` flagging type imports incorrectly)
- `as any` casts used as workarounds instead of proper typing (masking potential bugs)
- Inconsistent type safety approaches across packages (domain, infrastructure, api)
- Developers unfamiliar with correct patterns for Effect-ts + TypeScript strict mode

**Impact on Sprint:** Clearing these issues now prevents compounded difficulties in Epics 3-6 (Frontend UI, Results, Privacy). A single TypeScript configuration pattern established here becomes template for remaining work.

**Timeline Context:** 1 day to implement core fixes + sustainability patterns. This is strategic investment with immediate payoff.

---

## Acceptance Criteria

**Core Requirements:**

1. ✅ **Module Resolution** - All imports use bare specifiers without `.js` extensions
   - Bare imports work across packages and apps (e.g., `@workspace/domain`, `@workspace/contracts`)
   - Build system recognizes imports and resolves them correctly
   - TypeScript compiler configured with unified `paths` mapping
   - Linter prevents new `.js` imports (enforcement rule)
   - Existing `.js` imports converted via automated codemod

2. ✅ **Unified Typing & Formatting** - Consistent code style and auto-fix linting
   - All fixable linting rules are applied automatically via pre-commit hook
   - `useImportType` warnings resolved (type imports properly formatted)
   - Code follows consistent formatting (quote style, indentation, line length)
   - `pnpm format` and `biome fix --write` produce idempotent output
   - IDE auto-formats on save (VSCode settings provided)

3. ✅ **Stricter Type Safety** - Eliminate `as any` casts and unnecessary type assertions
   - Audit discovers all `as any` occurrences and categorizes them
   - High-priority casts replaced with proper branded types or discriminated unions
   - TypeScript strict mode flags enabled incrementally per package
   - `noImplicitAny`, `noUncheckedIndexedAccess` enforced in api, infrastructure, domain
   - New code prevents `as any` (documented rule in CLAUDE.md)

4. ✅ **Long-term Sustainability** - Architecture patterns and governance
   - Type safety patterns documented in CLAUDE.md (branded types, discriminated unions, Effect schemas)
   - Import strategy documented (which packages import from which)
   - Code review guidelines updated (no new `as any` without documented exception)
   - All developers understand patterns and can implement confidently

5. 📋 **Testing & Validation** - All existing tests pass
   - Unit tests: 100% pass rate for all packages
   - Integration tests: Analyzer/Scorer pipeline validates (Story 2.3 complete)
   - No regressions from refactoring changes
   - CI/CD pipeline (GitHub Actions) validates all changes

6. 📚 **Documentation & Learning**
   - CLAUDE.md updated with complete import strategy and type safety patterns
   - ARCHITECTURE.md includes strict mode configuration rationale
   - Story file includes decision log for future reference
   - Developers can onboard faster with clear patterns

---

## Technical Architecture

### Phase 1: Foundation (Biome Auto-Fix Setup) - ~3 hours

**Goal:** Enable automatic linting fixes to eliminate 70% of warnings

**Key Changes:**
- Add `biome fix --write` to pre-commit hook (git commit stage)
- Enable `useImportType` auto-fix in root `biome.json` configuration
- Configure Biome rule severity levels (error for critical, warn for guidance)
- Create script `pnpm lint:fix` for manual run across entire monorepo
- Update CI/CD to validate auto-fixes are applied

**Files to Modify:**
- `.git/hooks/pre-commit` or `simple-git-hooks.json` (add biome fix step)
- `packages/lint/biome.json` (enable useImportType auto-fix + other rules)
- `package.json` scripts (add `lint:fix` command)
- `.github/workflows/*.yml` (validate auto-fixes)

**Why This Phase First:**
- Quick feedback loop - run once, see immediate results
- Unblocks developers - reduces linting noise
- No risk - auto-fix only modifies safely auto-fixable patterns
- Establishes pattern for other phases

### Phase 2: Module Resolution (tsconfig Paths) - ~2 hours

**Goal:** Enable bare imports across entire monorepo without `.js` extensions

**Key Changes:**
- Consolidate root `tsconfig.json` with unified `baseUrl: "."` and `paths` mapping
- Define `@workspace/*` to resolve packages and apps correctly
- Per-package `tsconfig.json` with overrides for specific needs (frontend bundler vs backend Node.js)
- Run codemod to strip all `.js` extensions from imports (one-time change)
- Add Biome linting rule to prevent new `.js` imports

**Files to Modify:**
- `tsconfig.json` (root) - add `baseUrl` and `paths` configuration
- `packages/*/tsconfig.json` (per-package) - extend root, add specific overrides
- `apps/*/tsconfig.json` (per-app) - extend root, add build-specific config
- All import statements across monorepo (~200+ files) - strip `.js` extensions
- `packages/lint/biome.json` - add rule preventing `.js` imports

**Module Resolution Pattern:**
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@workspace/domain": ["packages/domain/src"],
      "@workspace/contracts": ["packages/contracts/src"],
      "@workspace/database": ["packages/database/src"],
      "@workspace/infrastructure": ["packages/infrastructure/src"],
      "@workspace/ui": ["packages/ui/src"],
      "@workspace/lint": ["packages/lint"]
    },
    "moduleResolution": "bundler"
  }
}
```

**Why Phase 2:**
- Foundational for all subsequent work
- Codemod makes it automated (not manual)
- Linter prevents regression
- Unblocks developers who find `.js` imports confusing

### Phase 3: Type Safety Audit & Categorization - ~1 hour

**Goal:** Discover which `as any` casts are fixable and prioritize them

**Key Changes:**
- Script to find all `as any` occurrences with context (file, line, surrounding code)
- Categorize each cast:
  - Circular dependency (architecture issue)
  - Complex generic (needs better typing)
  - Unknown external API (needs Schema validation)
  - Time pressure (quick fix, needs refactoring)
  - Legitimate exception (document and accept)
- Create spreadsheet with priority ratings (high/medium/low)
- Plan which ones to fix this sprint vs. future sprints

**Files to Create:**
- `_bmad-output/implementation-artifacts/as-any-audit.csv` (or .md table)
- `as-any-casts/` directory with one file per cast showing context + fix strategy

**Why Phase 3:**
- Prevents attack-at-all-once approach (overwhelming)
- Prioritization focuses effort on highest-impact fixes
- Reveals patterns (circular deps vs. typing issues vs. time pressure)
- Informs architecture decisions for future epics

### Phase 4: Type Safety Improvements & Governance - ~2 hours

**Goal:** Fix high-priority `as any` casts and establish sustainable patterns

**Key Changes:**
- Enable TypeScript strict mode flags incrementally:
  - `noImplicitAny: true` (catch implicit any)
  - `noUncheckedIndexedAccess: true` (enforce index safety)
  - `exactOptionalPropertyTypes: true` (undefined vs. missing distinction)
- Create type-safe utilities for common patterns:
  - Branded types for IDs (SessionId, UserId, etc.)
  - Discriminated unions for result types (Success | Failure)
  - Schema transformations for external API responses
- Replace 5-10 high-priority casts with proper types
- Document patterns in CLAUDE.md

**Files to Modify:**
- `packages/domain/tsconfig.json` - enable strict flags
- `packages/infrastructure/tsconfig.json` - enable strict flags (with exceptions)
- `apps/api/tsconfig.json` - enable strict flags (with exceptions)
- Create `packages/domain/src/types/branded.ts` - branded type utilities
- Update `CLAUDE.md` with patterns section

**Why Phase 4:**
- Builds on foundation from Phases 1-3
- Enables others to follow patterns
- Creates reusable utilities
- Long-term sustainability

---

## Dependencies & Architecture Decisions

### Critical Dependencies

**From Prior Stories:**
- Story 2.3 (Analyzer & Scorer) - Schema transformations with proper typing must follow patterns established here
- Story 2.6 (Effect + Vitest migration) - Type safety patterns used in test layer design
- Story 1.6 (Effect/Platform HTTP) - HTTP contract typing must use strict patterns

**From Architecture:**
- `packages/lint/biome.json` - Single source of truth for linting rules across monorepo
- `tsconfig.json` - Root configuration for TypeScript compilation across all packages/apps
- `packages/domain` - Contains type utilities that other packages depend on

**External Constraints:**
- TypeScript 5.7.3+ required for some type features (already installed)
- Biome 1.10+ required for `useImportType` auto-fix support (already installed)
- Node.js 20+ for modern module resolution (already required by project)

### Architecture Compliance

**Hexagonal Architecture Impact:**
- Domain layer (packages/domain): Highest strictness - establishes canonical patterns
- Infrastructure layer (packages/infrastructure): Medium strictness - implements patterns
- Handlers (apps/api/src/handlers): Medium strictness - thin adapters following domain patterns
- Use-cases (apps/api/src/use-cases): High strictness - pure business logic must be type-safe

**Effect-ts Integration:**
- Schema transformations in infrastructure layer follow `AFromB` naming convention
- Effect.Effect type parameters must be explicit (no implicit any)
- FiberRef dependency injection must be properly typed
- Layer composition depends on proper type inference

---

## Implementation Strategy

### Step 1: Biome Auto-Fix (HIGHEST IMPACT, QUICKEST)

1. Update `packages/lint/biome.json`:
   - Enable `useImportType: "fix"`
   - Set `importSort` order for consistency
   - Configure line length to 100 characters consistently

2. Integrate into pre-commit hook:
   ```bash
   # In simple-git-hooks.json
   "pre-commit": "biome fix --write && git add"
   ```

3. Run once across monorepo:
   ```bash
   pnpm format
   pnpm lint:fix
   ```

4. Commit changes:
   ```bash
   git add -A
   git commit -m "style: apply biome auto-fixes across monorepo"
   ```

### Step 2: Module Resolution (FOUNDATION)

1. **Create consolidated tsconfig.json:**
   ```json
   {
     "compilerOptions": {
       "baseUrl": ".",
       "paths": {
         "@workspace/domain": ["packages/domain/src"],
         "@workspace/contracts": ["packages/contracts/src"],
         "@workspace/database": ["packages/database/src"],
         "@workspace/infrastructure": ["packages/infrastructure/src"],
         "@workspace/ui": ["packages/ui/src"]
       },
       "moduleResolution": "bundler"
     }
   }
   ```

2. **Create codemod script to strip .js extensions:**
   - Use node-glob to find all `.ts`, `.tsx` files
   - Replace import statements: `from "something.js"` → `from "something"`
   - Test on sample files first

3. **Add Biome linting rule:**
   ```json
   {
     "linter": {
       "rules": {
         "style": {
           "noImplicitImportExtension": "error"
         }
       }
     }
   }
   ```

4. **Validate with TypeScript:**
   ```bash
   tsc --noEmit
   ```

### Step 3: Audit `as any` Casts

1. **Script to find all casts:**
   ```bash
   grep -r "as any" apps/ packages/ --include="*.ts" --include="*.tsx" | tee as-any-casts.txt
   ```

2. **Categorize each occurrence:**
   - Note file, line number, context (5 lines before/after)
   - Classify: circular-dep | complex-generic | external-api | time-pressure | legitimate
   - Estimate fix difficulty: 1 hour | 2-3 hours | 1 day | not-fixable

3. **Create tracking spreadsheet:**
   - Columns: File | Line | Category | Difficulty | Priority | Planned Fix
   - Sort by priority to identify quick wins

### Step 4: Implement Strict Type Safety

1. **Enable strict flags per package:**
   ```json
   {
     "compilerOptions": {
       "noImplicitAny": true,
       "noUncheckedIndexedAccess": true,
       "exactOptionalPropertyTypes": true
     }
   }
   ```

2. **Create branded type utilities** (packages/domain/src/types/branded.ts):
   ```typescript
   // Type-safe branded IDs
   export type UserId = string & { readonly __brand: "UserId" };
   export type SessionId = string & { readonly __brand: "SessionId" };

   // Utility to create branded values
   export const makeUserId = (value: string): UserId => value as UserId;
   ```

3. **Replace 5-10 high-priority casts:**
   - Example: Change `const result = response as AnalyzerResponse;`
   - To: Use Schema validation with Effect.Schema.decodeUnknown

4. **Document in CLAUDE.md:**
   - Add "Type Safety Patterns" section
   - Show examples of branded types, discriminated unions, Schema transformations
   - Document when `as` is acceptable (only at layer boundaries as documented escape hatch)

---

## File & Code Changes

### Configuration Files to Modify

| File | Change | Rationale |
|------|--------|-----------|
| `tsconfig.json` | Add `baseUrl`, `paths`, `moduleResolution: "bundler"` | Enable bare imports |
| `packages/lint/biome.json` | Enable `useImportType: "fix"`, `importSort`, `lineWidth: 100` | Auto-fix linting |
| `packages/domain/tsconfig.json` | Enable `noImplicitAny`, `noUncheckedIndexedAccess` | Strict typing for domain |
| `packages/infrastructure/tsconfig.json` | Enable strict flags with exceptions noted | Enforce patterns in impl |
| `apps/api/tsconfig.json` | Enable strict flags with exceptions noted | Enforce in business logic |
| `.git/hooks/pre-commit` or `simple-git-hooks.json` | Add `biome fix --write` step | Auto-fix before commit |
| `CLAUDE.md` | Add "Type Safety Patterns" and "Import Strategy" sections | Developer reference |

### Code Changes

**Imports to Fix (Automated via Codemod):**
- ~200+ files contain `.js` extensions - all will be stripped
- Example: `import { analyzeFacets } from "@workspace/infrastructure/repositories/analyzer.claude.repository.js"`
- Becomes: `import { analyzeFacets } from "@workspace/infrastructure/repositories/analyzer.claude.repository"`

**Type Utilities to Create:**
- `packages/domain/src/types/branded.ts` - Branded type patterns
- `packages/domain/src/types/discriminated-union.ts` - Result/Error pattern
- `packages/infrastructure/src/types/schema-helpers.ts` - Schema transformation utilities

**`as any` Casts to Fix (High Priority):**
- Inventory will reveal top 5-10 to fix this sprint
- Examples might include: API response casting, complex Effect type narrowing, external library integration

---

## Dev Notes

### Key Architecture Patterns

**Module Resolution:**
- All package imports use `@workspace/{package}` prefix
- No relative imports across package boundaries (enforced by linter + TypeScript)
- Source root per package: `src/` directory (tsconfig `baseUrl` relative to root)

**Type Safety in Effect-ts:**
- Use Effect.Schema for external data validation, not `as any`
- Leverage Effect.Schema transformations for type-safe conversions
- FiberRef declarations must include full type parameters (no implicit any)

**Naming Conventions:**
- Branded types: `UserId`, `SessionId`, etc. (not `USER_ID_TYPE`)
- Schema transformations: `AFromB` (e.g., `FacetEvidenceFromClaudeResponse`)
- Error types: Extend TaggedException for Effect integration

### Testing Requirements

**Minimal Testing for This Story:**
- TypeScript build succeeds: `tsc --noEmit` across all packages (no type errors)
- All existing tests pass: `pnpm test:run` (no regressions)
- Linting passes: `pnpm lint` (all rules satisfied)
- No `.js` imports in codebase: custom lint rule validates

**No New Feature Tests Needed:**
- This is a refactoring story (improves code quality, not functionality)
- Existing test suites validate the changes don't break behavior

### Project Structure Notes

**Monorepo Layout - No Changes to Structure:**
```
apps/api/src/handlers/        → Thin HTTP adapters
apps/api/src/use-cases/       → Business logic (must use strict typing)
packages/domain/src/          → Repository interfaces, types (strictest)
packages/infrastructure/src/  → Repository implementations (strict)
packages/contracts/src/       → HTTP contracts (strict)
packages/lint/                → Shared Biome config (single source of truth)
```

**TypeScript Config Inheritance:**
- Root `tsconfig.json`: Base configuration (paths, moduleResolution)
- Package-level `tsconfig.json`: Extends root, adds specific rules (strict mode levels)
- No duplication - each level extends parent, overrides selectively

---

## Previous Story Intelligence

**Story 2.6 - Migrate to Effect + Vitest (Just Completed):**
- Consolidated Effect version to 3.19+ across all packages
- Centralized vitest configuration in root
- Established test layer pattern with TestRepositoriesLayer
- Learning: Type inference in test layers must be explicit to support strict mode

**Story 2.3 - Analyzer & Scorer Implementation (Just Completed):**
- Used Effect.Schema transformations for validation (AFromB pattern)
- Cast only at repository boundary (repository.ts:line 309) where interface requires it
- Demonstrates: schema transformations eliminate most `as` casts if patterns followed

**Story 2.2 - Nerin Agent Setup (Earlier):**
- Established context for LLM integration
- ChatAnthropic type safety relies on proper generics
- Learning: Strong typing here prevents downstream Effect pipeline issues

---

## Git Intelligence

**Recent Commits (Last 5):**
```
6ac7e94 style(schema): Sort imports alphabetically
f09c42f feat(db): Add default values of 0 for score and confidence columns
0179e7f refactor(logger): Simplify logger methods to return void
7991ac7 fix(2.3): Resolve TypeScript build errors and type system inconsistencies
69a900c feat(2.3): Evidence-based Analyzer and Scorer Implementation
```

**Pattern Analysis:**
- Recent work shows TypeScript type system being tightened (fix commit 7991ac7)
- Schema files being organized (alphabetical imports = Biome fixing at work)
- This story completes the type-safety improvements started in 2.3

**Code Patterns Established:**
- Effect.Schema transformations for validation (from 2.3)
- Clean facet naming conventions (from 2.3 - "imagination", not "openness_imagination")
- Repository layer boundary as safe cast location (from infrastructure refactoring)

---

## Latest Tech Information

**TypeScript 5.7.3+ (Current):**
- Strict mode flags stable and recommended
- Branded types fully supported (using `& { readonly __brand }` pattern)
- Module resolution "bundler" recommended for monorepo projects
- Breaking change: optional properties now properly typed (exactOptionalPropertyTypes)

**Biome 1.10+ (Current):**
- `useImportType` auto-fix now stable and reliable
- Pre-commit hook integration well-supported
- Import sorting standardized (consistency across team)

**Effect-ts 3.19+ (Current):**
- Schema transformations (S.transform) for validation strongly encouraged
- FiberRef type parameters must be explicit (no inference)
- Layer composition relies on proper Effect.Effect type annotations
- Context.Tag properly typed for DI containers

---

## Implementation Checklist

### Pre-Implementation
- [ ] Review brainstorming session results (62 ideas generated)
- [ ] Understand Phase 1-4 breakdown (4-phase rollout)
- [ ] Identify which `as any` casts are high-priority
- [ ] Verify all tools installed (TypeScript 5.7.3+, Biome 1.10+, Node 20+)

### Phase 1: Biome Auto-Fix (3 hours)
- [ ] Update `packages/lint/biome.json` with useImportType fix + rules
- [ ] Integrate biome fix into pre-commit hook
- [ ] Create `pnpm lint:fix` script
- [ ] Run across monorepo: `pnpm lint:fix`
- [ ] Commit: "style: apply biome auto-fixes across monorepo"
- [ ] Validate: All tests still pass, no regressions

### Phase 2: Module Resolution (2 hours)
- [ ] Create consolidated `tsconfig.json` with baseUrl + paths
- [ ] Update package-level `tsconfig.json` files to extend root
- [ ] Create codemod script to strip `.js` extensions
- [ ] Run codemod on all files (~200 imports)
- [ ] Add Biome linting rule preventing `.js` imports
- [ ] Validate: `tsc --noEmit` succeeds, `pnpm test:run` passes
- [ ] Commit: "refactor: migrate to bare imports without .js extensions"

### Phase 3: Type Safety Audit (1 hour)
- [ ] Script to find all `as any` occurrences
- [ ] Export to CSV/markdown with context
- [ ] Categorize each cast (circular-dep, complex-generic, etc.)
- [ ] Prioritize by fixability + impact
- [ ] Document in `_bmad-output/implementation-artifacts/as-any-audit.md`

### Phase 4: Type Safety Improvements (2 hours)
- [ ] Enable strict flags in domain/infrastructure/api tsconfig files
- [ ] Create `packages/domain/src/types/branded.ts` (branded type utilities)
- [ ] Fix 5-10 high-priority `as any` casts
- [ ] Replace with proper types (branded types, Schema validation, etc.)
- [ ] Update `CLAUDE.md` with "Type Safety Patterns" section
- [ ] Document import strategy in `CLAUDE.md`
- [ ] Validate: `tsc --noEmit` succeeds, all tests pass

### Final Validation
- [ ] Run full test suite: `pnpm test:run` (all 115+ tests pass)
- [ ] Validate linting: `pnpm lint` (no warnings or errors)
- [ ] TypeScript compile check: `tsc --noEmit` (all packages)
- [ ] Update sprint status to "done"
- [ ] All acceptance criteria met

---

## References & Sources

**Brainstorming Session Document:**
- Source: `_bmad-output/brainstorming/brainstorming-session-2026-02-02.md`
- 62 ideas generated across 4 goals
- Recommended sequence: Biome (quick feedback) → Paths (foundation) → Audit (discovery) → Improvements (sustainability)

**Architecture Documentation:**
- Source: `docs/ARCHITECTURE.md` - Hexagonal architecture patterns
- Source: `CLAUDE.md` - Project conventions and setup
- Strict typing expectations for domain layer

**TypeScript Configuration:**
- Source: `tsconfig.json` - Current root configuration
- Source: `packages/*/tsconfig.json` - Per-package overrides

**Linting Configuration:**
- Source: `packages/lint/biome.json` - Single source of truth for rules
- Source: `.git/hooks/pre-commit` - Git hook integration point

**Type Safety Examples:**
- Source: `packages/infrastructure/src/repositories/analyzer.claude.repository.ts:150-175` - Schema transformation pattern (AFromB)
- Source: `apps/api/src/use-cases/save-facet-evidence.use-case.ts:43-95` - Type validation pattern

---

## Completion Notes

### Before Dev Work

**Questions for Clarification (If Needed):**
1. Should `noImplicitAny: true` be applied to all packages or only domain/infrastructure?
   - **Answer:** Apply to all; use `// @ts-expect-error` sparingly for documented exceptions
2. Is there a preference for branded types vs. branded type factories?
   - **Answer:** Use `make*` factories for consistency with existing patterns
3. Should `as any` exceptions require approval before merge?
   - **Answer:** Yes - documented in code + noted in PR description

### Status Tracking

**Ready for Dev Agent:** YES
**Key Blocker:** None (all dependencies met)
**Estimated Implementation Time:** 8 hours total (4 phases, 2-3 hours each)
**Can Parallelize With:** Stories 2.4, 2.5 (orthogonal changes)
**Blocks:** None immediately; improves DX for Epics 3-6 development

---

## Dev Agent Record

### Agent Model Used
Claude Haiku 4.5 (created via story creation workflow)

### Debug Log References
- Brainstorming session analysis: `/Users/vincentlay/Projects/big-ocean/_bmad-output/brainstorming/brainstorming-session-2026-02-02.md`
- Sprint status before story creation: `/Users/vincentlay/Projects/big-ocean/_bmad-output/implementation-artifacts/sprint-status.yaml`
- Epic 2 context: `/Users/vincentlay/Projects/big-ocean/_bmad-output/planning-artifacts/epics.md` (lines 293-677)

### Completion Notes List
- Story created based on 62 brainstorming ideas (4 goals: module resolution, unified typing, type safety, long-term architecture)
- 4-phase implementation strategy established (quick wins → foundation → discovery → sustainability)
- All acceptance criteria mapped to specific code changes and phases
- High-priority `as any` casts will be discovered via audit phase before fixes attempted
- Architecture patterns already demonstrated in Story 2.3 (schema transformations) and 2.6 (Effect/vitest migration)

### File List
**Files to Create:**
- `packages/domain/src/types/branded.ts` - Branded type utilities
- `packages/domain/src/types/discriminated-union.ts` - Result/Error pattern (optional)
- `_bmad-output/implementation-artifacts/as-any-audit.md` - Cast audit spreadsheet (during Phase 3)

**Files to Modify:**
- `tsconfig.json` - Add baseUrl + paths
- `packages/*/tsconfig.json` - Enable strict mode flags
- `apps/*/tsconfig.json` - Enable strict mode flags
- `packages/lint/biome.json` - Enable auto-fixes + import rules
- `simple-git-hooks.json` or `.git/hooks/pre-commit` - Add biome fix
- `CLAUDE.md` - Add type safety patterns section
- ~200 source files - Strip `.js` from imports (via codemod)

**Expected Test Coverage:**
- No new feature tests needed (refactoring story)
- Validation: Existing tests all pass (115+ tests)
- Validation: TypeScript compilation succeeds
- Validation: Linting passes cleanly

---

**This story is READY FOR DEVELOPMENT.**
Next step: Run `dev-story 2-7` to begin implementation with development agent.
