# Story 2.1: Session Management and Persistence

Status: ready-for-dev

## Story

As a **User**,
I want **to pause an assessment and resume from exactly where I left off**,
So that **I can take time between conversations without losing progress**.

## Acceptance Criteria

**TEST-FIRST (Red Phase):**
Given tests are written for session management
When I run `pnpm test session-manager.test.ts`
Then tests fail (red) because session implementation doesn't exist
And each test defines expected behavior:
  - Test: Session created with unique ID
  - Test: Messages persisted to database
  - Test: Precision scores saved and restored
  - Test: Session resume loads full history
  - Test: Conversation state is accurate after resume

**IMPLEMENTATION (Green Phase):**
Given an active assessment session
When I close the browser or disconnect
Then the session is saved with conversation history and current precision scores on server
And when I return with the session ID
And I click "Resume Assessment"
Then the conversation history loads from server in <1 second
And Nerin's next response can be generated seamlessly
And all session management tests pass (green)

**INTEGRATION:**
Given a resumed session
When I continue the conversation
Then my full conversation history is visible (scrollable)
And precision scores continue updating
And Assessment continues from exact point of pause

**Documentation**: All new code has JSDoc comments; README/CLAUDE.md updated if applicable
**Tests**: Unit tests added with minimum 80% coverage for new functionality; integration tests if needed

## Tasks / Subtasks

