# Test-Driven Development (TDD) Guide

This guide explains the TDD workflow for big-ocean and provides examples for implementing new features following the red-green-refactor cycle.

## Table of Contents

- [TDD Philosophy](#tdd-philosophy)
- [Red-Green-Refactor Cycle](#red-green-refactor-cycle)
- [Testing Stack](#testing-stack)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [Test Utilities](#test-utilities)
- [Best Practices](#best-practices)
- [Examples](#examples)

## TDD Philosophy

**Test-Driven Development** is a software development approach where tests are written before implementation code. This ensures:

1. **Requirements Clarity**: Writing tests first forces you to think through requirements
2. **Design Quality**: Tests drive cleaner, more modular API design
3. **Confidence**: Comprehensive test coverage provides confidence when refactoring
4. **Documentation**: Tests serve as living documentation of behavior

## Red-Green-Refactor Cycle

TDD follows a three-phase cycle:

### 🔴 RED: Write a Failing Test

Write a test for the next bit of functionality you want to add. The test should fail because the functionality doesn't exist yet.

```typescript
it("should calculate openness score from user responses", () => {
  const scorer = new TraitScorer()
  const messages = [
    "I love trying new experiences",
    "I'm curious about different cultures",
  ]

  const score = scorer.calculateOpenness(messages)

  expect(score).toBeGreaterThan(0.6) // Will fail - calculateOpenness doesn't exist
})
```

### 🟢 GREEN: Make the Test Pass

Write the minimum code necessary to make the test pass. Don't worry about perfection yet.

```typescript
export class TraitScorer {
  calculateOpenness(messages: string[]): number {
    // Simplest implementation that passes the test
    return 0.7
  }
}
```

### 🔵 REFACTOR: Improve the Code

Now that the test passes, improve the implementation while keeping tests green.

```typescript
export class TraitScorer {
  calculateOpenness(messages: string[]): number {
    const keywords = ["curious", "experience", "new", "culture", "creative"]
    let score = 0.5 // Baseline

    messages.forEach((message) => {
      keywords.forEach((keyword) => {
        if (message.toLowerCase().includes(keyword)) {
          score += 0.05
        }
      })
    })

    return Math.min(score, 1.0) // Cap at 1.0
  }
}
```

## Testing Stack

- **Framework**: [Vitest](https://vitest.dev/) - Fast, ESM-native test framework
- **UI**: `pnpm test:ui` for interactive test browser
- **Coverage**: v8 provider with HTML/JSON reports
- **Mocking**: Custom Effect-based mocks in `@workspace/domain/test-utils`
- **Assertions**: Vitest's expect API (Jest-compatible)

## Running Tests

```bash
# Run all tests once
pnpm test:run

# Run tests in watch mode (re-runs on file changes)
pnpm test:watch

# Run specific test file
pnpm test:run packages/domain/src/__tests__/trait-scorer.test.ts

# Open interactive test UI
pnpm test:ui

# Generate coverage report
pnpm test:coverage
```

## Writing Tests

### Test File Structure

Place test files in `__tests__` directories alongside source code:

```
packages/domain/src/
├── trait-scorer.ts
├── __tests__/
│   └── trait-scorer.test.ts
```

### Test Anatomy

```typescript
import { describe, it, expect, beforeEach } from "vitest"
import { TraitScorer } from "../trait-scorer"

describe("TraitScorer", () => {
  let scorer: TraitScorer

  beforeEach(() => {
    scorer = new TraitScorer() // Fresh instance for each test
  })

  describe("calculateOpenness", () => {
    it("should return baseline score for empty messages", () => {
      const score = scorer.calculateOpenness([])
      expect(score).toBe(0.5)
    })

    it("should increase score for openness keywords", () => {
      const score = scorer.calculateOpenness(["I'm very curious"])
      expect(score).toBeGreaterThan(0.5)
    })

    it("should cap scores at 1.0", () => {
      const messages = Array(100).fill("curious creative new experience")
      const score = scorer.calculateOpenness(messages)
      expect(score).toBeLessThanOrEqual(1.0)
    })
  })
})
```

## Test Utilities

The project provides test utilities in `@workspace/domain/test-utils`:

```typescript
import {
  mockNerin,
  mockAnalyzer,
  mockScorer,
  mockDatabase,
  mockCostGuard,
  mockRateLimiter,
  createTestSession,
} from "@workspace/domain/test-utils"

// Mock conversational agent
const response = await Effect.runPromise(mockNerin("Tell me about yourself"))

// Mock database
const db = mockDatabase()
await Effect.runPromise(db.sessions.insert(createTestSession()))

// Mock cost tracking
const costGuard = mockCostGuard()
await Effect.runPromise(costGuard.trackUsage({ input: 1000, output: 500 }))
```

## Best Practices

### 1. One Assertion Per Test (Usually)

```typescript
// ✅ Good: Clear, focused test
it("should return 0.5 for baseline openness", () => {
  expect(scorer.calculateOpenness([])).toBe(0.5)
})

// ❌ Bad: Multiple unrelated assertions
it("should handle various scenarios", () => {
  expect(scorer.calculateOpenness([])).toBe(0.5)
  expect(scorer.calculateConscientiousness([])).toBe(0.5)
  expect(scorer.calculateExtraversion([])).toBe(0.5)
})
```

### 2. Descriptive Test Names

```typescript
// ✅ Good: Describes what and why
it("should increase openness score when 'curious' keyword is present", () => {})

// ❌ Bad: Vague description
it("should work correctly", () => {})
```

### 3. Arrange-Act-Assert Pattern

```typescript
it("should calculate average score from multiple messages", () => {
  // Arrange: Set up test data
  const messages = [
    "I love trying new things",
    "I prefer routine and familiarity",
  ]

  // Act: Execute the behavior
  const score = scorer.calculateOpenness(messages)

  // Assert: Verify the outcome
  expect(score).toBeCloseTo(0.55, 2)
})
```

### 4. Test Effect-Based Code

```typescript
it("should handle Effect-based services", async () => {
  const effect = Effect.gen(function* () {
    const db = yield* DatabaseRef.get()
    const session = yield* db.sessions.findById("session_123")
    return session
  })

  const result = await Effect.runPromise(effect)
  expect(result).toBeDefined()
})
```

### 5. Test Error Scenarios

```typescript
it("should fail when session ID format is invalid", () => {
  const effect = Effect.gen(function* () {
    const session = createTestSession({ id: "invalid_format" })
    return yield* SessionSchema.validate(session)
  })

  const exit = await Effect.runPromiseExit(effect)
  expect(Exit.isFailure(exit)).toBe(true)
})
```

## Examples

### Example 1: Testing Effect Services

```typescript
import { describe, it, expect } from "vitest"
import { Effect } from "effect"
import { SessionManager } from "../session-manager"
import { mockDatabase, createTestSession } from "@workspace/domain/test-utils"

describe("SessionManager", () => {
  it("should create new session with generated ID", async () => {
    const db = mockDatabase()
    const manager = new SessionManager(db)

    const effect = manager.createSession({ userId: "user_123" })
    const session = await Effect.runPromise(effect)

    expect(session.id).toMatch(/^session_/)
    expect(session.userId).toBe("user_123")
  })

  it("should resume existing session", async () => {
    const db = mockDatabase()
    const existingSession = createTestSession({ id: "session_abc" })
    await Effect.runPromise(db.sessions.insert(existingSession))

    const manager = new SessionManager(db)
    const resumed = await Effect.runPromise(manager.resumeSession("session_abc"))

    expect(resumed).toEqual(existingSession)
  })
})
```

### Example 2: Testing Schema Validation

```typescript
import { describe, it, expect } from "vitest"
import * as S from "@effect/schema/Schema"
import { Either } from "effect"
import { PersonalityTraitsSchema } from "../schemas"

describe("PersonalityTraitsSchema", () => {
  it("should validate valid trait scores", () => {
    const traits = {
      openness: 0.7,
      conscientiousness: 0.8,
      extraversion: 0.5,
      agreeableness: 0.9,
      neuroticism: 0.3,
    }

    const result = S.decodeUnknownEither(PersonalityTraitsSchema)(traits)

    expect(Either.isRight(result)).toBe(true)
  })

  it("should reject scores outside 0-1 range", () => {
    const traits = {
      openness: 1.5, // Invalid
      conscientiousness: 0.8,
      extraversion: 0.5,
      agreeableness: 0.9,
      neuroticism: 0.3,
    }

    const result = S.decodeUnknownEither(PersonalityTraitsSchema)(traits)

    expect(Either.isLeft(result)).toBe(true)
  })
})
```

### Example 3: Testing Async Operations

```typescript
import { describe, it, expect } from "vitest"
import { Effect } from "effect"
import { NerinAgent } from "../nerin-agent"
import { mockAnthropicResponse } from "@workspace/domain/test-utils"

describe("NerinAgent", () => {
  it("should generate conversational response", async () => {
    const agent = new NerinAgent({
      anthropic: {
        messages: {
          create: () => mockAnthropicResponse("Thank you for sharing that."),
        },
      },
    })

    const effect = agent.respond({
      sessionId: "session_123",
      message: "I love trying new things",
    })

    const response = await Effect.runPromise(effect)

    expect(response).toContain("Thank you")
  })
})
```

## Coverage Goals

- **Domain Logic**: 100% coverage (core business rules)
- **Services**: ≥95% coverage (backend services, handlers)
- **UI Components**: ≥80% coverage (React components)
- **Overall**: ≥80% coverage baseline

Check coverage with:

```bash
pnpm test:coverage
# Open coverage/index.html to view detailed report
```

## Continuous Integration

Tests run automatically on every PR via GitHub Actions:

```yaml
# .github/workflows/test.yml
- name: Run tests
  run: pnpm test:run

- name: Check coverage
  run: pnpm test:coverage
```

## Next Steps

For your next feature:

1. **Read the story acceptance criteria**
2. **Write failing tests** for each acceptance criterion
3. **Implement the minimum code** to make tests pass
4. **Refactor** while keeping tests green
5. **Check coverage** to ensure all paths tested
6. **Commit with tests and implementation together**

Happy testing! 🎉
