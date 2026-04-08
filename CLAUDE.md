# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Rules

Always use Context7 MCP when I need library/API documentation, code generation, setup or configuration steps without me having to explicitly ask.

When working on frontend code (`apps/front` or `packages/ui`), consult [FRONTEND.md](./docs/FRONTEND.md) for styling patterns, component conventions, and data attribute usage.

**Frontend API rule:** When fetching the backend from the frontend, always use the typed Effect `HttpApiClient` with `@workspace/contracts` — never raw `fetch`. See the [Frontend API Client Pattern](#frontend-api-client-pattern-effect-httpapiclient) below.

**Forms rule:** All forms must use `@tanstack/react-form` with shadcn/ui form components — never plain `useState` per field. Follow the [shadcn TanStack Form standard](https://ui.shadcn.com/docs/forms/tanstack-form#validation-modes) for structure and validation modes. Use Effect Schema (`@effect/schema`) for validation when needed.

**Navigation rule:** Use TanStack Router's `<Link>` component for all internal navigation — never raw `<a href>`, `window.location.href`, or `<button>` + `navigate()`. Reserve `useNavigate()` for programmatic navigation only (e.g., after form submission, auth redirects). See [TanStack Router navigation docs](https://tanstack.com/router/latest/docs/guide/navigation).

**Environment variables:** Check `.env` (local dev) and `.env.example` (template) for available environment variables before making assumptions about config values.

**Worktree isolation rule:** When running in a git worktree (e.g., spawned via `isolation: "worktree"`), ONLY read and modify files within the worktree directory. Do NOT access the main repository working tree unless the user explicitly asks you to.

**Related docs:** [COMMANDS.md](./docs/COMMANDS.md) | [DEPLOYMENT.md](./docs/DEPLOYMENT.md) | [NAMING-CONVENTIONS.md](./docs/NAMING-CONVENTIONS.md) | [API-CONTRACT-SPECIFICATION.md](./docs/API-CONTRACT-SPECIFICATION.md) | [FRONTEND.md](./docs/FRONTEND.md) | [E2E-TESTING.md](./docs/E2E-TESTING.md)

## Repository Overview

**big-ocean** is a psychological profiling platform built on the Big Five personality framework. Monorepo using Turbo + pnpm workspaces.

**Core Vision:** Conversational, coherence-based personality assessment via LLM agents → scientific research integration → memorable archetypes → social features for comparison and discovery.

**Node requirement:** >= 20
**Package manager:** pnpm@10.4.1

**Workspace packages:**

| Package | Path | Purpose |
|---------|------|---------|
| `front` | `apps/front` | React frontend (TanStack Router + Start, TanStack Query) |
| `api` | `apps/api` | Effect-ts HTTP API server |
| `@workspace/contracts` | `packages/contracts` | Shared API schemas, endpoint definitions, error re-exports |
| `@workspace/domain` | `packages/domain` | Business logic: use-cases, repository interfaces, domain types, errors |
| `@workspace/infrastructure` | `packages/infrastructure` | Drizzle repositories, LLM clients, external service adapters |
| `@workspace/ui` | `packages/ui` | Shared shadcn/ui component library |
| `@workspace/lint` | `packages/lint` | Shared Biome config |
| `@workspace/typescript-config` | `packages/typescript-config` | Shared tsconfig bases |

## Common Commands

```bash
pnpm install                # Install dependencies
pnpm dev                    # Start all services (front:3000, api:4000)
pnpm dev --filter=front     # Frontend only
pnpm dev --filter=api       # Backend only
pnpm build                  # Build all packages
pnpm typecheck              # Typecheck all packages (turbo)
pnpm test:run               # Run all tests
pnpm test:coverage          # Tests with coverage
pnpm test:e2e               # Run Playwright e2e tests
pnpm lint                   # Lint all packages
pnpm lint:fix               # Auto-fix lint issues
pnpm format                 # Format all code
pnpm db:migrate             # Apply Drizzle migrations
pnpm db:generate            # Generate migration from schema changes
pnpm seed:test-conversation # Seed test conversation data
```

For complete command reference, see [COMMANDS.md](./docs/COMMANDS.md).

### Quick Testing

```bash
pnpm dev                    # Auto-seeds database with test conversation
pnpm seed:test-conversation # Or seed manually
```

**What gets seeded:** Test user (see credentials in `scripts/seed-completed-conversation.ts`), completed conversation with 12 messages, 30 facet scores, 5 trait scores, ~40 evidence records.

### Integration Testing

```bash
pnpm test:integration       # Run all (auto Docker lifecycle)
pnpm docker:test:up         # Manual: start test env
pnpm docker:test:down       # Manual: stop and clean
```

**Ports:** Dev (API 4000, PG 5432) / Test (API 4001, PG 5433)
**LLM Mocking:** `MOCK_LLM=true` swaps real Claude for deterministic mock responses.
**Three-tier strategy:** Unit (mock repos) → Integration (Docker) → Real LLM ($$)

### Git Hooks

- **Pre-push:** lint + typecheck + tests — blocks push on failure
- **Commit-msg:** requires conventional commit format (`feat`, `fix`, `docs`, `chore`, `test`, `ci`, `refactor`, `perf`, `style`, `build`, `revert`)
- Managed by `simple-git-hooks` (installed automatically via `pnpm install`)

## Architecture Rules

The codebase follows **hexagonal architecture** (ports & adapters) with Effect-ts `Context.Tag` for dependency injection.

**Hard rules:**

- **No business logic in handlers** — all logic belongs in use-cases
- **Error Location:** HTTP errors defined in `domain/src/errors/http.errors.ts` (re-exported via `contracts/src/errors.ts`), infrastructure errors co-located with repo interfaces in `domain/src/repositories/`
- **Error Propagation:** Use-cases and handlers must NOT remap errors. Only allowed `catchTag` is fail-open resilience.
- **Derive-at-Read:** Trait scores, OCEAN codes, and archetypes are recomputed from facet scores at read time — never read stored aggregations. Facet scores are the single source of truth.

**Naming conventions:**

| Component | Pattern | Example |
|-----------|---------|---------|
| Repository Interface | `{entity}.repository.ts` in `domain/` | `assessment-message.repository.ts` |
| Repository Implementation | `{entity}.drizzle.repository.ts` in `infrastructure/` | `assessment-message.drizzle.repository.ts` |
| Live Layer Export | `{Entity}DrizzleRepositoryLive` | `AssessmentMessageDrizzleRepositoryLive` |
| Use-Case | `{action}.use-case.ts` | `send-message.use-case.ts` |
| Handler | `{domain}.ts` in `handlers/` | `assessment.ts` |

See [NAMING-CONVENTIONS.md](./docs/NAMING-CONVENTIONS.md) for branch naming, commit format, and more.

## Key Patterns

### Route Loader Auth Pattern

Check auth state in `beforeLoad` using `getSession()` from `@/lib/auth-client`:
```typescript
import { getSession } from "@/lib/auth-client";
import { redirect } from "@tanstack/react-router";

beforeLoad: async () => {
  const { data: session } = await getSession();
  if (!session?.user) {
    throw redirect({ to: "/login", search: { sessionId: undefined, redirectTo: undefined } });
  }
}
```

**Advanced:** If `beforeLoad` has a try/catch (e.g., for ownership checks that may fail), import `isRedirect` from `@tanstack/react-router` and re-throw redirects: `if (isRedirect(e)) throw e;` — see `/chat` route for example.

**Session ownership verification** (Story 9.4): Lives in `/chat` route's `beforeLoad`, not in `ChatAuthGate`.

### Frontend API Client Pattern (Effect HttpApiClient)

Frontend hooks must use the typed Effect `HttpApiClient` derived from `@workspace/contracts`, **not raw `fetch`**. The shared client setup lives in `apps/front/src/lib/api-client.ts`.

```typescript
import { useMutation } from "@tanstack/react-query";
import { Effect } from "effect";
import { makeApiClient } from "../lib/api-client";

export function useDeleteAccount() {
  return useMutation({
    mutationKey: ["account", "delete"],
    mutationFn: () =>
      Effect.gen(function* () {
        const client = yield* makeApiClient;
        return yield* client.account.deleteAccount({});
      }).pipe(Effect.runPromise),
  });
}
```

**Pattern:** `yield* makeApiClient` → `yield* client.<group>.<endpoint>({ ... })` → wrap in `Effect.runPromise` inside TanStack Query `mutationFn` / `queryFn`.

### OCEAN Code Generation

Pure deterministic function: 30 facet scores → 5-letter OCEAN code (e.g., "HHMHM").

**Algorithm:** Sum 6 facets per trait (0-120) → map to level (L/M/H) → concatenate OCEAN order.
**Thresholds:** 0-40=L, 40-80=M, 80-120=H

```typescript
import { generateOceanCode } from "@workspace/domain";
const code = generateOceanCode(facetScoresMap); // → "HHMHM"
```

### Database

- Drizzle ORM + PostgreSQL — migrations via `drizzle-kit`
- Docker: migrations run automatically on backend startup via `docker-entrypoint.sh`

**Migration rule:** When modifying the DB schema (`packages/infrastructure/src/db/drizzle/schema.ts`), always hand-write a corresponding migration SQL file following the Drizzle migration format (see existing files in `drizzle/` for reference). **NEVER modify an existing migration file** — always append a new migration. Existing migrations may already be applied to production or other developers' databases; modifying them causes migration journal mismatches and failures.

**Schema change cascade rule:** When modifying the DB schema, also check and update seed scripts (`scripts/seed-*.ts`), test fixtures (`**/__mocks__/**`, `**/fixtures/**`, `**/*.fixtures.ts`), and the local dev test user setup to match the new schema. Added/removed/renamed columns, new NOT NULL constraints, and enum changes will break seeding, tests, and local dev if not kept in sync.

## Testing Rules

**E2E standard:** When writing or reviewing Playwright E2E tests, follow the [E2E Testing Standard](./docs/E2E-TESTING.md). Key rules: E2E is only for critical multi-page journeys and access control boundaries — push everything else to integration or unit tests. Total suite must stay under 5 minutes. New specs must be self-contained (no dependency chains unless technically required).

**`data-testid` rule:** NEVER remove, replace, or rename `data-testid` attributes. They are used exclusively by e2e tests (Playwright). `data-slot` is a separate shadcn/ui concern — they coexist. See [FRONTEND.md](./docs/FRONTEND.md#testing-with-data-attributes).

**Route test files:** NEVER place test files (`.test.ts`, `.test.tsx`) directly in `apps/front/src/routes/`. TanStack Router treats all files in this directory as routes, causing build errors. Prefix with `-` (e.g., `-my-route.test.tsx`) to exclude from route generation, or place tests in a sibling `__tests__` directory.

### Mock Architecture (`__mocks__` + `vi.mock()`)

Mock implementations are co-located with repository implementations using Vitest's `__mocks__` auto-resolution.

**Rules:**
- Each `__mocks__` file exports the same Live layer name as the real module
- Implements `Layer.succeed(Tag, implementation)` with in-memory behavior
- Never import directly from `__mocks__/` paths — always use `vi.mock()` + original paths
- No centralized `TestRepositoriesLayer` — each test composes a minimal local `TestLayer` via `Layer.mergeAll(...)`

**Import ordering with `@effect/vitest`** (critical — avoids `"Cannot access '__vi_import_0__' before initialization"`):
```typescript
import { vi } from "vitest";                    // FIRST — vi.mock() hoisting needs this
vi.mock("@workspace/infrastructure/repositories/...");
import { describe, expect, it } from "@effect/vitest"; // AFTER vi.mock calls
```

**Test utilities:** `it.effect()`, `it.scoped`, `Effect.exit()`, `TestClock.adjust()`

## Type Safety Rules

- **Bare imports** — no `.js` extensions (bundler mode)
- **Workspace imports** — `@workspace/domain`, `@workspace/contracts`, etc.
- **Type imports** — use `import type` for type-only imports (Biome enforced)
- **Avoid `as any`** — use type guards, typed arrays, or `unknown`. Acceptable with comment for: test mocks, complex generics, generated files, external library compat.
- **Branded types** — type-safe IDs (`UserId`, `SessionId`) prevent accidental mixing
- **Domain types** from `@workspace/domain`: `TraitName`, `FacetName`, `BIG_FIVE_TRAITS`, `ALL_FACETS`

## Linting

- Biome with shared config from `@workspace/lint` — single source of truth at `packages/lint/biome.json`
- Zero-warnings policy for `packages/ui`, `packages/contracts`
- Pre-commit hook auto-runs Biome check with auto-fix on staged files

## UI Component Rules

**Placement:**
- Reusable, generic components (buttons, dialogs, inputs) belong in `packages/ui`
- Page-specific or business-logic components belong in `apps/front/src/components/`

**Component selection priority (follow this order):**
1. **Check `packages/ui` first** — look for an existing component in the workspace UI library that already fits the use case
2. **Check shadcn/ui** — if nothing exists in `packages/ui`, look at the shadcn docs for a component that fits
3. **Extend or modify** — if an existing component (from `packages/ui` or shadcn) is close but not exact, extend or modify it directly in `packages/ui` if the change benefits the whole app
4. **Build custom** — only create a new component from scratch if none of the above works

**`/dev/` routes:** The `/dev/` route is for development-only pages. Prototypes may live here but are throwaway — do not maintain, fix, or update them. If a prototype breaks the build, delete it rather than fix it. Only the `/dev/components` kitchen sink must be kept up to date.

**Kitchen sink rule:** Every component in `packages/ui` must have a demo in the `/dev/components` route. When modifying or adding a component in `packages/ui`, update the kitchen sink to reflect the changes so it stays up to date.

**Adding a shadcn component:**
```bash
pnpm dlx shadcn@latest add [component-name] -c apps/front
# Then move from apps/front to packages/ui/src/components/
# and export from packages/ui/src/index.ts
```

Import as: `import { Button } from "@workspace/ui/components/button";`
