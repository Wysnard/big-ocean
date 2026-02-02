# Decision 5: Testing Strategy ✅

**Scope:** Unit, integration, E2E, and LLM/agent testing for full-stack system with multi-agent orchestration.

**Core Principle:** Tests run locally in seconds without external services (except CI/CD).

## Testing Challenges

| Challenge | Solution |
|-----------|----------|
| LangGraph agent testing | Mock Anthropic API for deterministic tests |
| TanStack Query caching | Test optimistic updates via mutation hooks |
| Cost tracking | Mock token counts, verify rate limiting |
| Authentication | Test Better Auth flow + RPC coordination |
| OCEAN code determinism | Verify same inputs → same 5-letter code |

---

## Decision 5A: Unit Testing Framework

**Selected:** Vitest

| Aspect | Decision |
|--------|----------|
| Framework | Vitest (native ESM, Effect-friendly, monorepo optimized) |
| Primary Target | Use-cases (business logic with mock repositories) |
| Secondary Target | Domain utilities (pure functions: OCEAN code, cost calc) |
| Infrastructure | Tested via integration tests, not unit tests |

### Unit Testing Pattern (Hexagonal Architecture)

```typescript
// Pattern: Test use-cases with mock repositories via Layer.succeed()

// 1. Create test implementations
const TestSessionRepo = Layer.succeed(
  AssessmentSessionRepository,
  AssessmentSessionRepository.of({
    getSession: (sessionId) => Effect.succeed({ id: sessionId, ... }),
    updateSession: (sessionId, data) => Effect.succeed(undefined),
  })
);

// 2. Merge all test layers
const TestLayer = Layer.mergeAll(TestSessionRepo, TestMessageRepo, TestLogger);

// 3. Run use-case with test layer
await Effect.runPromise(
  sendMessage({ sessionId: "test", message: "Hello" })
    .pipe(Effect.provide(TestLayer))
);

// 4. Test error cases by injecting failing repositories
const FailingRepo = Layer.succeed(Repository, {
  getSession: () => Effect.fail(new SessionNotFound({ sessionId })),
});
```

### Key Principles

- Use-cases are the primary unit test boundary
- Mock repositories via `Layer.succeed()` with test implementations
- Test business logic, not database queries
- No I/O, no database, no external services in unit tests
- `Effect.provide()` injects test layers at runtime

---

## Decision 5B: Integration Testing

**Selected:** Vitest + TestContainers

| Aspect | Decision |
|--------|----------|
| Database | TestContainers (PostgreSQL 16) |
| Scope | RPC contracts with actual database |
| Mocking | Mock Anthropic API, real database |

### Integration Testing Pattern

```typescript
// Pattern: TestContainers for database integration tests

// 1. Start container in beforeAll
const testEnv = await testDb.start(); // GenericContainer("postgres:16")
await testEnv.runMigrations();

// 2. Test with real database
const result = await Effect.runPromise(
  handlers.startAssessment({ userId: "user123" })
    .pipe(Effect.provide(testEnv.layer))
);

// 3. Verify database state
const session = await testEnv.db.query.sessions.findFirst({
  where: (s) => s.id.equals(result.sessionId),
});

// 4. Cleanup in afterAll
await testEnv.cleanup();
```

---

## Decision 5C: E2E Testing

**Selected:** Playwright

| Aspect | Decision |
|--------|----------|
| Framework | Playwright (multi-browser, faster than Cypress) |
| Browsers | Chromium, Firefox, WebKit |
| Selectors | `data-testid` attributes |
| Server | Auto-start via `webServer` config |

### E2E Testing Pattern

```typescript
// Pattern: Playwright with data-testid selectors

// Key selectors used throughout E2E tests:
// - [data-testid='message-input'] - Chat input field
// - [data-testid='send-button'] - Send message button
// - [data-testid='nerin-message'] - AI response messages
// - [data-testid='user-message'] - User messages
// - [data-testid='precision-bar'] - Precision indicator
// - [data-testid='ocean-code-4letter'] - OCEAN code display
// - [data-testid='archetype-name'] - Archetype name display
// - [data-testid='share-link'] - Public share link input

// Test flow:
await page.click("button:has-text('Start Assessment')");
await page.fill("[data-testid='message-input']", message);
await page.click("[data-testid='send-button']");
await expect(page.locator("[data-testid='nerin-message']")).toContainText(/response/i);
```

