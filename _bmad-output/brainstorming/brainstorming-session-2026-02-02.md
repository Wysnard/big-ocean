---
stepsCompleted: [1, 2, 3]
inputDocuments: []
session_topic: 'Improving TypeScript compilation, linting, and code quality in the big-ocean monorepo'
session_goals: 'Module Resolution (bare imports without .js), Unified Typing & Auto-Formatting, Stricter Type Safety (eliminate as any casts), Long-term Architectural Improvements'
selected_approach: 'AI-Recommended Techniques'
techniques_used: ['Root Cause Analysis', 'Constraint Mapping', 'Pattern Inventory', 'Decision Framework', 'Quick Wins Analysis']
ideas_generated: 62
context_file: ''
---

# Brainstorming Session Results

**Facilitator:** Vincentlay
**Date:** 2026-02-02

## Session Overview

**Topic:** Improving TypeScript compilation, linting, and code quality in the big-ocean monorepo

**Goals:**
1. **Module Resolution** - Remove `.js` extensions from imports (use bare specifiers for packages/apps)
2. **Unified Typing & Formatting** - Consistent code style, auto-fix linting issues (especially `useImportType` warnings), auto-format code according to rules
3. **Stricter Type Safety** - Eliminate `as any` casts and unnecessary type assertions, catch bugs via stronger typing
4. **Long-term Architecture** - Architectural improvements (not just quick fixes) within 1 day

**Timeline:** 1 day

### Context Guidance

Your monorepo has:
- TypeScript + Effect-ts for functional programming
- Biome for linting/formatting
- Multiple apps (front, api) and packages (domain, contracts, infrastructure, ui, etc.)
- Current pain points: manual import management, unresolved linting warnings, type casting workarounds

---

## Phase 0: Story Creation (Implementation Planning)

**Status:** ✅ COMPLETE

A comprehensive user story (**2.7: TypeScript Compilation, Linting, and Code Quality**) has been created based on these brainstorming results.

**Story File:** `_bmad-output/implementation-artifacts/2-7-typescript-compilation-linting-code-quality.md`

**Story Status:** ready-for-dev

**4-Phase Implementation Plan Embedded in Story:**
1. **Biome Auto-Fix Setup** (3 hours) - Auto-fix linting rules, highest immediate impact
2. **Module Resolution** (2 hours) - Bare imports without .js extensions
3. **Type Safety Audit** (1 hour) - Discover and categorize `as any` casts
4. **Type Safety Improvements** (2 hours) - Fix high-priority casts, establish patterns

**Next Step:** Run `dev-story 2-7` to begin implementation

---

## Phase 1: Recommended Techniques (AI-Selected)

Based on your goals, the following 3-phase technique sequence will maximize idea generation and implementation viability:

### Phase 1A: Foundation & Diagnosis (Root Cause Analysis)
**Why:** Understand why current pain points exist before generating solutions
**Application:** For each pain point (manual imports, linting warnings, type casting), identify:
- Where it originates (build config, tooling, developer workflow?)
- Why it persists (enforcement gap? lack of automation? architectural pattern?)
- What blocks its resolution (time, complexity, tooling limitations?)

**Questions to answer:**
1. Where are `.js` imports coming from? (modules, build artifacts, developer habit?)
2. Why aren't linting auto-fixes applied automatically? (config issue? conflict with code style?)
3. What circumstances lead developers to use `as any`? (circular dependencies? complex generics? time pressure?)

### Phase 1B: Constraint & Opportunity Mapping
**Why:** Identify what's actually possible and what creates friction
**Application:** For each goal, map:
- **Constraints** - What limits solutions (compatibility, existing patterns, 1-day timeline)
- **Opportunities** - What can be leveraged (Biome capabilities, TypeScript strict mode, Effect-ts patterns)
- **Quick Wins** - What solves 80% with 20% effort (high leverage initiatives)

**Key mapping areas:**
- TypeScript compiler options (tsconfig consolidation strategy)
- Biome configuration (rule enforcement and auto-fix strategy)
- Monorepo structure (dependency boundaries that enable/prevent solutions)
- Developer workflow (how changes integrate into existing practices)

### Phase 2: Divergent Ideation (Goal-Specific Techniques)

#### Goal 1: Module Resolution (Bare Imports)
**Technique: Import Pattern Inventory + Configuration Audit**
- Audit: Which imports use `.js` vs. bare specifiers? (grep across codebase)
- Analysis: Do patterns follow package vs. internal app logic?
- Solution angles:
  - tsconfig `paths` configuration with proper baseUrl
  - Unified import strategy (packages always bare, apps always bare, etc.)
  - Linter rule enforcement (prevent .js extensions)
  - Automated rewriting (codemods to fix existing imports)

