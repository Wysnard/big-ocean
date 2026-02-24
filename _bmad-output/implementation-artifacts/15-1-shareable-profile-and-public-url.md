# Story 15.1: Shareable Profile & Public URL

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want a shareable profile page with a unique URL,
so that I can share my personality results with others.

## Acceptance Criteria

1. **Given** a user has completed their assessment **When** results are finalized **Then** a unique profile URL is generated for their assessment (FR14)

2. **Given** a profile exists **When** it is created **Then** it is private by default — not discoverable publicly (FR15) **And** the user has explicit controls to toggle visibility

3. **Given** a user shares their profile URL **When** someone visits it **Then** they see the archetype code, name, trait summary, and facet insights (FR13) **And** the profile page loads in < 1s (NFR3)

4. **Given** any profile is accessed **When** the page loads **Then** an audit log entry is created recording the access (FR26) **And** zero unauthorized profile access is permitted — private profiles return 403 to non-owners (NFR12)

5. **Given** the profile page **When** it renders **Then** it includes ShareProfileSection and QuickActionsCard components

## Existing Implementation Status

> **CRITICAL CONTEXT:** Most of this story's functionality was already built in Phase 1 (Stories 5-2 and 7-12). The dev agent MUST understand what exists before writing any code.

### Already Done (DO NOT Rebuild)

| Capability | Story | Status |
|-----------|-------|--------|
| `public_profile` DB table with `oceanCode5`, `oceanCode4`, `isPublic`, `viewCount` | 5-2 | done |
| `PublicProfileRepository` domain interface (Context.Tag) | 5-2 | done |
| `PublicProfileDrizzleRepositoryLive` implementation + `__mocks__` | 5-2 | done |
| `ProfileGroup` HTTP contracts (POST /share, GET /:id, PATCH /:id/visibility) | 5-2 | done |
| `create-shareable-profile`, `get-public-profile`, `toggle-profile-visibility` use-cases | 5-2 | done |
| Profile handler (`apps/api/src/handlers/profile.ts`) | 5-2 | done |
| Auto-creation of public profile in `get-results.use-case.ts` (line ~155-168) | 5-2 | done |
| Public profile route at `/public-profile/:publicProfileId` with brand design | 7-12 | done |
| OG meta tags for social sharing previews (SSR via TanStack Start `head()`) | 7-12 | done |
| `ShareProfileSection.tsx` with copy link + social share buttons + privacy notice | 7-12 | done |
| `QuickActionsCard.tsx` on results page | 7-9/8-6 | done |
| GeometricSignature, OCEAN shapes, trait colors on public profile | 7-12 | done |
| Privacy toggle (default private, explicit user control) | 5-2 | done |
| View count increment (fire-and-forget) | 5-2 | done |
| Confidence validation (all 30 facets >= 70) before sharing | 5-2 | done |
| E2E tests (`e2e/specs/public-profile.spec.ts`, `profile-page.spec.ts`) | 7-12+ | done |
| `ProfilePrivate`, `ProfileNotFound`, `ProfileError` errors in contracts | 5-2 | done |

### NOT Yet Done (This Story's Actual Scope)

