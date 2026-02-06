# E2E Testing Architecture

## How E2E Tests Work with Full Stack

### The Full Picture

```
┌─────────────────────────────────────────────────────────────┐
│  Playwright Test Runner                                     │
│  - Runs in Node.js on your machine                          │
│  - Controls browser automation                               │
│  - Takes screenshots, records videos                         │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ launches
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Browser (Chromium/Firefox/WebKit)                          │
│  - Real browser instances                                   │
│  - Navigates to http://localhost:3000                       │
│  - Executes JavaScript, renders UI                          │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP requests
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Frontend Dev Server (Vite) - Port 3000                     │
│  - Serves React app                                          │
│  - Hot module replacement                                    │
│  - Configured to call API on port 4001                       │
│    (via VITE_API_URL=http://localhost:4001)                 │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ API calls
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  🐳 Docker Compose Test Environment                          │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  API Container - Port 4001                            │  │
│  │  - Effect-ts backend                                  │  │
│  │  - MOCK_LLM=true (no Anthropic API costs)            │  │
│  │  - Better Auth                                        │  │
│  │  - LangGraph orchestration (mocked)                   │  │
│  └───────────────────────────────────────────────────────┘  │
│           │                        │                         │
│           │ queries                │ cache                   │
│           ▼                        ▼                         │
│  ┌──────────────────┐    ┌──────────────────┐              │
│  │  PostgreSQL      │    │  Redis           │              │
│  │  Port 5433       │    │  Port 6380       │              │
│  │  - Test DB       │    │  - Sessions      │              │
│  │  - Isolated      │    │  - Cost tracking │              │
│  └──────────────────┘    └──────────────────┘              │
└─────────────────────────────────────────────────────────────┘
```

---

## Port Allocation Strategy

### Development Environment (compose.yaml)
- Frontend: **3000**
- API: **4000**
- PostgreSQL: **5432**
- Redis: **6379**

### Test Environment (compose.test.yaml)
- Frontend: **3000** (same - reuses dev server)
- API: **4001** (isolated)
- PostgreSQL: **5433** (isolated)
- Redis: **6380** (isolated)

**Why different ports?** This allows you to run dev and tests simultaneously without conflicts!

---

## Test Data Isolation

### Database Isolation
- Test DB: `bigocean_test` on port 5433
- Dev DB: `bigocean` on port 5432
- Each has its own schema and data
- Tests can't corrupt dev data

### LLM Mocking
```yaml
# In compose.test.yaml
MOCK_LLM: "true"
ANTHROPIC_API_KEY: "sk-test-dummy-key"
```

**Benefits:**
- ✅ Zero Anthropic API costs
- ✅ Deterministic test responses
- ✅ Fast test execution (no network calls)
- ✅ Works offline

---

## Test Lifecycle

### 1. Setup Phase
```bash
pnpm docker:test:up
```
- Starts PostgreSQL (with test schema)
- Starts Redis
- Starts API container (waits for health check)
- API runs migrations on startup

### 2. Test Execution
```bash
pnpm test:e2e
```
- Playwright starts frontend dev server
- Frontend connects to API on port 4001
- Browser navigates to http://localhost:3000
- Tests interact with real UI → real API → real DB
- All LLM calls are mocked (no external APIs)

### 3. Teardown Phase
```bash
pnpm docker:test:down
```
- Stops all containers
- Removes test data volumes
- Cleans up networks

---

## What Gets Tested End-to-End

### Real Components
✅ **Frontend:** Real React components, TanStack Router, forms
✅ **API:** Real Effect-ts handlers, use-cases, repositories
✅ **Database:** Real PostgreSQL queries, transactions, constraints
✅ **Redis:** Real session storage, cost tracking
✅ **Better Auth:** Real authentication flows, cookies, sessions

### Mocked Components
🎭 **LLM (Claude):** Mocked with deterministic responses
🎭 **External APIs:** Mocked (if any)

---

## Configuration Files

### Playwright Config (`playwright.config.ts`)
```typescript
webServer: {
  command: "VITE_API_URL=http://localhost:4001 pnpm dev",
  url: "http://localhost:3000",
  reuseExistingServer: !process.env.CI,
}
```