#### Goal 2: Unified Typing & Formatting
**Technique: Linting Rule Audit + Auto-Fix Pipeline Design**
- Current state: Which rules trigger warnings? (especially useImportType)
- Root cause: Why aren't auto-fixes applied? (manual process? conflicts?)
- Design: Automated pipeline (git hook → biome fix → format → commit)
- Strategy: Categorize rules by type (fixable vs. manual, essential vs. nice-to-have)
- Implementation angles:
  - Biome rule severity levels (error vs. warn)
  - Pre-commit hooks for auto-fix
  - IDE settings for auto-format on save
  - Rule prioritization (fix useImportType first, then others)

#### Goal 3: Stricter Type Safety
**Technique: Type Casting Inventory + Strict Mode Roadmap**
- Audit: Find all `as any` and categorize why (circular deps? complex generics? time pressure?)
- Analysis: Which categories are fixable? Which need architectural changes?
- Gradual approach:
  - Enable stricter tsconfig flags incrementally (noImplicitAny, noUncheckedIndexedAccess)
  - Replace casts with proper types (branded types, discriminated unions, overloads)
  - Refactor patterns causing casts (Effect type inference, generic constraints)
  - Create type utilities library for common patterns

#### Goal 4: Long-term Architecture
**Technique: Architectural Decision Framework + Implementation Roadmap**
- Strategy questions:
  - Should monorepo have unified tsconfig or per-package configs?
  - How to enforce type safety without breaking existing patterns?
  - What's the sustainable approach to linting (per-package rules? unified rules?)
  - How does Effect-ts functional style influence type safety patterns?
- Implementation roadmap (1-day feasible):
  - Consolidate tsconfig (root + specific overrides per package)
  - Create type-safe patterns guide (using Effect, branded types, discriminated unions)
  - Establish linting governance (which rules are non-negotiable?)
  - Define import strategy (packages/apps clear separation)

### Phase 3: Convergent Planning (Quick Wins + Roadmap)

**High-Leverage Initiatives (can execute in 1 day):**

| Initiative | Goal | Effort | Impact | Timeline |
|-----------|------|--------|--------|----------|
| Biome auto-fix + git hook | Goal 2 | 2 hours | Fixes 70% of linting issues automatically | 2-3 hours |
| tsconfig path consolidation | Goal 1 | 2 hours | Enables bare imports across monorepo | 2-3 hours |
| Find & categorize `as any` casts | Goal 3 | 1 hour | Reveals which casts are fixable | 1 hour |
| Type safety patterns guide | Goal 4 | 2 hours | Establishes sustainable patterns | 2-3 hours |

**Recommended execution sequence:**
1. **Hour 1-3:** Biome auto-fix setup + git hooks (Goal 2 - quick feedback)
2. **Hour 3-5:** tsconfig paths consolidation (Goal 1 - unblocks imports)
3. **Hour 5-6:** Cast audit & categorization (Goal 3 - informs next steps)
4. **Hour 6-8:** Type safety patterns + architectural guide (Goal 4 - long-term sustainability)

---

## Generated Ideas (62 Total)

### Goal 1: Module Resolution (Bare Imports without .js) - 16 Ideas

**Configuration & Setup (6 ideas)**
1. Consolidate root tsconfig with `baseUrl: "."` and `paths: { "@workspace/*": ["packages/*/src", "apps/*/src"] }`
2. Use tsconfig `compilerOptions.moduleResolution: "bundler"` for Node.js 16+ native ESM support
3. Add per-package tsconfig.json overrides for edge cases (frontend bundler vs backend Node.js)
4. Create shared tsconfig base in `packages/typescript-config` that all packages extend
5. Configure TypeScript to emit `.mts` files for monorepo re-exports without .js suffixes
6. Add Biome override in packages with mixed import patterns to enforce consistency gradually

**Tooling & Automation (5 ideas)**
7. Create ESLint/Biome rule: disallow imports ending with `.js` (flag as error, auto-fixable)
8. Write codemod to automatically strip `.js` from all imports (run once, then prevent regression)
9. Add git pre-commit hook to catch new `.js` imports before they enter codebase
10. Configure IDE (VSCode) with import alias resolution so developers see bare imports as natural
11. Create script to audit codebase: `pnpm audit:imports` → report all `.js` imports with file locations

**Process & Patterns (5 ideas)**
12. Document monorepo import strategy: "packages always @workspace/X, apps always @workspace/X from packages only"
13. Add linter warning comment to TypeScript error in build: "use bare specifiers: remove .js extension"
14. Create import guide in CLAUDE.md showing patterns for each layer (domain, infrastructure, handlers)
15. Set up Turbo cache key for import resolution to track when `.js` imports break builds
16. Update CI/CD to fail builds on `.js` imports (enforcement via GitHub Actions)