- [ ] Task 1: Set up database package with Drizzle ORM (AC: #1)
  - [ ] Create `packages/database/` structure
  - [ ] Install Drizzle ORM and PostgreSQL driver
  - [ ] Define session and message table schemas
  - [ ] Create database initialization script
  - [ ] Verify types are exported correctly to other packages

- [ ] Task 2: Create DatabaseRef FiberRef bridge (AC: #1)
  - [ ] Add DatabaseRef to infrastructure context bridges
  - [ ] Implement getDatabase helper function
  - [ ] Wire up database connection in server layers
  - [ ] Add connection pooling configuration

- [ ] Task 3: Write session management tests (Red Phase - TDD) (AC: #2)
  - [ ] Create `apps/api/src/handlers/__tests__/session-manager.test.ts`
  - [ ] Test: Session creation with unique ID
  - [ ] Test: Messages persisted to database
  - [ ] Test: Precision scores saved and restored
  - [ ] Test: Session resume loads full history (all messages in order)
  - [ ] Test: Session status transitions (active → paused → resumed)
  - [ ] Test: Error handling (SessionNotFoundError, InvalidSessionError)

- [ ] Task 4: Implement session persistence (Green Phase - TDD) (AC: #1-3)
  - [ ] Update `startAssessment` handler to create real session in database
  - [ ] Implement session creation: generate UUID, store userId, createdAt, precision JSON, status='active'
  - [ ] Implement precision score storage in sessions table (JSON field)
  - [ ] Update `sendMessage` handler to persist messages
  - [ ] Implement message persistence: id, sessionId, role, content, createdAt
  - [ ] Ensure all tests pass (green phase)

- [ ] Task 5: Implement session resumption (AC: #2-4)
  - [ ] Update `resumeSession` handler to load from database
  - [ ] Load all messages for session ID in order (createdAt ASC)
  - [ ] Load precision scores from sessions table
  - [ ] Verify load time is <1 second (add query optimization if needed)
  - [ ] Return all messages + current precision + OCEAN code if completed
  - [ ] Add SessionNotFoundError handling

- [ ] Task 6: Implement results retrieval (AC: #2)
  - [ ] Update `getResults` handler to load from database
  - [ ] Retrieve session precision scores
  - [ ] Calculate OCEAN code from precision scores (placeholder algorithm)
  - [ ] Return oceanCode4Letter, precision, traitScores, archetypeName
  - [ ] Handle incomplete assessments (precision < 50%)

- [ ] Task 7: Write integration tests (AC: #2)
  - [ ] Create `apps/api/src/handlers/__tests__/session.integration.test.ts`
  - [ ] Test: Full session lifecycle (create → add messages → resume → continue)
  - [ ] Test: Message history is complete and ordered
  - [ ] Test: Precision scores accurate across resume
  - [ ] Test: Multiple sessions don't interfere with each other
  - [ ] Test: Database transactions ensure consistency

- [ ] Task 8: Documentation & Testing (AC: Documentation & Tests)
  - [ ] Add JSDoc comments to all new functions/classes (SessionManager, DatabaseRef, schema files)
  - [ ] Document Drizzle ORM patterns in packages/database/README.md
  - [ ] Update CLAUDE.md with database schema and session lifecycle patterns
  - [ ] Update README.md with session management architecture section
  - [ ] Ensure unit test coverage ≥100% for session logic
  - [ ] Ensure integration tests cover happy path and error cases
  - [ ] Update story file with completion notes

## Dev Notes

### Session Management Architecture

This story implements the **Server-Side Session Persistence** layer for the big-ocean personality assessment platform. Sessions are the foundation for all subsequent backend features (Nerin agent, scoring, results).

**Session Lifecycle**:
1. **Creation** (`startAssessment`): User starts assessment → generates unique sessionId, stores in PostgreSQL, returns to frontend
2. **Message Exchange** (`sendMessage`): User sends message → persisted to database, precision scores updated
3. **Pause/Disconnect**: Session remains in database with all history intact
4. **Resume** (`resumeSession`): User returns with sessionId → loads all messages + precision from database in <1 second
5. **Continue**: User sends more messages → appended to existing session

**Key Architecture Decisions**:

- **Server-Side State**: All session state stored in PostgreSQL (not frontend local storage)
  - Rationale: Enables device switching, multiple devices, offline safety
  - Contrast: ElectricSQL (local-first) avoided due to encryption complexity
  - Implementation: Full session history in `sessions` table + related `messages` rows

- **Precision Score Storage**: Stored as JSON object in sessions table
  - Structure: `{ openness: 0.75, conscientiousness: 0.82, extraversion: 0.60, agreeableness: 0.88, neuroticism: 0.45 }`
  - Rationale: Denormalization avoids join on every precision update
  - Type-safe: Matches `TraitPrecisionSchema` from Story 1.3 contracts

- **Message Ordering**: Guaranteed via createdAt timestamp + auto-increment ID (if needed)
  - Query: `SELECT * FROM messages WHERE sessionId = ? ORDER BY createdAt ASC`
  - Performance: Index on sessionId for fast retrieval
  - Load time target: <1 second for 100-message history

- **Session Status Tracking**: Enum: 'active', 'paused', 'completed'
  - Rationale: Enables cost guard to skip analysis on paused sessions (Story 2.5)
  - Future: May track pause_reason, last_activity_at for analytics

### Database Schema Details

**Sessions Table**:
```typescript
// packages/database/src/schema.ts
export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),                    // UUID generated
  userId: text("user_id"),                        // NULL for anonymous, filled on signup
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  precision: jsonb("precision").default({         // Trait precision scores
    openness: 0,
    conscientiousness: 0,
    extraversion: 0,
    agreeableness: 0,
    neuroticism: 0,
  }),
  status: text("status").default("active"),       // 'active' | 'paused' | 'completed'
  oceanCode4Letter: text("ocean_code_4letter"),   // HMLH format (populated after Story 3)
  oceanCode5Letter: text("ocean_code_5letter"),   // HMLHM format (future, with Neuroticism)
});

// Indexes for performance
export const sessionUserIndex = index("session_user_idx").on(sessions.userId);
export const sessionStatusIndex = index("session_status_idx").on(sessions.status);
```

**Messages Table**:
```typescript
export const messages = pgTable("messages", {
  id: text("id").primaryKey(),                    // UUID generated
  sessionId: text("session_id")
    .notNull()
    .references(() => sessions.id, { onDelete: "cascade" }),
  role: text("role").notNull(),                   // 'user' | 'assistant'
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Indexes for performance
export const messageSessionIndex = index("message_session_idx").on(messages.sessionId);
export const messageCreatedIndex = index("message_created_idx").on(messages.createdAt);
```

### Effect-ts Patterns to Follow (from Story 1.3)

All session handlers follow the **Effect Layer Composition** pattern established in Story 1.3:

**Handler Structure** (from apps/api/src/handlers/assessment.ts):
```typescript
import * as Effect from "effect";
import * as Rpc from "@effect/rpc/Rpc";
import { AssessmentRpcs } from "@workspace/contracts";
import { getLogger } from "@workspace/infrastructure";

export const AssessmentRpcHandlersLive = AssessmentRpcs.toLayer({
  StartAssessment: ({ userId }: { userId?: string }) =>
    Effect.gen(function* () {
      const logger = yield* getLogger;
      const db = yield* getDatabase;  // NEW: get database FiberRef

      // Implementation
      return { sessionId, createdAt };
    }),
});
```

**DatabaseRef Pattern** (following LoggerRef from infrastructure):
```typescript
// packages/infrastructure/src/context/database.ts
import * as FiberRef from "effect/FiberRef";

export const DatabaseRef = FiberRef.unsafeMake<Drizzle>(undefined as any);

export const getDatabase = Effect.gen(function* () {
  return yield* FiberRef.get(DatabaseRef);
});
```

**Layer Wiring** (in apps/api/src/index.ts):
```typescript
// Create database connection layer
const DatabaseLayer = Layer.succeed(DatabaseRef, drizzleClient);

// Merge into handlers layer
const HandlersLayer = Layer.mergeAll(
  AssessmentRpcHandlersLive,
  ProfileRpcHandlersLive
).pipe(Layer.provide(DatabaseLayer));
```

### Test-First Development (TDD) Pattern

Story 2.1 is a **TDD story** - tests written BEFORE implementation.

**Red Phase** (write failing tests first):
1. Create test file: `apps/api/src/handlers/__tests__/session-manager.test.ts`
2. Write test for each acceptance criterion
3. Run tests - all fail (red)
4. Tests define the contract that implementation must satisfy

**Test Examples** (pseudo-code, full tests in TDD phase):
```typescript
describe("Session Manager", () => {
  it("should create session with unique ID", async () => {
    const result = await callRpc(StartAssessmentRpc, { userId: undefined });
    expect(result.sessionId).toBeDefined();
    expect(result.sessionId).toMatch(/^session_/);
    expect(result.createdAt).toBeDefined();
  });

  it("should persist messages to database", async () => {
    const session = await callRpc(StartAssessmentRpc, {});
    await callRpc(SendMessageRpc, {
      sessionId: session.sessionId,
      message: "Hello",
    });
    const result = await callRpc(ResumeSessionRpc, {
      sessionId: session.sessionId,
    });
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].content).toBe("Hello");
  });

  it("should load full history in <1 second", async () => {
    const session = await callRpc(StartAssessmentRpc, {});
    // Add 100+ messages
    const start = Date.now();
    const result = await callRpc(ResumeSessionRpc, {
      sessionId: session.sessionId,
    });
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(1000);
  });
});
```

**Green Phase** (implement to pass tests):
1. Implement session creation logic
2. Implement message persistence
3. Implement session resumption
4. Run tests - all pass (green)

**Refactor Phase** (clean up while keeping tests green):
1. Extract helper functions
2. Optimize queries
3. Add error handling
4. Improve JSDoc comments

### Project Structure Notes

**Key Locations**:
- Contracts: `packages/contracts/src/assessment.ts` (RPC definitions from Story 1.3)
- Handlers: `apps/api/src/handlers/assessment.ts` (implement session logic here)
- Infrastructure: `packages/infrastructure/src/context/` (add DatabaseRef here)
- Database: `packages/database/src/` (CREATE THIS PACKAGE)
- Tests: `apps/api/src/handlers/__tests__/` (session tests here)
- Server: `apps/api/src/index.ts` (wire up DatabaseRef layer here)

**Naming Conventions** (from codebase):
- Sessions: `session_{uuid}` format (from placeholder in assessment.ts line 27)
- Messages: `msg_{uuid}` format (inferred)
- Functions: camelCase (e.g., `createSession`, `persistMessage`)
- Types: PascalCase (e.g., `Session`, `Message`)
- Database tables: snake_case (e.g., `sessions`, `messages`)
- Test files: `*.test.ts` (Vitest convention)

**Dependencies Within Scope** (from Story 1.3 + architecture):
- `effect`: 3.19.14 (catalog version)
- `@effect/rpc`: 0.73.0 (catalog version)
- `@effect/schema`: 0.71.0 (catalog version)
- `drizzle-orm`: 0.45.1 (catalog version)
- `pg`: PostgreSQL driver (to be installed)
- `vitest`: Testing framework (to be installed)

**Blocked Dependencies**:
- Nerin Agent: Blocked until Story 2.1 complete (needs resumeSession working)
- Precision Scoring: Blocked until Story 2.1 complete (needs message persistence)
- Results Display: Blocked until Story 2.1 complete (needs getResults endpoint)

### References

- **Story 1.3 Complete**: `/Users/vincentlay/Projects/big-ocean/_bmad-output/implementation-artifacts/1-3-configure-effect-ts-rpc-contracts-and-infrastructure-layer.md`
- **RPC Contracts**: `packages/contracts/src/assessment.ts` (lines 14-99)
- **Handler Patterns**: `apps/api/src/handlers/assessment.ts` (lines 18-119)
- **Server Setup**: `apps/api/src/index.ts` (lines 16-72)
- **Infrastructure**: `packages/infrastructure/src/context/` (logger.ts, cost-guard.ts pattern)
- **Epics Reference**: `_bmad-output/planning-artifacts/epics.md` (Story 2.1 requirements, lines 311-371)
- **Architecture Decisions**: `CLAUDE.md` (database, Effect-ts, Drizzle ORM, testing strategy)

## Dev Agent Record

### Agent Model Used

Claude Haiku 4.5 (claude-haiku-4-5-20251001)

### Debug Log References

- Artifact Analysis completed: Explored database patterns, Effect-ts architecture, testing frameworks, git history
- Story context extracted from epics.md (lines 311-371)
- Handler patterns verified from Story 1.3 implementation
- RPC contract definitions confirmed in packages/contracts/src/

### Completion Notes List

**Before Starting Implementation**:
1. ✅ Understand Story 1.3 complete (RPC contracts, FiberRef bridges, HTTP server ready)
2. ✅ Review database patterns in project (Drizzle ORM structure)
3. ✅ Confirm test framework (Vitest, TDD red-green-refactor)
4. ✅ Identify all RPC handlers that need implementation (StartAssessment, SendMessage, GetResults, ResumeSession)
5. ✅ Map database schema to contract schemas (MessageSchema, TraitPrecisionSchema match)

**During Implementation**:
1. Create packages/database with Drizzle ORM schemas
2. Create DatabaseRef FiberRef bridge (following LoggerRef pattern)
3. Write failing tests first (TDD red phase)
4. Implement handlers to pass tests (TDD green phase)
5. Optimize queries for <1 second load time
6. Add error handling (SessionNotFoundError, etc.)
7. Wire up database layer in server index.ts

**After Implementation**:
1. All unit tests pass with ≥100% coverage
2. All integration tests pass with real database
3. Verify load time <1 second for 100-message history
4. Update README.md with session architecture
5. Update CLAUDE.md with database patterns
6. Mark story ready-for-dev → in-progress → review → done

### File List

**To Create**:
- `packages/database/package.json`
- `packages/database/src/schema.ts`
- `packages/database/src/index.ts`
- `packages/infrastructure/src/context/database.ts` (DatabaseRef bridge)
- `apps/api/src/handlers/__tests__/session-manager.test.ts`
- `apps/api/src/handlers/__tests__/session.integration.test.ts`

**To Modify**:
- `apps/api/src/handlers/assessment.ts` (implement real handlers)
- `apps/api/src/index.ts` (wire up DatabaseRef layer)
- `packages/infrastructure/src/index.ts` (export DatabaseRef)
- `packages/infrastructure/src/context/index.ts` (export getDatabase helper)
- `README.md` (add session management architecture section)
- `CLAUDE.md` (add database schema and session lifecycle patterns)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (update story status)

**Updated Files After Completion**:
- `apps/api/src/handlers/assessment.ts` (all 4 handlers implemented)
- `packages/database/src/schema.ts` (sessions + messages tables)
- `packages/infrastructure/src/context/database.ts` (DatabaseRef + pool management)
- Test files with ≥100% coverage
- Documentation files with updated architecture

