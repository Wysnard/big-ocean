# Playwright E2E Testing - Quick Start

## 🚀 Run Tests Now

E2E tests require the **full stack** (database, API, frontend) to be running.

### Option 1: Manual Setup (Recommended for Development)

```bash
# Terminal 1: Start test environment (from project root)
pnpm docker:test:up

# Terminal 2: Run tests (from apps/front)
cd apps/front
pnpm test:e2e:ui  # Interactive UI mode
```

When done:
```bash
# Stop test environment
pnpm docker:test:down
```

### Option 2: Quick Commands

```bash
# From apps/front directory
cd apps/front

# Start test environment
pnpm test:e2e:setup

# Run tests
pnpm test:e2e:ui

# Stop test environment when done
pnpm test:e2e:teardown
```

## ✅ What's Already Set Up

1. **Playwright 1.58.1** - Installed and configured
2. **Browser Binaries** - Chromium, Firefox, WebKit downloaded
3. **Test Files** - 10 tests ready to run
4. **Configuration** - Multi-browser, mobile viewports, auto dev server
5. **Test Environment** - Docker Compose with PostgreSQL, Redis, API (Story 2.8)

## 🐳 Test Environment (compose.test.yaml)

When you run `pnpm docker:test:up`, it starts:

- **PostgreSQL** (port 5433) - Isolated test database
- **Redis** (port 6380) - For session/cache testing
- **API** (port 4001) - Backend with **MOCK_LLM=true** (no Anthropic API costs! 💰)
- **Frontend** (port 3000) - Vite dev server connected to test API

This uses the same Docker setup from Story 2.8 (Integration Testing)

## 📁 Test Files

```
apps/front/e2e/
├── auth-signup-modal.spec.ts  # Story 4.1 tests (7 scenarios)
├── home.spec.ts               # Basic homepage tests (3 scenarios)
├── README.md                  # Full documentation
└── QUICKSTART.md              # This file
```

## 🎯 Story 4.1 Test Coverage

**Sign-Up Modal After First Message:**
- ✅ Modal appears after first message
- ✅ Can dismiss modal (continue as guest)
- ✅ Email validation
- ✅ Password validation (12+ chars)
- ✅ Successful sign-up + session linking
- ✅ Error handling (duplicate email)
- ✅ Mobile responsiveness

## 💡 Common Commands

```bash
# Run all tests with UI (interactive)
pnpm test:e2e:ui

# Run tests in debug mode
pnpm test:e2e:debug

# Run with visible browser
pnpm test:e2e:headed

# Run specific test file
pnpm test:e2e auth-signup-modal.spec.ts

# Run only one test
pnpm test:e2e -g "should show sign-up modal"

# Run on mobile viewport
pnpm test:e2e -- --project="Mobile Chrome"

# Generate and show HTML report
pnpm playwright show-report
```

## ⚠️ Expected Behavior

**Tests will FAIL initially** because Story 4.1 (Sign-Up Modal) hasn't been implemented yet.

This is **intentional** - it's Test-Driven Development (TDD):
1. ✅ **RED Phase:** Tests written (current state)
2. ⏳ **GREEN Phase:** Implement feature to make tests pass
3. ⏳ **REFACTOR Phase:** Clean up code

## 🛠️ Next Steps

### For Implementing Story 4.1:

1. **Run tests in UI mode** to see what's expected:
   ```bash
   pnpm test:e2e:ui
   ```

2. **Implement the Sign-Up Modal** component in `apps/front/src/components/auth/SignUpModal.tsx`

3. **Re-run tests** and watch them turn green:
   ```bash
   pnpm test:e2e
   ```

4. **Fix any failures** by adjusting selectors or component structure

### For Adding More Tests:

1. Create new `.spec.ts` file in `apps/front/e2e/`
2. Import Playwright test utilities:
   ```typescript
   import { test, expect } from "@playwright/test";
   ```
3. Write tests using semantic locators (see `auth-signup-modal.spec.ts` for examples)
4. Run and verify

## 📚 Learn More

- **Full README:** `apps/front/e2e/README.md`
- **Playwright Docs:** https://playwright.dev/
- **Best Practices:** https://playwright.dev/docs/best-practices
- **Test Summary:** `_bmad-output/implementation-artifacts/tests/test-summary.md`

## 🎭 Happy Testing!

Playwright is ready to go. Start with `pnpm test:e2e:ui` to see your tests in action!
