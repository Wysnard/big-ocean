# Integration Tests

> Tier 2 integration tests that validate the complete HTTP stack (Docker build + PostgreSQL + API endpoints) in a production-like environment.

## Quick Start

```bash
# Run all integration tests (automatic Docker lifecycle)
pnpm test:integration

# Run in watch mode (for development)
pnpm test:integration:watch

# Manual Docker control (for debugging)
pnpm docker:test:up   # Start test environment
pnpm docker:test:down # Stop and clean up
```

## Architecture

Integration tests run on the **HOST machine** and make real HTTP requests to a **Dockerized API**:

```
┌─────────────────────┐      HTTP        ┌─────────────────────────────────┐
│   Host Machine      │  ──────────────► │  Docker: compose.test.yaml      │
│   (Vitest tests)    │   localhost:4001 │                                 │
│                     │                  │  ┌─────────────┐                │
│  • health.test.ts   │                  │  │  api-test   │ port 4000      │
│  • assessment.test  │                  │  │ (production │────────────────┤
│                     │                  │  │  Dockerfile)│                │
└─────────────────────┘                  │  └──────┬──────┘                │
                                         │         │                       │
                                         │         ▼                       │
                                         │  ┌─────────────┐                │
                                         │  │postgres-test│ port 5432      │
                                         │  │ PostgreSQL  │ (host: 5433)   │
                                         │  └─────────────┘                │
                                         └─────────────────────────────────┘
```

## Key Design Decisions

### 1. Tests Run on Host (Not in Container)

**Why:** Enables full Vitest ecosystem:
- Watch mode for rapid iteration
- Vitest UI for debugging
- Native debugging with breakpoints
- Faster feedback loop

### 2. Production Dockerfile Target

**Why:** Validates the actual deployment artifact:
- Same Docker image as Railway deployment
- Catches "works on my machine" bugs
- Tests real startup sequence and migrations

### 3. Mock LLM via Layer Swapping

**Why:** Zero Anthropic API costs:
- `MOCK_LLM=true` environment variable
- Pattern-based responses that mimic real Nerin
- Deterministic for reliable test assertions
- Same Effect Layer interface

### 4. Separate Ports from Development

| Service       | Dev Port | Test Port |
|---------------|----------|-----------|
| PostgreSQL    | 5432     | 5433      |
| API           | 4000     | 4001      |

**Why:** Can run dev and test environments simultaneously.

## Test Structure

```
tests/integration/
├── README.md           # This file
├── health.test.ts      # GET /health - simplest test, validates Docker setup
└── assessment.test.ts  # Assessment endpoints - start, message, resume
```

### What Each Test Validates

#### `health.test.ts`
- Docker image builds successfully
- PostgreSQL container starts and accepts connections
- Database migrations run
- Effect HTTP server starts
- `/health` endpoint returns correct schema

#### `assessment.test.ts`
- `POST /api/assessment/start` creates session
- `POST /api/assessment/message` processes message
- Response schemas match contracts exactly
- Database persistence (sessions and messages saved)
- Mock LLM responds appropriately
- Error handling (404 for non-existent sessions)

## Environment Variables

Set automatically by `vitest.config.integration.ts`:

| Variable  | Value                     | Description                    |
|-----------|---------------------------|--------------------------------|
| API_URL   | http://localhost:4001     | API endpoint for tests         |

## Lifecycle Scripts

### `scripts/integration-setup.ts`
1. Cleans up lingering containers
2. Starts Docker Compose (`docker compose -f compose.test.yaml up -d --build`)
3. Polls `/health` until API is ready
4. 90-second timeout (generous for first build)
5. On failure: prints Docker logs for debugging

### `scripts/integration-teardown.ts`
1. Stops containers (`docker compose -f compose.test.yaml down`)
2. Removes volumes (`-v` flag for clean slate)
3. Always runs (even if tests fail)

## Troubleshooting

### Tests timing out

```bash
# Check if Docker services are running
docker compose -f compose.test.yaml ps

# View logs
docker compose -f compose.test.yaml logs

# Check API health manually
curl http://localhost:4001/health
```

### Port conflicts

```bash
# Check what's using port 4001
lsof -i :4001

# Force cleanup
pnpm docker:test:down
```

### Stale containers

```bash
# Full cleanup
docker compose -f compose.test.yaml down -v --remove-orphans
docker system prune -f  # Optional: clean all unused Docker resources
```

### Database issues

```bash
# Connect to test database
docker compose -f compose.test.yaml exec postgres-test psql -U test_user -d bigocean_test
```

## Writing New Integration Tests

1. **Use real HTTP requests** - No mocking fetch or internal use-case calls
2. **Validate with Effect Schema** - Enforce contract compliance
3. **Test full round-trip** - Create → Use → Verify persistence
4. **Keep tests independent** - Each test should work in isolation

Example pattern:

```typescript
import { Schema } from "effect";
import { describe, expect, test } from "vitest";
import { MyResponseSchema } from "@workspace/contracts";

const API_URL = process.env.API_URL || "http://localhost:4001";

describe("POST /api/my-endpoint", () => {
  test("creates resource with valid schema", async () => {
    const response = await fetch(`${API_URL}/api/my-endpoint`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "value" }),
    });

    expect(response.status).toBe(200);

    const data = await response.json();
    const decoded = Schema.decodeUnknownSync(MyResponseSchema)(data);

    expect(decoded.field).toBeDefined();
  });
});
```

## Related Documentation

- [CLAUDE.md](../../../../CLAUDE.md) - Project patterns and architecture
- [compose.test.yaml](../../../../compose.test.yaml) - Docker Compose test configuration
- [Story 2.8](../../../../_bmad-output/implementation-artifacts/2-8-docker-setup-for-integration-testing.md) - Implementation story
