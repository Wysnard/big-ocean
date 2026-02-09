# Story 5.2: Generate Shareable Profile Links

Status: done

## Story

As a **User**,
I want **to generate a unique link to my profile that I can share on LinkedIn or email to friends**,
so that **others can see my personality archetype without accessing my full assessment**.

## Acceptance Criteria

1. **Given** I complete an assessment, **when** I click "Share Profile", **then** a public profile link is generated: `{baseUrl}/profile/{publicProfileId}`, the link is copyable to clipboard, and I can control visibility (Private by default, toggle to Public).

2. **Given** someone opens my shared public link, **when** they visit it, **then** they see: my archetype name + visual card, trait summary (High/Mid/Low for O,C,E,A), facet insights, and a 2-3 sentence description. They do NOT see: full conversation, confidence %, or assessment progress.

3. **Given** I set profile to Private, **when** someone tries to access the link, **then** they see: "This profile is private".

4. **Given** a profile link was generated, **when** multiple people visit it, **then** the view count is incremented for analytics.

5. **Given** a profile is generated from a session where any facet has confidence below 70%, **when** the share is attempted, **then** the system returns an error: "Complete more of the assessment before sharing." (All 30 facets must have `confidence >= 70` before sharing is allowed.)

## Soft Dependencies

- **Story 5.1** (Results Display) is backlog. Task 8.3 ("Share Profile" button on results screen) assumes a results/celebration screen exists. If 5.1 isn't done yet, place the "Share Profile" button on the assessment completion state in the chat component or create a minimal results view. The backend for 5.2 is fully independent.

## Tasks / Subtasks

