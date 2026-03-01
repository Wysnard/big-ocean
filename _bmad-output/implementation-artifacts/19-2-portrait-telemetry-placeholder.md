# Story 19-2: Portrait Telemetry Placeholder

Status: ready-for-dev

## Story

As a product operator,
I want to capture user feedback on portrait quality,
So that I can evaluate whether removing the quote constraint improves or degrades the "felt understood" moment.

## Acceptance Criteria

1. **AC1 — portrait_ratings table:** A `portrait_ratings` table exists with columns: `id` (UUID PK), `userId` (text FK -> user.id, NOT NULL), `assessmentSessionId` (UUID FK -> assessment_session.id, NOT NULL), `portraitType` (enum: teaser/full), `rating` (enum: up/down), `depthSignal` (text: rich/moderate/thin), `evidenceCount` (integer, NOT NULL), `createdAt` (timestamp, NOT NULL, defaultNow). An index on `assessmentSessionId` is required for query performance.

2. **AC2 — pgEnums:** Two pgEnums are created: `portrait_type_enum` (teaser, full) and `portrait_rating_enum` (up, down). Uses the as-const -> type -> pgEnum pattern established in the codebase.

3. **AC3 — Domain types:** `PortraitType`, `PortraitRating`, and `DepthSignalLevel` types defined in `packages/domain/src/types/portrait-rating.types.ts`. Constants arrays (`PORTRAIT_TYPES`, `PORTRAIT_RATINGS`, `DEPTH_SIGNAL_LEVELS`) exported for pgEnum generation.

4. **AC4 — Repository interface:** `PortraitRatingRepository` Context.Tag in domain package with method: `insertRating(input) -> Effect<PortraitRatingRecord, DatabaseError>`.

5. **AC5 — Repository implementation:** `PortraitRatingDrizzleRepositoryLive` in infrastructure package using `Layer.effect` pattern. Inserts a row into `portrait_ratings`.

6. **AC6 — Use-case:** `rate-portrait.use-case.ts` in `apps/api/src/use-cases/` accepts `{ userId, assessmentSessionId, portraitType, rating, depthSignal, evidenceCount }` and persists to the table via the repository. Validates that the assessment session exists and belongs to the user.

7. **AC7 — Handler endpoint:** A `ratePortrait` endpoint is added to the portrait handler group in contracts and wired in the handler. POST request, auth required.

8. **AC8 — Migration:** A Drizzle migration is generated via `pnpm db:generate` and applies cleanly.

9. **AC9 — Mock implementation:** `__mocks__/portrait-rating.drizzle.repository.ts` with in-memory array, `Layer.succeed`, and `_resetMockState` export.

10. **AC10 — Unit tests:** Use-case tests verify: successful rating insertion, session-not-found error, session-ownership error.

## Tasks / Subtasks

- [ ] **Task 1: Domain types and constants** (AC: #2, #3)
  - [ ] 1.1 Create `packages/domain/src/types/portrait-rating.types.ts` with:
    - `PORTRAIT_TYPES` as-const array (`["teaser", "full"]`)
    - `PortraitType` type derived from const array
    - `PORTRAIT_RATINGS` as-const array (`["up", "down"]`)
    - `PortraitRating` type derived from const array
    - `DEPTH_SIGNAL_LEVELS` as-const array (`["rich", "moderate", "thin"]`)
    - `DepthSignalLevel` type derived from const array
    - `PortraitRatingRecord` interface matching DB columns
  - [ ] 1.2 Export from `packages/domain/src/index.ts`

- [ ] **Task 2: DB schema and migration** (AC: #1, #2, #8)
  - [ ] 2.1 Add `portraitTypeEnum` and `portraitRatingEnum` pgEnums to schema.ts
  - [ ] 2.2 Add `portraitRatings` table to schema.ts
  - [ ] 2.3 Add relations for `portraitRatings`
  - [ ] 2.4 Generate migration via `pnpm db:generate`

- [ ] **Task 3: Repository interface** (AC: #4)
  - [ ] 3.1 Create `packages/domain/src/repositories/portrait-rating.repository.ts` with `PortraitRatingRepository` Context.Tag
  - [ ] 3.2 Export from `packages/domain/src/index.ts`

- [ ] **Task 4: Repository implementation** (AC: #5)
  - [ ] 4.1 Create `packages/infrastructure/src/repositories/portrait-rating.drizzle.repository.ts`
  - [ ] 4.2 Export from `packages/infrastructure/src/index.ts`

- [ ] **Task 5: Mock implementation** (AC: #9)
  - [ ] 5.1 Create `packages/infrastructure/src/repositories/__mocks__/portrait-rating.drizzle.repository.ts`

- [ ] **Task 6: Contract endpoint** (AC: #7)
  - [ ] 6.1 Add `RatePortraitRequest` and `RatePortraitResponse` schemas to contracts
  - [ ] 6.2 Add `ratePortrait` endpoint to portrait API group

- [ ] **Task 7: Use-case** (AC: #6)
  - [ ] 7.1 Create `apps/api/src/use-cases/rate-portrait.use-case.ts`
  - [ ] 7.2 Wire in handler

- [ ] **Task 8: Unit tests** (AC: #10)
  - [ ] 8.1 Test successful rating insertion
  - [ ] 8.2 Test session-not-found error
  - [ ] 8.3 Test session-ownership validation