**What it does:**
- Starts Vite dev server on port 3000
- Configures frontend to call API on port 4001
- Reuses existing server if already running

### Docker Compose Test (`compose.test.yaml`)
- PostgreSQL: `bigocean_test` database
- Redis: Test instance
- API: Production Dockerfile with test env vars
- Health checks: Ensures services are ready

---

## Testing Strategy

### Unit Tests (Vitest)
- **Scope:** Individual functions, components
- **Speed:** Very fast (<1s)
- **Isolation:** Full mocking
- **Location:** `apps/*/src/**/*.test.ts`

### Integration Tests (Vitest + Docker)
- **Scope:** API endpoints, use-cases
- **Speed:** Fast (~5s)
- **Isolation:** Real DB + Redis, mocked LLM
- **Location:** `apps/api/tests/integration/*.test.ts`

### E2E Tests (Playwright)
- **Scope:** Full user workflows
- **Speed:** Slower (~30s)
- **Isolation:** Real everything except LLM
- **Location:** `apps/front/e2e/*.spec.ts`

---

## Debugging E2E Tests

### Check What's Running
```bash
# List test containers
docker ps | grep bigocean-.*-test

# Check API health
curl http://localhost:4001/health

# Check PostgreSQL
docker exec bigocean-postgres-test psql -U test_user -d bigocean_test -c "\dt"

# Check Redis
docker exec bigocean-redis-test redis-cli ping
```

### View Logs
```bash
# API logs
docker logs bigocean-api-test

# PostgreSQL logs
docker logs bigocean-postgres-test

# All test services
docker compose -f compose.test.yaml logs -f
```

### Debug Tests
```bash
# Run with browser visible
pnpm test:e2e:headed

# Run with Playwright inspector
pnpm test:e2e:debug

# Run specific test
pnpm test:e2e auth-signup-modal.spec.ts -g "should show sign-up modal"
```

---

## CI/CD Integration

### GitHub Actions Workflow

```yaml
- name: Start Test Environment
  run: pnpm docker:test:up

- name: Wait for Services
  run: |
    timeout 60 bash -c 'until curl -f http://localhost:4001/health; do sleep 2; done'

- name: Install Playwright Browsers
  run: pnpm playwright install --with-deps chromium

- name: Run E2E Tests
  run: pnpm --filter=front test:e2e

- name: Stop Test Environment
  if: always()
  run: pnpm docker:test:down

- name: Upload Test Report
  if: always()
  uses: actions/upload-artifact@v4
  with:
    name: playwright-report
    path: apps/front/playwright-report/
```

---

## Cost Analysis

### E2E Test Run Costs

**With Real LLM (MOCK_LLM=false):**
- 10 tests × 3 messages/test = 30 LLM calls
- ~$0.05 per call = **$1.50 per test run** 💸
- Risky for CI (could run 100+ times/day)

**With Mocked LLM (MOCK_LLM=true):**
- **$0.00 per test run** ✅
- Safe for frequent CI runs
- Deterministic results

**Docker Resource Usage:**
- ~500MB RAM (PostgreSQL + Redis + API)
- Minimal CPU (mocked LLM is fast)
- Test duration: ~30s for full suite

---

## Troubleshooting

### "Connection refused" errors
**Problem:** API not ready yet
**Solution:** Check health endpoint: `curl http://localhost:4001/health`

### "Port already in use"
**Problem:** Dev environment still running
**Solution:** Stop dev: `pnpm docker:test:down` or use different ports

### "Database does not exist"
**Problem:** Migrations didn't run
**Solution:** Check API logs: `docker logs bigocean-api-test`

### Tests timing out
**Problem:** Frontend not connecting to test API
**Solution:** Verify `VITE_API_URL=http://localhost:4001` in webServer command

---

## Summary

✅ **E2E tests use the full stack** (DB, Redis, API, Frontend)
✅ **Test environment is isolated** from dev environment
✅ **LLM is mocked** to avoid costs and ensure determinism
✅ **Setup is automated** via Docker Compose
✅ **Tests validate real workflows** end-to-end

**Ready to test:** `pnpm docker:test:up && pnpm test:e2e:ui` 🚀