### Playwright Config Summary

| Setting | Value |
|---------|-------|
| testDir | `./e2e` |
| baseURL | `http://localhost:3001` |
| retries (CI) | 2 |
| trace | `on-first-retry` |
| screenshot | `only-on-failure` |

---

## Decision 5D: LLM/Agent Testing

**Strategy:** Mock Anthropic API for deterministic tests

### Mock Anthropic Pattern

```typescript
// Pattern: Mock API with configurable responses and token counts

interface MockAnthropicApi {
  setMockResponse(pattern: string, response: string): void;
  setTokenCounts(input: number, output: number): void;
  create(params: any): Promise<MockResponse>;
}

// Usage in tests:
mockAnthropicApi.setTokenCounts(100, 50);
mockAnthropicApi.setMockResponse("score", JSON.stringify({ openness: 18, ... }));

const graph = createOrchestratorGraph(mockAnthropicApi);
const result = await graph.invoke(state);
```

### LLM Test Cases

| Test Case | Verification |
|-----------|--------------|
| Analyzer triggers every 3 messages | `messageCount % 3 === 0` triggers analysis |
| Cost limit skips analysis | Low `remainingBudget` routes only to Nerin |
| OCEAN code determinism | Same messages → same `oceanCode4Letter` |
| Token counting | Mock tokens match expected cost calculation |

---

## Test Coverage Goals (MVP)

| Layer | Coverage | Priority |
|-------|----------|----------|
| Domain Logic (OCEAN, cost, precision) | 100% | Critical |
| RPC Contracts (sendMessage, startAssessment) | 90%+ | Critical |
| Database Queries (Drizzle) | 80%+ | High |
| LangGraph Routing | 85%+ | High |
| Authentication Flow | 70%+ | High |
| Error Handling | 90%+ | Critical |
| E2E Happy Path | 100% | Critical |
| UI Components | 60% unit + Storybook docs | High |
| Accessibility | 100% checklist via Storybook | Critical |

---

## Decision 5E: Component Documentation (Storybook)

**Selected:** Storybook 10+ with Vitest & Accessibility Testing

| Aspect | Decision |
|--------|----------|
| Framework | Storybook React Vite |
| Addons | essentials, interactions, a11y |
| Autodocs | Enabled via `tags: ["autodocs"]` |
| Visual Regression | Deferred to Phase 2 (Chromatic) |

### Story Structure Pattern

```typescript
// Pattern: Every component story includes:

const meta = {
  component: Button,
  title: "Components/Button",
  tags: ["autodocs"],           // Auto-generate docs
  argTypes: {                   // Document all props
    variant: { control: "select", options: [...] },
  },
} satisfies Meta<typeof Button>;

// Required stories per component:
// 1. Default - Primary usage
// 2. Variants - All visual variants
// 3. Disabled - Disabled state
// 4. Interactive - play() function with userEvent
// 5. Accessible - play() function verifying a11y
```

### Accessibility Testing

- `@storybook/addon-a11y` checks every story automatically
- Verifies: color contrast, ARIA attributes, keyboard navigation
- Stories can disable specific rules with justification

---

## Test Organization

```
packages/ui/src/components/
  button.tsx
  button.stories.tsx    # Storybook + docs
  button.test.tsx       # Unit tests

apps/api/src/
  use-cases/
    send-message.use-case.ts
    __tests__/
      send-message.test.ts        # Unit tests (mock repos)
  __tests__/
    assessment.integration.test.ts # Integration tests (TestContainers)

apps/front/
  e2e/
    assessment-flow.spec.ts       # Playwright E2E tests
```

---

## Testing Summary

| Test Type | Tool | Location | Target |
|-----------|------|----------|--------|
| Unit | Vitest | `__tests__/*.test.ts` | Use-cases, domain utilities |
| Integration | Vitest + TestContainers | `__tests__/*.integration.test.ts` | RPC + database |
| E2E | Playwright | `e2e/*.spec.ts` | Full user flows |
| Component | Storybook | `*.stories.tsx` | UI components |
| LLM/Agent | Vitest + Mock Anthropic | `__tests__/*.test.ts` | LangGraph state machine |
