# E2E Testing Standard

This document defines the standards for Playwright E2E tests to keep the suite focused, fast, and maintainable as the project grows.

## What Belongs in E2E

E2E tests are the most expensive tier. Every new spec adds Docker boot time, browser overhead, and flake surface. The bar for inclusion is high.

**E2E is for:**

- **Critical user journeys** — flows where real money, data, or trust is at stake (golden path, purchase, auth)
- **Multi-page navigation** that integration tests can't cover (redirects, session persistence, SSR hydration)
- **Access control boundaries** — verifying who can see what across auth states

**E2E is NOT for:**

- Single component rendering (unit test)
- API endpoint behavior (integration test with Docker)
- Styling, layout, or responsive breakpoints (visual regression or manual QA)
- Business logic edge cases (unit test the use-case)

**Rule of thumb:** If the test doesn't involve a browser navigating across at least 2 states (pages, modals, auth transitions), it belongs in a lower tier.

## Structure Rules

| Rule | Why |
|------|-----|
| One spec file = one user journey or feature area | Keeps tests independently runnable |
| Max ~200 lines per spec (soft limit) | Forces focus; split if growing beyond |
| Use `test.step()` for every logical phase | HTML report readability + easier debugging |
| No raw `page.waitForTimeout()` | Use `waitForSelector`, `waitForURL`, `expect().toBeVisible()` — timeouts hide real problems |
| Seed via factories/API, not UI clicks | Only test the UI flow under test; set up everything else via API/DB |
| One Playwright project per spec file | Enables targeted runs and clear dependency graphs |

## Performance Budget

| Metric | Target |
|--------|--------|
| **Total suite** (parallel, 4 workers) | < 5 minutes |
| **Any single test** | < 30s (default timeout) |
| **Long journeys** (golden path) | < 90s with explicit `test.setTimeout()` |
| **New spec added** | Must not increase total suite time by > 30s |

## Dependency Chains

Dependencies between Playwright projects **serialize** tests and are the #1 cause of slow suites.

**Rule:** New tests must be self-contained. Seed required state via factories instead of depending on another project. Only add a `dependencies` entry when there's a hard technical reason (e.g., Redis contention between `waitlist` and `purchase-credits`).

## Tagging

Use tags to enable selective test runs as the suite grows:

```typescript
test('purchase flow @critical @payments', async ({ page }) => { ... });
```

Run selectively: `npx playwright test --grep @critical`

**Tags:**

| Tag | Purpose | When to run |
|-----|---------|-------------|
| `@critical` | Must pass before any deploy | Every CI run |
| `@smoke` | Fast subset (< 2 min) | PR checks |
| `@slow` | Known long tests | Full suite only |

## Selectors

Follow this priority order:

1. `page.getByTestId(id)` — primary selector (`data-testid`)
2. `page.getByRole(role, { name })` — accessibility selectors
3. `page.locator("[data-slot='...']")` — shadcn component slots
4. `page.getByText(text)` — text matching (avoid for LLM-generated content)

Never remove or rename `data-testid` attributes — see [FRONTEND.md](./FRONTEND.md#testing-with-data-attributes).

## File Organization

```
e2e/
├── playwright.config.ts    # Projects, workers, timeouts
├── global-setup.ts         # Docker + auth state creation
├── global-teardown.ts      # Docker cleanup
├── e2e-env.ts              # Shared constants
├── fixtures/               # Playwright fixture extensions
│   ├── env.fixture.ts      # Environment constants
│   ├── base.fixture.ts     # API context
│   └── db.ts               # DB seeding helpers
├── factories/              # Data setup via API & DB
│   ├── user.factory.ts
│   └── assessment.factory.ts
├── utils/                  # Shared browser/API helpers
│   ├── api-client.ts
│   └── browser-auth.ts
└── specs/                  # Test files (one per feature/journey)
    ├── golden-path.spec.ts
    ├── access-control/
    │   └── ...
    └── ...
```

## When the Budget is Exceeded

When the suite approaches the 5-minute ceiling, address in this order:

1. **Enable CI sharding** — `--shard=1/N` across parallel CI jobs
2. **Push non-critical tests down** — move tests that are really testing API logic through the browser to the integration tier
3. **Audit dependency chains** — break serialized projects into self-contained ones
4. **Increase worker count** — last resort, watch for resource contention