1. **Audit logging for profile access (FR26, AC #4)** — No audit logging infrastructure exists anywhere in the codebase. This is the primary new work.
2. **End-to-end validation with Phase 2 pipeline** — Stories 5-2 and 7-12 were built against Phase 1's assessment pipeline. The Phase 2 finalization pipeline (Story 11.1+) changed the flow. Verify that profile auto-creation in `get-results.use-case.ts` still works correctly with the new pipeline.

## Tasks / Subtasks

- [ ] Task 1: Create audit logging infrastructure for profile access (AC: #4)
  - [ ] 1.1 Create `profile_access_log` table in `packages/infrastructure/src/db/drizzle/schema.ts`
    - Columns: `id` (uuid PK), `profileId` (FK to `public_profile.id`), `accessorUserId` (nullable text, FK to `user.id`), `accessorIp` (text, nullable), `accessorUserAgent` (text, nullable), `action` (text: 'view', 'share', 'toggle_visibility'), `createdAt` (timestamp)
    - Index on `profileId` + `createdAt` for querying
  - [ ] 1.2 Create domain repository interface `ProfileAccessLogRepository` in `packages/domain/src/repositories/profile-access-log.repository.ts`
    - Single method: `logAccess(input: ProfileAccessLogInput) => Effect.Effect<void, never>` (infallible — audit logging must not fail requests)
  - [ ] 1.3 Create Drizzle implementation `ProfileAccessLogDrizzleRepositoryLive` in `packages/infrastructure/src/repositories/profile-access-log.drizzle.repository.ts`
    - Wrap insert in `Effect.catchAll(() => Effect.void)` — audit log failures must be swallowed (fire-and-forget)
  - [ ] 1.4 Create `__mocks__/profile-access-log.drizzle.repository.ts` with in-memory array storage
  - [ ] 1.5 Export from `packages/domain/src/index.ts` and `packages/infrastructure/src/index.ts`
  - [ ] 1.6 Generate migration with `pnpm db:generate`

- [ ] Task 2: Integrate audit logging into get-public-profile use-case (AC: #4)
  - [ ] 2.1 Add `ProfileAccessLogRepository` as dependency in `get-public-profile.use-case.ts`
  - [ ] 2.2 After successful profile retrieval (and AFTER privacy check), log access via fire-and-forget `Effect.fork`:
    ```typescript
    yield* profileAccessLogRepo.logAccess({
      profileId: publicProfileId,
      accessorUserId: null, // public endpoint, no auth
      accessorIp: null, // TODO: pass from handler if needed
      accessorUserAgent: null,
      action: 'view',
    }).pipe(Effect.fork);
    ```
  - [ ] 2.3 Add `ProfileAccessLogDrizzleRepositoryLive` to server layer composition in `apps/api/src/index.ts`
  - [ ] 2.4 Update `vi.mock()` in relevant test files to include the new repository mock

- [ ] Task 3: Write unit tests for audit logging (AC: #4)
  - [ ] 3.1 Create `apps/api/src/use-cases/__tests__/profile-access-log.test.ts`
  - [ ] 3.2 Test: successful profile view creates audit log entry
  - [ ] 3.3 Test: audit log failure does NOT fail the profile GET response
  - [ ] 3.4 Test: private profile access does NOT create audit log (403 before logging)
  - [ ] 3.5 Test: non-existent profile does NOT create audit log (404 before logging)

- [ ] Task 4: Validate Phase 2 pipeline integration (AC: #1, #2, #3, #5)
  - [ ] 4.1 Verify `get-results.use-case.ts` auto-creates public profile for authenticated users (lines ~155-168) — ensure it works with Phase 2 `assessment_results` table structure
  - [ ] 4.2 Verify the shareable URL format in `get-results.use-case.ts` uses `/public-profile/` prefix (not `/profile/`) matching the current frontend route
  - [ ] 4.3 Verify `ShareProfileSection` and `QuickActionsCard` render correctly on the results page (`/results/:assessmentSessionId`)
  - [ ] 4.4 Run existing profile-related tests: `pnpm test:run` (all profile use-case tests must pass)
  - [ ] 4.5 Run `pnpm lint` to verify no regressions

## Dev Notes

### Architecture Pattern (Follow Exactly)

Audit logging follows the same hexagonal architecture:

```
Domain (ProfileAccessLogRepository) ← Infrastructure (profile-access-log.drizzle.repository.ts)
                                      ↑ injected via Layer
Use-Case (get-public-profile) → logs access via fire-and-forget Effect.fork
```

**Critical:** Audit log writes MUST be fire-and-forget. Never fail a user-facing request because of audit logging. Use `Effect.fork` + `Effect.catchAll(() => Effect.void)`.

### Database Schema — `profile_access_log` Table

```typescript
export const profileAccessLog = pgTable(
  "profile_access_log",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => publicProfile.id, { onDelete: "cascade" }),
    accessorUserId: text("accessor_user_id").references(() => user.id, { onDelete: "set null" }),
    accessorIp: text("accessor_ip"),
    accessorUserAgent: text("accessor_user_agent"),
    action: text("action").notNull(), // 'view' | 'share' | 'toggle_visibility'
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("profile_access_log_profile_id_created_at_idx").on(table.profileId, table.createdAt),
  ],
);
```

### Domain Repository Interface

```typescript
import { Context, Effect } from "effect";

export interface ProfileAccessLogInput {
  readonly profileId: string;
  readonly accessorUserId: string | null;
  readonly accessorIp: string | null;
  readonly accessorUserAgent: string | null;
  readonly action: "view" | "share" | "toggle_visibility";
}

export class ProfileAccessLogRepository extends Context.Tag("ProfileAccessLogRepository")<
  ProfileAccessLogRepository,
  {
    readonly logAccess: (input: ProfileAccessLogInput) => Effect.Effect<void, never>;
  }
>() {}
```

### Existing Files to Modify (Minimal Changes)

1. `packages/infrastructure/src/db/drizzle/schema.ts` — Add `profileAccessLog` table
2. `apps/api/src/use-cases/get-public-profile.use-case.ts` — Add `ProfileAccessLogRepository` dependency + fire-and-forget log call
3. `apps/api/src/index.ts` — Add `ProfileAccessLogDrizzleRepositoryLive` to server layers
4. `packages/domain/src/index.ts` — Export new repository
5. `packages/infrastructure/src/index.ts` — Export new live layer

### Existing Files to NOT Touch

- `packages/contracts/src/http/groups/profile.ts` — No contract changes
- `apps/front/src/routes/public-profile.$publicProfileId.tsx` — No frontend changes
- `apps/front/src/components/results/ShareProfileSection.tsx` — Already complete
- `apps/front/src/components/results/QuickActionsCard.tsx` — Already complete
- `apps/api/src/handlers/profile.ts` — No handler changes needed
- `apps/api/src/use-cases/create-shareable-profile.use-case.ts` — Already complete
- `apps/api/src/use-cases/toggle-profile-visibility.use-case.ts` — Already complete

### URL Format Verification

The current `get-results.use-case.ts` (line ~194) generates:
```typescript
shareableUrl: existingProfile
  ? `${config.frontendUrl}/public-profile/${existingProfile.id}`
  : null,
```

This matches the frontend route at `apps/front/src/routes/public-profile.$publicProfileId.tsx`. Verify this is still correct.

### Testing Strategy

**Pattern:** `vi.mock()` + `__mocks__` co-located with repository implementations.

```typescript
import { vi } from "vitest";
vi.mock("@workspace/infrastructure/repositories/profile-access-log.drizzle.repository");
import { describe, expect, it } from "@effect/vitest";
import { ProfileAccessLogDrizzleRepositoryLive } from "@workspace/infrastructure/repositories/profile-access-log.drizzle.repository";

const TestLayer = Layer.mergeAll(
  PublicProfileDrizzleRepositoryLive,
  ProfileAccessLogDrizzleRepositoryLive,
  LoggerPinoRepositoryLive,
  ScorerDrizzleRepositoryLive,
);
```

### Project Structure Notes

- Follows existing naming conventions: `profile-access-log.repository.ts`, `profile-access-log.drizzle.repository.ts`
- Audit logging is a cross-cutting concern but scoped to profile access for now (FR26)
- Future stories (Epic 6/Story 6.3) will expand audit logging to all data access — this implementation should be designed to be extensible but NOT over-engineered

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 6.1] — Story requirements and AC
- [Source: _bmad-output/implementation-artifacts/5-2-generate-shareable-profile-links.md] — Phase 1 profile implementation (complete)
- [Source: _bmad-output/implementation-artifacts/7-12-shareable-public-profile-and-share-cards.md] — Phase 1 visual redesign (complete)
- [Source: apps/api/src/use-cases/get-public-profile.use-case.ts] — Where audit logging integrates
- [Source: apps/api/src/use-cases/get-results.use-case.ts:155-168] — Auto-creates public profile
- [Source: packages/infrastructure/src/db/drizzle/schema.ts] — DB schema (publicProfile table already exists)
- [Source: packages/domain/src/repositories/public-profile.repository.ts] — Existing profile repo pattern to follow
- [Source: apps/front/src/routes/public-profile.$publicProfileId.tsx] — Current public profile frontend route
- [Source: e2e/specs/public-profile.spec.ts] — Existing E2E tests
- [Source: docs/ARCHITECTURE.md] — Hexagonal architecture, error location rules

## Anti-Patterns

Do NOT introduce any of these patterns during implementation:

1. **Error handling scope** — No broad `catchAll`/`catchTag` that swallows errors. Only allowed: fire-and-forget `catchAll` for audit logging (which by definition must not fail requests). Errors must propagate unchanged to the HTTP contract layer.
2. **Mock accuracy** — Mocks in `__mocks__/` must match live repository interfaces exactly. Never add methods to mocks that don't exist in the real implementation. Always use `vi.mock()` + original paths, never import from `__mocks__/` directly.
3. **Import discipline** — No cross-layer imports (infrastructure must not import from use-cases, domain must not import from infrastructure). No deep imports bypassing barrel exports. Use `@workspace/*` paths.
4. **Type safety** — No unsafe `as` casts (use type guards or `unknown` instead). No `in` operator for type narrowing (use discriminated unions with `_tag`). No `as any` without a justifying comment.
5. **Over-engineering** — Do NOT build a generic audit logging framework. This story adds profile-access-specific logging only. Story 6.3 (Epic 6) will build comprehensive audit logging later.
6. **Rebuilding existing work** — Do NOT recreate profile creation, public viewing, privacy toggle, social sharing, or any frontend components. They are DONE.

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