---

### Goal 2: Unified Typing & Formatting (Auto-Fix Linting) - 18 Ideas

**Biome Configuration (7 ideas)**
17. Add `biome fix --write` to pre-commit hook to auto-fix all fixable issues before commit
18. Set useImportType rule to "error" with auto-fix enabled in root biome.json
19. Configure Biome to rewrite imports: `import type { X }` when X is type-only
20. Add Biome rule: convert all var/const to const when safe (immutability first)
21. Configure Biome quote style to match Effect-ts conventions (double quotes preferred)
22. Set Biome line length to consistent value across all packages (suggest 100 or 120)
23. Add Biome rule: sort object properties alphabetically (consistency in schema definitions)

**Developer Workflow (6 ideas)**
24. Create `.vscode/settings.json` with editor.formatOnSave: true and defaultFormatter: biomejs.biome
25. Add script `pnpm format:check` to validate code follows Biome rules (run in CI)
26. Document in README: "VSCode auto-formats on save via Biome" (reduce manual formatting)
27. Create pre-push hook that runs `biome fix` on staged files if not already formatted
28. Set up IDE snippet: auto-add `import type` for type-only imports (developer habit)
29. Create "fix all issues" script: `pnpm lint:fix` → runs across entire monorepo

**Type Consistency (5 ideas)**
30. Enforce consistent import order across packages: internal → external → types
31. Add Biome rule to detect circular dependencies and warn during linting
32. Create TypeScript type-checking pass in CI that runs `tsc --noEmit` on all packages
33. Add noUnusedLocals and noUnusedParameters to strict tsconfig (caught by useImportType)
34. Establish "no wildcard imports" rule: explicit imports only (easier to track type usage)

---

### Goal 3: Stricter Type Safety (Eliminate `as any` Casts) - 16 Ideas

**Audit & Analysis (5 ideas)**
35. Script to find all `as any` occurrences: categorize by reason (circular?, complex?, unknown-upstream?)
36. Create spreadsheet: each `as any` with context, category, and difficulty-to-fix rating
37. Identify patterns: are specific files or patterns most prone to casts? (effects? schemas? APIs?)
38. Analyze: which `as any` casts are in tests vs. production code? (tests need less strictness?)
39. Document: for each cast, add comment explaining why it exists and what would fix it

**TypeScript Configuration (5 ideas)**
40. Enable `noImplicitAny: true` (migrate casts to proper types, gradual adoption per package)
41. Enable `noUncheckedIndexedAccess: true` (prevents unsafe array/object access patterns)
42. Add `noPropertyAccessFromIndexSignature: true` (enforce explicit property access)
43. Enable `exactOptionalPropertyTypes: true` (undefined vs. missing property distinction)
44. Configure `"strict": true` incrementally per package (api first, then infrastructure, then domain)

**Pattern & Type Design (6 ideas)**
45. Create Effect-ts type utilities for common patterns: `toPromise<T>`, `fromUnknown<T>`, etc.
46. Use branded types for IDs: `type SessionId = string & { readonly __brand: "SessionId" }`
47. Create discriminated unions for error handling instead of casting (type safety at compile-time)
48. Leverage Effect.Schema for validation: replace runtime `as any` with schema validation + types
49. Document "when to use overloads" pattern for functions with multiple signatures
50. Create type-safe API response mapper: eliminate `response as any` via Schema transforms

---

### Goal 4: Long-term Architecture (Improvements within 1 Day) - 12 Ideas

**Architecture & Governance (5 ideas)**
51. Create `ARCHITECTURE-DECISIONS.md` documenting: module resolution strategy, type safety approach, import patterns
52. Establish "type safety council" rules: no new `as any` without documented exception + plan to fix
53. Define per-package strictness levels: domain (highest) → infrastructure (medium) → api (medium)
54. Document monorepo dependency boundaries: what can depend on what (enforce via linting)
55. Create sustainability checklist: "before each commit, verify: types pass, linting passes, tests pass"

**Scalable Patterns (4 ideas)**
56. Build Effect-ts pattern library documenting recommended patterns for type-safe effect programs
57. Create schema validation guide: when to use Effect.Schema vs. runtime validation vs. type-only
58. Document generic pattern: how to write generic functions that don't fall back to `any`
59. Establish testing patterns: unit tests for effects, integration tests for repositories

**Organizational (3 ideas)**
60. Add to onboarding guide: "no `as any` without approval; use proper types or escalate"
61. Schedule weekly "type safety review" to discuss new casts and refactoring opportunities
62. Create "quick reference" poster: Common Type Patterns (branded types, discriminated unions, overloads)
