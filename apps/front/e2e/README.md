# E2E Tests with Playwright

This directory contains end-to-end tests for the big-ocean frontend using [Playwright](https://playwright.dev/).

## Setup

Playwright is already installed. If you need to reinstall browsers:

```bash
pnpm playwright install
```

## Running Tests

### Run all E2E tests
```bash
pnpm test:e2e
```

### Run tests in UI mode (interactive)
```bash
pnpm test:e2e:ui
```

### Run tests in debug mode
```bash
pnpm test:e2e:debug
```

### Run tests with browser visible (headed mode)
```bash
pnpm test:e2e:headed
```

### Run tests in specific browser
```bash
pnpm test:e2e:chromium  # Chromium only
pnpm test:e2e -- --project=firefox  # Firefox
pnpm test:e2e -- --project=webkit   # Safari/WebKit
pnpm test:e2e -- --project="Mobile Chrome"  # Mobile viewport
```

### Run specific test file
```bash
pnpm test:e2e auth-signup-modal.spec.ts
```

## Test Structure

Tests are organized by feature:

- `home.spec.ts` - Homepage and basic navigation tests
- `auth-signup-modal.spec.ts` - Story 4.1: Sign-up modal after first message

## Writing Tests

### Best Practices

1. **Use semantic locators**: Prefer `getByRole()`, `getByLabel()`, `getByText()` over CSS selectors
2. **Wait for visibility**: Use `expect(element).toBeVisible()` instead of fixed timeouts
3. **Test user flows**: Focus on what users actually do, not implementation details
4. **Keep tests independent**: Each test should run in isolation
5. **Use Page Object Model for complex flows**: Extract reusable page interactions

### Example Test

```typescript
import { test, expect } from "@playwright/test";

test("should complete user flow", async ({ page }) => {
  // Navigate
  await page.goto("/feature");

  // Interact
  await page.getByRole("button", { name: /submit/i }).click();

  // Assert
  await expect(page.getByText(/success/i)).toBeVisible();
});
```

## Configuration

See `playwright.config.ts` for configuration options:

- **Test directory**: `./e2e`
- **Base URL**: `http://localhost:3000`
- **Browsers**: Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari
- **Retries**: 2 in CI, 0 locally
- **Screenshot**: Only on failure
- **Trace**: On first retry

## CI/CD Integration

Tests run automatically in CI with:
- Parallel execution disabled (workers: 1)
- 2 retry attempts
- HTML report generated in `playwright-report/`

## Debugging

### Visual debugging with UI mode
```bash
pnpm test:e2e:ui
```

### Debug specific test
```bash
pnpm test:e2e:debug auth-signup-modal.spec.ts
```

### View test report
```bash
pnpm playwright show-report
```

## Related Documentation

- [Playwright Documentation](https://playwright.dev/)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Locators Guide](https://playwright.dev/docs/locators)
- [Assertions](https://playwright.dev/docs/test-assertions)

## Testing Epic 4 (Frontend Assessment UI)

Story 4.1 tests are in `auth-signup-modal.spec.ts`:
- Sign-up modal appearance after first message
- Modal dismissal (continue as guest)
- Email validation
- Password validation (12+ chars, NIST 2025)
- Successful sign-up and session linking
- Error handling (duplicate email)
- Mobile responsiveness

**TODO**: Add tests for upcoming stories:
- Story 4.2: Assessment Conversation Component
- Story 4.3: Session Resumption & Device Switching
- Story 4.4: Optimistic Updates & Progress Indicator
