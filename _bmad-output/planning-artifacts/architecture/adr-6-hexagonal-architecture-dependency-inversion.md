# ADR-6: Hexagonal Architecture & Dependency Inversion ✅

**Decision:** Implement hexagonal (ports & adapters) architecture using Effect-ts Context.Tag for dependency inversion.

**Layers:** Contracts → Handlers → Use-Cases → Domain (interfaces) ← Infrastructure (injected)

---

## Layer Structure

```
┌─────────────────────────────────────────────────────────────────┐
│ Contracts (packages/contracts)                                  │
│ • HTTP API contracts (@effect/platform)                         │
│ • Request/Response schemas shared frontend/backend              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Handlers (apps/api/src/handlers) - ADAPTERS (Driving)          │
│ • HTTP controllers - NO business logic                          │
│ • Transform HTTP ↔ use-case inputs/outputs                      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Use-Cases (apps/api/src/use-cases) - APPLICATION LAYER         │
│ • Pure business logic functions                                 │
│ • Main target for unit testing                                  │
│ • Depend on domain interfaces (repositories)                    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Domain (packages/domain) - CORE (Ports)                        │
│ • Repository interfaces (Context.Tag)                           │
│ • Entity schemas (Effect Schema)                                │
│ • Pure abstractions - no implementation                         │
└─────────────────────────────────────────────────────────────────┘
                              ↑ (dependency inversion)
┌─────────────────────────────────────────────────────────────────┐
│ Infrastructure (packages/infrastructure) - ADAPTERS (Driven)   │
│ • Repository implementations (Layer.effect)                     │
│ • Database (Drizzle), External APIs, Logging (Pino)            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Dependency Flow

```
Handlers → Use-Cases → Domain (interfaces)
                          ↑
                   Infrastructure (injected)
```

**Key Principle:** Dependencies point INWARD toward domain abstractions.

---

## Implementation Patterns

### Domain Layer: Context.Tag for Interfaces

```typescript
// packages/domain/src/repositories/assessment-message.repository.ts
export class AssessmentMessageRepository extends Context.Tag(
  "AssessmentMessageRepository"
)<
  AssessmentMessageRepository,
  {
    readonly saveMessage: (sessionId: string, role: "user" | "assistant", content: string, userId?: string)
      => Effect.Effect<AssessmentMessageEntity, DatabaseError, never>;
    readonly getMessages: (sessionId: string)
      => Effect.Effect<AssessmentMessageEntity[], DatabaseError, never>;
    readonly getMessageCount: (sessionId: string)
      => Effect.Effect<number, DatabaseError, never>;
  }
>() {}
```

### Infrastructure Layer: Layer.effect for Implementations

```typescript
// packages/infrastructure/src/repositories/assessment-message.drizzle.repository.ts
export const AssessmentMessageDrizzleRepositoryLive = Layer.effect(
  AssessmentMessageRepository,
  Effect.gen(function* () {
    const db = yield* Database;
    const logger = yield* LoggerRepository;

    return AssessmentMessageRepository.of({
      saveMessage: (sessionId, role, content, userId) =>
        Effect.gen(function* () {
          const [message] = yield* db.insert(assessmentMessage).values({...}).returning();
          return yield* Schema.decodeUnknown(AssessmentMessageEntitySchema)(message);
        }),
      // ... other methods
    });
  })
);
```

### Use-Cases Layer: Pure Business Logic

```typescript
// apps/api/src/use-cases/send-message.use-case.ts
export const sendMessage = (input: SendMessageInput): Effect.Effect<
  SendMessageOutput,
  DatabaseError | SessionNotFound,
  AssessmentSessionRepository | AssessmentMessageRepository | LoggerRepository
> =>
  Effect.gen(function* () {
    const sessionRepo = yield* AssessmentSessionRepository;
    const messageRepo = yield* AssessmentMessageRepository;
    const logger = yield* LoggerRepository;

    const session = yield* sessionRepo.getSession(input.sessionId);
    yield* messageRepo.saveMessage(input.sessionId, "user", input.message, input.userId);
    // ... business logic
    return { response, precision };
  });
```

### Handlers Layer: Thin HTTP Adapters

```typescript
// apps/api/src/handlers/assessment.ts
export const AssessmentGroupLive = HttpApiBuilder.group(BigOceanApi, "assessment", (handlers) =>
  Effect.gen(function* () {
    return handlers
      .handle("sendMessage", ({ payload }) =>
        Effect.gen(function* () {
          const result = yield* sendMessage({ sessionId: payload.sessionId, message: payload.message });
          return { response: result.response, precision: result.precision };
        })
      );
  })
);
```

---

## Naming Conventions

| Pattern | Example | Purpose |
|---------|---------|---------|
| `*.drizzle.repository.ts` | `assessment-message.drizzle.repository.ts` | Drizzle ORM implementation |
| `*.pino.repository.ts` | `logger.pino.repository.ts` | Pino logger implementation |
| `*RepositoryLive` | `AssessmentMessageDrizzleRepositoryLive` | Effect Layer (production) |
| `*RepositoryTest` | `AssessmentMessageTestRepositoryLive` | Effect Layer (testing) |

---

## Testing Pattern

**Use-cases are the primary unit test boundary** - inject test implementations via Layer.succeed:

```typescript
// Test implementations
const TestSessionRepo = Layer.succeed(
  AssessmentSessionRepository,
  AssessmentSessionRepository.of({
    getSession: (sessionId) => Effect.succeed({ id: sessionId, ... }),
    updateSession: (sessionId, data) => Effect.succeed(undefined),
  })
);

const TestLayer = Layer.mergeAll(TestSessionRepo, TestMessageRepo, TestLogger);

// Run with test layer
await Effect.runPromise(
  sendMessage({ sessionId: "test", message: "Hello" })
    .pipe(Effect.provide(TestLayer))
);

// Test error cases
const FailingRepo = Layer.succeed(Repository, {
  getSession: () => Effect.fail(new SessionNotFound({ sessionId })),
});
```

| Test Type | Repositories | Target |
|-----------|--------------|--------|
| Unit | Test implementations | Use-cases (business logic) |
| Integration | Live implementations | Use-cases + database |
| E2E | Live implementations | Handlers + full stack |

---

## File Locations

| Component | Location |
|-----------|----------|
| Repository interfaces | `packages/domain/src/repositories/` |
| Repository implementations | `packages/infrastructure/src/repositories/` |
| Use-cases | `apps/api/src/use-cases/` |
| Use-case tests | `apps/api/src/use-cases/__tests__/` |
| HTTP handlers | `apps/api/src/handlers/` |

---

## Benefits

| Benefit | Description |
|---------|-------------|
| Testability | Use-cases tested in isolation with mock repositories |
| Flexibility | Swap implementations without changing business logic |
| Clarity | Each layer has single responsibility |
| Effect-ts Native | Context.Tag + Layer system for DI |
| Scalability | Add use-cases without affecting existing code |