- [x] Task 1: Add `publicProfile` table to Drizzle schema (AC: #1, #2, #3, #4)
  - [x] 1.1 Define table in `packages/infrastructure/src/db/drizzle/schema.ts`
  - [x] 1.2 Add relations to `assessmentSession` and `user`
  - [x] 1.3 Generate migration with `pnpm db:generate`
- [x] Task 2: Create domain repository interface (AC: #1, #2, #3, #4)
  - [x] 2.1 Create `packages/domain/src/repositories/public-profile.repository.ts`
  - [x] 2.2 Export from `packages/domain/src/index.ts`
- [x] Task 3: Implement Drizzle repository (AC: #1, #2, #3, #4)
  - [x] 3.1 Create `packages/infrastructure/src/repositories/public-profile.drizzle.repository.ts`
  - [x] 3.2 Create `__mocks__/public-profile.drizzle.repository.ts` for testing
  - [x] 3.3 Export from `packages/infrastructure/src/index.ts`
- [x] Task 4: Define HTTP contracts (AC: #1, #2, #3)
  - [x] 4.1 Create `packages/contracts/src/http/groups/profile.ts` with ProfileGroup
  - [x] 4.2 Add ProfileGroup to `BigOceanApi` in `packages/contracts/src/http/api.ts`
  - [x] 4.3 Add `ProfilePrivate` error to `packages/contracts/src/errors.ts`
  - [x] 4.4 Export new schemas/group from `packages/contracts/src/index.ts`
- [x] Task 5: Create use-cases (AC: #1, #2, #3, #4, #5)
  - [x] 5.1 `apps/api/src/use-cases/create-shareable-profile.use-case.ts`
  - [x] 5.2 `apps/api/src/use-cases/get-public-profile.use-case.ts`
  - [x] 5.3 `apps/api/src/use-cases/toggle-profile-visibility.use-case.ts`
- [x] Task 6: Create handler (AC: #1, #2, #3)
  - [x] 6.1 Create `apps/api/src/handlers/profile.ts`
  - [x] 6.2 Wire into server layer composition in `apps/api/src/index.ts`
- [x] Task 7: Write unit tests (AC: all)
  - [x] 7.1 Use-case tests with `vi.mock()` + `__mocks__` pattern
  - [x] 7.2 Test profile creation, retrieval, visibility toggle, view count
  - [x] 7.3 Test error paths (session not found, low confidence, profile not found, private)
- [x] Task 8: Create frontend route and components (AC: #1, #2, #3)
  - [x] 8.1 Create `apps/front/src/routes/profile.$publicProfileId.tsx` (public route, no auth)
  - [x] 8.2 Create profile card component with archetype visual
  - [x] 8.3 Add "Share Profile" button to results/celebration screen
  - [x] 8.4 Add clipboard copy functionality
  - [x] 8.5 Add privacy toggle UI

## Dev Notes

### Architecture Pattern (Hexagonal — Follow Exactly)

This story follows the established hexagonal architecture:

```
Contracts (ProfileGroup) → Handler (profile.ts) → Use-Cases → Domain Interface (PublicProfileRepository)
                                                                        ↑
                                                           Infrastructure (public-profile.drizzle.repository.ts)
```

**Hard rule:** No business logic in the handler. All logic in use-cases.

### ADR-7: Remove Derived Archetype Fields from `public_profile`

**Decision:** Remove `archetypeName`, `description`, `color`, and `traitSummary` columns from the `public_profile` DB table and repository interfaces. Derive these at read-time instead.

**Rationale:** These fields are pure derivations of `oceanCode4` (archetype) and `oceanCode5` (trait summary). Storing them duplicates the archetype lookup table and creates a stale-data risk if archetypes are ever updated. Deriving at read-time is <1ms and eliminates this class of bugs.

**Changes applied:**
- DB schema: Dropped 4 columns (`archetype_name`, `description`, `color`, `trait_summary`)
- Domain interface: `CreatePublicProfileInput` and `PublicProfileData` simplified — only store `oceanCode5`, `oceanCode4`
- New utility: `deriveTraitSummary(oceanCode5)` in `packages/domain/src/utils/derive-trait-summary.ts`
- Create use-case: No longer calls `lookupArchetype` or builds `traitSummary` at write-time
- Get use-case: Derives `archetype` via `lookupArchetype(profile.oceanCode4)` and `traitSummary` via `deriveTraitSummary(profile.oceanCode5)` at read-time
- API contract: **Unchanged** — response still includes `archetypeName`, `description`, `color`, `traitSummary`
- Migration: `drizzle/20260209153226_blushing_mister_fear/migration.sql`

### Database Schema — `publicProfile` Table

In `packages/infrastructure/src/db/drizzle/schema.ts`:

```typescript
export const publicProfile = pgTable(
  "public_profile",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => assessmentSession.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    oceanCode5: text("ocean_code_5").notNull(),       // "HHMHM" — full 5-letter stored
    oceanCode4: text("ocean_code_4").notNull(),       // "HHMH" — used for archetype lookup
    // archetypeName, description, color, traitSummary — REMOVED by ADR-7 (derived at read-time)
    isPublic: boolean("is_public").default(false).notNull(), // Private by default (FR15)
    viewCount: integer("view_count").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
  },
  (table) => [
    index("public_profile_session_id_idx").on(table.sessionId),
    index("public_profile_user_id_idx").on(table.userId),
  ],
);
```

After schema changes run: `pnpm db:generate` then `pnpm db:migrate`.

### Domain Repository Interface

File: `packages/domain/src/repositories/public-profile.repository.ts`

```typescript
import { Context, Effect } from "effect";

export interface CreatePublicProfileInput {
  readonly sessionId: string;
  readonly userId: string | null;
  readonly oceanCode5: string;
  readonly oceanCode4: string;
  // ADR-7: archetypeName, description, color, traitSummary removed — derived at read-time
}

export interface PublicProfileData {
  readonly id: string;
  readonly sessionId: string;
  readonly userId: string | null;
  readonly oceanCode5: string;
  readonly oceanCode4: string;
  // ADR-7: archetypeName, description, color, traitSummary removed — derived at read-time
  readonly isPublic: boolean;
  readonly viewCount: number;
  readonly createdAt: Date;
}

export class PublicProfileRepository extends Context.Tag("PublicProfileRepository")<
  PublicProfileRepository,
  {
    readonly createProfile: (input: CreatePublicProfileInput) => Effect.Effect<PublicProfileData, Error>;
    readonly getProfile: (profileId: string) => Effect.Effect<PublicProfileData | null, Error>;
    readonly getProfileBySessionId: (sessionId: string) => Effect.Effect<PublicProfileData | null, Error>;
    readonly toggleVisibility: (profileId: string, isPublic: boolean) => Effect.Effect<void, Error>;
    readonly incrementViewCount: (profileId: string) => Effect.Effect<void, Error>;
  }
>() {}
```

### HTTP Contract Definition

File: `packages/contracts/src/http/groups/profile.ts`

Define two endpoints:

1. `POST /profile/share` — Create shareable profile
   - Payload: `{ sessionId: S.String }`
   - Success: `{ publicProfileId: S.String, shareableUrl: S.String, isPublic: S.Boolean }`
   - Errors: `SessionNotFound` (404), `DatabaseError` (500), `ProfileError` (500)

2. `GET /profile/:publicProfileId` — View public profile
   - Success: `{ archetypeName: S.String, oceanCode: S.String, description: S.String, color: S.String, traitSummary: S.Record(...), isPublic: S.Boolean }`
   - Errors: `ProfileNotFound` (404), `ProfilePrivate` (403)

3. `PATCH /profile/:publicProfileId/visibility` — Toggle privacy
   - Payload: `{ isPublic: S.Boolean }`
   - Success: `{ isPublic: S.Boolean }`
   - Errors: `ProfileNotFound` (404), `Unauthorized` (401)

Add `ProfilePrivate` error to `packages/contracts/src/errors.ts`:
```typescript
export class ProfilePrivate extends S.TaggedError<ProfilePrivate>()("ProfilePrivate", {
  publicProfileId: S.String,
  message: S.String,
}) {}
```

Follow the existing `AssessmentGroup` pattern for `ProfileGroup`:
```typescript
export const ProfileGroup = HttpApiGroup.make("profile")
  .add(HttpApiEndpoint.post("shareProfile", "/share").setPayload(...).addSuccess(...).addError(...))
  .add(HttpApiEndpoint.get("getProfile", "/:publicProfileId").addSuccess(...).addError(...))
  .add(HttpApiEndpoint.patch("toggleVisibility", "/:publicProfileId/visibility").setPayload(...).addSuccess(...).addError(...))
  .prefix("/profile");
```

Add to `BigOceanApi` in `packages/contracts/src/http/api.ts`:
```typescript
export class BigOceanApi extends HttpApi.make("BigOceanApi")
  .add(HealthGroup)
  .add(AssessmentGroup.prefix("/api"))
  .add(ProfileGroup.prefix("/api")) {}  // NEW
```

### Use-Case Logic

**`create-shareable-profile.use-case.ts`:**

Dependencies: `AssessmentSessionRepository`, `PublicProfileRepository`, `ScorerRepository`, `LoggerRepository`, `AppConfig`

1. Get session via `AssessmentSessionRepository.getSession(sessionId)`
2. Check if profile already exists for this session via `PublicProfileRepository.getProfileBySessionId(sessionId)`
   - If exists, return existing profile (idempotent — same session always returns same profile)
3. **Confidence validation (AC #5):** Aggregate facet scores via `ScorerRepository.aggregateFacetScores(sessionId)`. Check that ALL 30 facets have `confidence >= 70`. If any facet is missing or has `confidence < 70`, fail with `ProfileError({ message: "Complete more of the assessment before sharing." })`.
4. Generate OCEAN code: `generateOceanCode(facetScores)` from `@workspace/domain`
5. Extract 4-letter code: `extract4LetterCode(oceanCode5)` from `@workspace/domain`
6. Create profile via `PublicProfileRepository.createProfile({ sessionId, userId, oceanCode5, oceanCode4 })`
   - **ADR-7:** Only OCEAN codes stored. No `archetypeName`, `description`, `color`, `traitSummary` at write-time.
7. Return `{ publicProfileId: profile.id, shareableUrl: "${frontendUrl}/profile/${profile.id}", isPublic: false }`

Note: `profile.id` is a UUID from `gen_random_uuid()` — it IS the publicProfileId in the URL. No separate nanoid slug needed.

**`get-public-profile.use-case.ts`:**

Dependencies: `PublicProfileRepository`, `LoggerRepository`

1. Get profile via `PublicProfileRepository.getProfile(publicProfileId)`
2. If null → fail with `ProfileNotFound`
3. If `!isPublic` → fail with `ProfilePrivate`
4. Increment view count via `Effect.fork(repo.incrementViewCount(id))` — **fire-and-forget, DO NOT block response**. If it fails, log warning and swallow error. Never fail a GET because of view count.
5. **ADR-7 — Derive at read-time:**
   - `const archetype = lookupArchetype(profile.oceanCode4)` → `{ name, description, color }`
   - `const traitSummary = deriveTraitSummary(profile.oceanCode5)` → `{ openness: "H", ... }`
6. Return `{ archetypeName: archetype.name, oceanCode: profile.oceanCode5, description: archetype.description, color: archetype.color, traitSummary, isPublic: true }`

**`toggle-profile-visibility.use-case.ts`:**

Dependencies: `PublicProfileRepository`, `LoggerRepository`

1. Get profile via `PublicProfileRepository.getProfile(profileId)`
2. If null → fail with `ProfileNotFound`
3. Verify ownership: `profile.userId === authenticatedUserId`. If not → fail with `Unauthorized`
4. Toggle `isPublic` flag via `PublicProfileRepository.toggleVisibility(profileId, isPublic)`
5. Return new visibility state

### Existing Utilities to Reuse (DO NOT Reinvent)

- `generateOceanCode(facetScores)` — `packages/domain/src/utils/ocean-code-generator.ts`
- `lookupArchetype(code4)` — `packages/domain/src/utils/archetype-lookup.ts`
- `extract4LetterCode(code5)` — `packages/domain/src/utils/archetype-lookup.ts`
- `deriveTraitSummary(code5)` — `packages/domain/src/utils/derive-trait-summary.ts` **(ADR-7 — NEW)**
- `calculateTraitConfidence(facetConfidence)` — `packages/domain/src/utils/confidence.ts`
- `CURATED_ARCHETYPES` — `packages/domain/src/constants/archetypes.ts`
- `Archetype` type — `packages/domain/src/types/archetype.ts`
- `OceanCode4`, `OceanCode5`, `TraitLevel` types — `packages/domain/src/types/archetype.ts`
- `ProfileNotFound`, `ProfileError` errors — `packages/contracts/src/errors.ts` (already defined)
- `SessionNotFound`, `DatabaseError` errors — `packages/contracts/src/errors.ts` (already defined)

### Barrel Export Updates (Critical — Don't Forget)

1. `packages/domain/src/index.ts` — Export `PublicProfileRepository`, `CreatePublicProfileInput`, `PublicProfileData`
2. `packages/infrastructure/src/index.ts` — Export `PublicProfileDrizzleRepositoryLive`
3. `packages/contracts/src/index.ts` — Export `ProfileGroup`, `ProfilePrivate` error, and all request/response schemas
4. `packages/contracts/src/http/api.ts` — Add `ProfileGroup` to `BigOceanApi`

### Server Layer Composition

In `apps/api/src/index.ts`, add:
1. Import `PublicProfileDrizzleRepositoryLive` from `@workspace/infrastructure`
2. Add to repository layers (alongside existing `AssessmentSessionDrizzleRepositoryLive`, etc.)
3. Import `ProfileGroupLive` handler
4. Add to `HttpGroupsLive` layer merge

### Frontend Route

File: `apps/front/src/routes/profile.$publicProfileId.tsx`

- TanStack Router dynamic route with `$publicProfileId` param
- **No auth required** — public endpoint. The GET handler must NOT inject auth middleware.
- Fetch via TanStack Query: `GET /api/profile/{publicProfileId}`
- Display: archetype card (name, color background, description), trait bars (H/M/L for O,C,E,A,N), archetype name prominent
- Error states: loading skeleton, 404 "Profile not found", 403 "This profile is private"
- Share buttons: Copy link (navigator.clipboard), Twitter/X (share intent URL), LinkedIn (share URL)
- Mobile responsive with Tailwind v4
- Use existing shadcn/ui components from `@workspace/ui` (Card, Button, Badge)

### Testing Strategy

**Pattern:** `vi.mock()` + `__mocks__` co-located with repository implementations.

```typescript
vi.mock("@workspace/infrastructure/repositories/public-profile.drizzle.repository");
import { PublicProfileDrizzleRepositoryLive } from "@workspace/infrastructure/repositories/public-profile.drizzle.repository";

const TestLayer = Layer.mergeAll(
  PublicProfileDrizzleRepositoryLive,
  AssessmentSessionDrizzleRepositoryLive,
  LoggerPinoRepositoryLive,
);
```

**Test cases:**
- Create profile from valid session → returns publicProfileId (UUID) + shareableUrl
- Create profile (idempotent) → same sessionId returns same profile, not a duplicate
- Get public profile → returns archetype data, increments view count
- Get private profile → fails with `ProfilePrivate`
- Get non-existent profile → fails with `ProfileNotFound`
- Toggle visibility by owner → updates isPublic flag
- Toggle visibility by non-owner → fails with `Unauthorized`
- Low confidence session (any facet with confidence < 70) → fails with `ProfileError`
- Missing facets (fewer than 30 rows in facetScores) → fails with `ProfileError`
- View count increment failure does NOT fail the GET response (fire-and-forget resilience)

### Project Structure Notes

- All new files follow existing naming conventions: `{entity}.{implementation}.repository.ts`
- Profile group follows same pattern as `AssessmentGroup` in contracts and handlers
- Repository interface uses `Context.Tag` pattern per `packages/domain/src/repositories/`
- No `as any` — use proper typed schemas
- Privacy default is `false` (private) per FR15

### References

- [Source: packages/contracts/src/errors.ts] — ProfileNotFound and ProfileError already defined
- [Source: packages/contracts/src/http/api.ts] — BigOceanApi composition pattern
- [Source: packages/contracts/src/http/groups/assessment.ts] — HttpApiGroup + HttpApiEndpoint pattern
- [Source: packages/infrastructure/src/db/drizzle/schema.ts] — Full DB schema with assessmentSession, traitScores
- [Source: packages/domain/src/utils/ocean-code-generator.ts] — generateOceanCode function
- [Source: packages/domain/src/utils/archetype-lookup.ts] — lookupArchetype, extract4LetterCode functions
- [Source: packages/domain/src/types/archetype.ts] — Archetype, OceanCode4, OceanCode5 types
- [Source: packages/domain/src/constants/archetypes.ts] — CURATED_ARCHETYPES lookup table
- [Source: apps/api/src/handlers/assessment.ts] — Handler pattern with error mapping
- [Source: apps/api/src/use-cases/get-results.use-case.ts] — Existing results use-case (uses calculateTraitConfidence)
- [Source: docs/ARCHITECTURE.md] — Hexagonal architecture, error location rules, testing patterns
- [Source: CLAUDE.md] — Mock architecture (__mocks__ + vi.mock() pattern), workspace dependencies

## Dev Agent Record

### Agent Model Used

Claude Opus 4

### Debug Log References

- Fixed `@workspace/domain/types/trait` deep import → use barrel `@workspace/domain`
- Added `DatabaseError` to `getProfile` and `toggleVisibility` contract endpoints
- Added `ScorerDrizzleRepositoryLive` to `RepositoryLayers` in server layer composition
- Moved `await import()` from inside `Effect.gen` to top-level imports in test file
- Fixed accidental removal of `FacetScoresMap` import during lint fix

### Completion Notes List

- All 8 tasks complete: DB schema, domain interface, Drizzle repo + mock, HTTP contracts, 3 use-cases, handler, 11 unit tests, frontend routes + hooks
- 208 tests passing (122 API + 86 frontend), build clean, lint clean (2 pre-existing warnings)
- Used `ScorerRepository.aggregateFacetScores()` for confidence validation (not a separate FacetScoresRepository)
- Profile is private by default (AC #1, FR15); toggle via PATCH endpoint
- View count increment is fire-and-forget via `Effect.fork` (AC #4)
- Confidence validation requires ALL 30 facets >= 70 confidence (AC #5)
- Frontend: results route (`/results?sessionId=`) with share button + privacy toggle, public profile route (`/profile/:id`) with archetype card + trait bars + copy link
- Migration generated but `pnpm db:migrate` needs to be run against the database

**ADR-7 Post-Implementation Update:**
- Removed `archetypeName`, `description`, `color`, `traitSummary` from DB schema, domain interfaces, repositories, and create use-case
- Added `deriveTraitSummary()` utility to `packages/domain/src/utils/derive-trait-summary.ts`
- Get use-case now derives archetype fields at read-time via `lookupArchetype()` + `deriveTraitSummary()`
- API contract unchanged — response shape identical, only storage layer simplified
- New migration: `drizzle/20260209153226_blushing_mister_fear/migration.sql` (drops 4 columns)
- All 208 tests still passing after ADR-7 changes

### Code Review Fixes (2026-02-09)

**Critical Issues Fixed:**
1. **Authentication Bypass in Handler** — Fixed handler to fail early if `x-user-id` header is missing instead of defaulting to empty string (profile.ts:84)
2. **AC #2 Violation — Missing Facet Insights** — Added facets to public profile response with expandable UI in profile route (profile.$publicProfileId.tsx)
3. **Unreachable Feature** — Added "View Results & Share" button to chat completion state, making `/results` route accessible (TherapistChat.tsx:91-102)

**Medium Issues Fixed:**
4. **ScorerError Handling** — Added proper error mapping in getProfile handler to convert ScorerError to DatabaseError (profile.ts:40-62)

**Changes Made:**
- Added `facets: FacetScoresMap` field to `GetPublicProfileResponseSchema` and use-case output
- Updated `get-public-profile.use-case.ts` to fetch facet scores via `ScorerRepository.aggregateFacetScores()`
- Updated `profile.ts` handler to pass through facets and map ScorerError
- Added expandable trait sections with facet breakdown UI to `profile.$publicProfileId.tsx` (TRAIT_FACETS config + expand/collapse state)
- Added "View Results & Share" button to `TraitSidebar` component when assessment is complete
- Fixed authentication check in `toggleVisibility` handler to require `x-user-id` header

**Verification:**
- ✅ All 11 unit tests passing
- ✅ Build succeeds (TypeScript compilation clean)
- ✅ Lint clean (2 pre-existing warnings unrelated to changes)

### File List

**New files created:**
- `packages/domain/src/repositories/public-profile.repository.ts` — Domain interface (Context.Tag)
- `packages/infrastructure/src/repositories/public-profile.drizzle.repository.ts` — Drizzle implementation
- `packages/infrastructure/src/repositories/__mocks__/public-profile.drizzle.repository.ts` — Test mock
- `packages/contracts/src/http/groups/profile.ts` — HTTP API contracts (3 endpoints)
- `apps/api/src/use-cases/create-shareable-profile.use-case.ts` — Create profile use-case
- `apps/api/src/use-cases/get-public-profile.use-case.ts` — Get public profile use-case
- `apps/api/src/use-cases/toggle-profile-visibility.use-case.ts` — Toggle visibility use-case
- `apps/api/src/handlers/profile.ts` — HTTP handler
- `apps/api/src/use-cases/__tests__/shareable-profile.use-case.test.ts` — 11 unit tests
- `apps/front/src/hooks/use-profile.ts` — Frontend profile hooks (TanStack Query)
- `apps/front/src/routes/profile.$publicProfileId.tsx` — Public profile route
- `apps/front/src/routes/results.tsx` — Results route with share functionality
- `drizzle/20260209144243_heavy_molecule_man/migration.sql` — DB migration

**ADR-7 new files:**
- `packages/domain/src/utils/derive-trait-summary.ts` — Derives trait summary from 5-letter OCEAN code
- `drizzle/20260209153226_blushing_mister_fear/migration.sql` — Drops 4 derived columns from `public_profile`

**ADR-7 modified files:**
- `packages/infrastructure/src/db/drizzle/schema.ts` — Removed `archetypeName`, `description`, `color`, `traitSummary` columns
- `packages/domain/src/repositories/public-profile.repository.ts` — Simplified `CreatePublicProfileInput` and `PublicProfileData`
- `packages/domain/src/utils/index.ts` — Added `deriveTraitSummary` export
- `packages/domain/src/index.ts` — Added `deriveTraitSummary` to barrel exports
- `packages/infrastructure/src/repositories/public-profile.drizzle.repository.ts` — Removed 4 fields from INSERT/SELECT
- `packages/infrastructure/src/repositories/__mocks__/public-profile.drizzle.repository.ts` — Simplified mock data
- `apps/api/src/use-cases/create-shareable-profile.use-case.ts` — Removed archetype lookup at write-time
- `apps/api/src/use-cases/get-public-profile.use-case.ts` — Added read-time derivation via `lookupArchetype` + `deriveTraitSummary`
- `apps/api/src/use-cases/__tests__/shareable-profile.use-case.test.ts` — Updated to match simplified interfaces

**Original modified files:**
- `packages/infrastructure/src/db/drizzle/schema.ts` — Added `publicProfile` table + relations
- `packages/contracts/src/errors.ts` — Added `ProfilePrivate` error
- `packages/contracts/src/http/api.ts` — Added `ProfileGroup` to `BigOceanApi`
- `packages/contracts/src/index.ts` — Added profile exports
- `packages/domain/src/index.ts` — Added `PublicProfileRepository` exports
- `packages/infrastructure/src/index.ts` — Added `PublicProfileDrizzleRepositoryLive` export
- `apps/api/src/index.ts` — Added profile layers to server composition
- `apps/api/src/use-cases/index.ts` — Added use-case barrel exports

**Code Review fixes (2026-02-09):**
- `apps/api/src/handlers/profile.ts` — Fixed auth bypass + added ScorerError handling
- `packages/contracts/src/http/groups/profile.ts` — Added FacetScoreSchema + facets to GetPublicProfileResponseSchema
- `apps/api/src/use-cases/get-public-profile.use-case.ts` — Added ScorerRepository dependency + facet fetching
- `apps/front/src/routes/profile.$publicProfileId.tsx` — Added expandable facet insights UI with TRAIT_FACETS config
- `apps/front/src/components/TherapistChat.tsx` — Added "View Results & Share" button to completion state
