---
stepsCompleted: [1, 2, 3, 4, 5, 6]
inputDocuments: []
workflowType: 'research'
lastStep: 1
research_type: 'technical'
research_topic: 'E2E testing strategies for email (Resend) and payments (Polar)'
research_goals: 'Determine the best programmatic approaches to test mailing (Resend) and payment flows (Polar) in an e2e/Playwright test setting'
user_name: 'Vincentlay'
date: '2026-03-24'
web_research_enabled: true
source_verification: true
---

# E2E Testing Email & Payment Flows: Comprehensive Technical Research for big-ocean

**Date:** 2026-03-24
**Author:** Vincentlay
**Research Type:** Technical — E2E Testing Strategy

---

## Executive Summary

big-ocean needs programmatic e2e testing for two critical external integrations: **email delivery (Resend)** and **payment processing (Polar)**. This research evaluates the available testing approaches, tools, and architectural patterns to determine the best strategy for incorporating these into big-ocean's existing Playwright e2e test suite.

Both Resend and Polar provide first-class sandbox/test capabilities that align well with big-ocean's existing patterns. Resend offers test email addresses (`delivered@resend.dev`, `bounced@resend.dev`) and a retrieval API for programmatic delivery verification. Polar provides a fully isolated sandbox environment at `sandbox.polar.sh` with free test transactions and a CLI for local webhook tunneling. The Better Auth Polar plugin (`@polar-sh/better-auth`) — already in big-ocean's auth stack — supports sandbox mode natively.

The recommended architecture is a **dual-mode test system** controlled by environment variables (mirroring the existing `MOCK_LLM=true` pattern): mocked mode for fast CI (Playwright `page.route()` interception) and sandbox mode for nightly/pre-release validation against real APIs.

**Key Findings:**

- Resend's test addresses + email retrieval API eliminate the need for third-party inbox services (Mailosaur, MailSlurp)
- Polar's sandbox is fully free with no transaction costs; Resend's free tier (100 emails/day) is sufficient for nightly runs
- The `polar listen` CLI tunnels sandbox webhooks to localhost, enabling full checkout → webhook → state-update e2e flows
- A 6-phase implementation roadmap (est. 8-12 days total) builds incrementally from email mocking to full CI integration

**Top Recommendations:**

1. Extend the `MOCK_LLM` pattern to `MOCK_EMAIL` / `MOCK_PAYMENTS` for dual-mode test support
2. Use Playwright fixtures + POM to abstract email/payment testing into reusable, mode-agnostic helpers
3. Focus sandbox e2e on 3 critical flows: email verification, payment checkout, subscription management
4. Mock on every PR/commit for speed; run real sandbox tests nightly
5. Skip Mailosaur/MailSlurp/MSW — native tools from Resend and Polar are sufficient

## Table of Contents

1. [Technology Stack Analysis](#technology-stack-analysis)
   - [Email Testing — Resend](#email-testing--resend)
   - [Payment Testing — Polar](#payment-testing--polar)
   - [Testing Frameworks & Tools](#testing-frameworks--tools)
   - [Technology Adoption Trends](#technology-adoption-trends)
2. [Integration Patterns Analysis](#integration-patterns-analysis)
   - [API Design Patterns for E2E Testing](#api-design-patterns-for-e2e-testing)
   - [Resend Webhook Integration](#resend-webhook-integration)
   - [Polar Webhook Integration](#polar-webhook-integration)
   - [Better Auth Webhook Handler Integration](#better-auth-webhook-handler-integration)
   - [CI Pipeline Integration Strategy](#ci-pipeline-integration-strategy)
3. [Architectural Patterns and Design](#architectural-patterns-and-design)
   - [System Architecture: E2E Test Environment](#system-architecture-e2e-test-environment-for-big-ocean)
   - [Playwright Fixtures + Page Objects](#design-principles-playwright-fixtures--page-objects)
   - [Webhook Receiver Architecture](#webhook-receiver-architecture-for-e2e-tests)
   - [Security Architecture](#security-architecture-for-test-environments)
4. [Implementation Approaches and Technology Adoption](#implementation-approaches-and-technology-adoption)
   - [Adoption Strategy](#technology-adoption-strategy-incremental-integration)
   - [Project Structure](#development-workflow-and-tooling)
   - [Test Code Examples](#testing-and-quality-assurance)
   - [Cost Optimization](#cost-optimization-and-resource-management)
   - [Risk Assessment](#risk-assessment-and-mitigation)
5. [Recommendations](#technical-research-recommendations)
   - [Implementation Roadmap](#implementation-roadmap)
   - [Technology Stack Recommendations](#technology-stack-recommendations)
   - [Success Metrics](#success-metrics-and-kpis)
6. [Research Methodology & Sources](#research-methodology-and-sources)

---

## Research Methodology

**Scope:** E2E testing strategies for email (Resend) and payment (Polar) flows in a Playwright test setting, tailored to big-ocean's hexagonal architecture and existing Docker-based test infrastructure.

**Data Sources:** Official documentation (Resend, Polar, Playwright, Better Auth), developer community articles, GitHub repositories, and current web research verified against live sources as of March 2026.

**Analysis Framework:** Technology stack evaluation → integration pattern analysis → architectural design → implementation research → synthesis with actionable recommendations.

---

## Technology Stack Analysis

### Email Testing — Resend

#### Resend's Native Testing Capabilities

Resend provides built-in testing primitives that are particularly relevant for e2e testing:

**Test Email Addresses** (no domain verification required):
- `delivered@resend.dev` — simulates successful delivery
- `bounced@resend.dev` — simulates bounce (SMTP 550 5.1.1)
- `complained@resend.dev` — simulates spam complaint

These addresses give full use of Resend's Dashboard, Webhooks, and API without affecting domain reputation.
_Source: [Resend — Sending Test Emails](https://resend.com/changelog/sending-test-emails)_

**Email Retrieval API** — `GET /emails/{id}` returns the email object including a `last_event` field (e.g., `"delivered"`) that can be polled programmatically to verify delivery status. Available via `resend.emails.get(emailId)` in the SDK.
_Source: [Resend — Retrieve Email API](https://resend.com/docs/api-reference/emails/retrieve-email)_

**Resend's Official Playwright Guide** offers two testing approaches:
1. **Option A — Real API calls** (uses sending quota): hit your email-sending endpoint and assert the response contains an `id`
2. **Option B — Mocked route** (preserves quota): use `page.route()` to intercept the API call and return a mock response

_Source: [Resend — E2E Testing with Playwright](https://resend.com/docs/knowledge-base/end-to-end-testing-with-playwright)_

#### Third-Party Email Inbox Services (Alternative Approaches)

For scenarios where you need to **actually receive and read email content** (e.g., verify a magic link, extract an OTP code), Resend alone cannot do this — you need an inbox service:

| Service | Key Feature | Playwright Integration | Pricing |
|---------|------------|----------------------|---------|
| **Mailosaur** | Unlimited test addresses per inbox, SMS + 2FA testing | First-class Playwright SDK (`mailosaur` npm package) | Paid (free tier available) |
| **MailSlurp** | Disposable inboxes with auto-expiry, wait methods for async emails | Official Playwright integration | Paid (free tier available) |
| **Mailisk** | Structured payload parsing, payment confirmation assertions | Playwright compatible | Paid |

_Source: [Mailosaur — Playwright Email Testing](https://mailosaur.com/docs/frameworks-and-tools/playwright/email-testing), [MailSlurp — Playwright Integration](https://docs.mailslurp.com/playwright/)_

### Payment Testing — Polar

#### Polar Sandbox Environment

Polar provides a **fully isolated sandbox** (not a test-mode toggle) at `sandbox.polar.sh` with a separate API at `sandbox-api.polar.sh`.

**Key characteristics:**
- Completely separate user accounts, products, access tokens, and data from production
- Test payments via Stripe test card: `4242 4242 4242 4242` (any future expiry, any CVC)
- Sandbox subscriptions auto-cancel after 90 days
- SDK initialization: `new Polar({ accessToken: '...', server: 'sandbox' })`

_Source: [Polar — Sandbox Environment](https://polar.sh/docs/developers/sandbox)_

**Checkout API** — programmatically create checkout sessions via `polar.checkouts.create({ products: [...] })`, returns a URL for redirecting the customer. Supports ad-hoc pricing, external customer IDs, and discount codes.
_Source: [Polar — Checkout Session API](https://polar.sh/docs/features/checkout/session)_

**Webhook Testing:**
- Follows Standard Webhooks specification with cryptographic signature verification
- `polar listen` CLI tunnels sandbox webhooks to localhost for local development
- Events cover the full lifecycle: checkout, order, subscription, refund, customer, benefit, product

_Source: [Polar — Webhooks](https://polar.sh/docs/integrate/webhooks/endpoints)_

#### Better Auth × Polar Plugin

The `@polar-sh/better-auth` plugin (maintained by Polar team) provides deep integration:

- **Checkout plugin** — `authClient.checkout({ products: [...] })` redirects to Polar checkout with auth context
- **Webhooks plugin** — 25+ granular webhook handlers (`onOrderPaid`, `onSubscriptionCreated`, `onCustomerStateChanged`, etc.)
- **Portal plugin** — customer self-service for orders, subscriptions, benefits
- **Usage plugin** — event ingestion and customer meters for usage-based billing
- **Sandbox support** — set `server: 'sandbox'` on the Polar SDK client, everything else works identically

_Source: [Better Auth — Polar Plugin](https://better-auth.com/docs/plugins/polar)_

### Testing Frameworks & Tools

| Tool | Role | Relevance |
|------|------|-----------|
| **Playwright** | E2E browser automation | Primary test runner — handles UI flows, route interception, multi-browser |
| **Resend SDK** (`resend`) | Email sending + retrieval | Send test emails, verify delivery via API |
| **Polar SDK** (`@polar-sh/sdk`) | Payment API client | Create sandbox checkouts, manage subscriptions programmatically |
| **`polar` CLI** | Webhook tunneling | `polar listen` tunnels sandbox webhooks to localhost |
| **Docker** (existing) | Test environment isolation | Already used in big-ocean for integration tests (port 5433) |

### Technology Adoption Trends

**Email testing evolution:** The trend is moving away from shared Gmail inboxes and SMTP mocking toward API-first approaches. Resend's test addresses + retrieval API enable a "send real, verify via API" pattern that is more realistic than mocking.

**Payment testing evolution:** Dedicated sandbox environments (Polar, Stripe) are standard. The key shift is toward programmatic checkout creation + webhook simulation rather than manual UI testing. Polar's `polar listen` CLI follows the same pattern as Stripe CLI's `stripe listen`.

**E2E testing best practices (2025-2026):**
- Mock external services at the network boundary (Playwright `page.route()`) for speed/reliability
- Use real sandbox environments for critical payment paths
- Combine both approaches: mock for fast CI, real sandbox for smoke tests
_Source: [BugBug — E2E Testing Guide 2026](https://bugbug.io/blog/test-automation/end-to-end-testing/)_

## Integration Patterns Analysis

### API Design Patterns for E2E Testing

#### Pattern 1: Playwright Route Interception (Mock at Network Boundary)

Playwright's `page.route()` and `browserContext.route()` APIs intercept outbound HTTP requests at the browser level, enabling two key patterns:

**a) Mock fulfill — replace response entirely:**
```typescript
await page.route('**/api/send-email', async (route) => {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ data: { id: 'mock-email-id' } }),
  });
});
```

**b) HAR replay — record real responses, replay in tests:**
```typescript
// Record
await page.routeFromHAR('tests/email.har', { url: '**/api/resend/**', update: true });
// Replay
await page.routeFromHAR('tests/email.har', { url: '**/api/resend/**' });
```

**Best for:** Fast CI runs, deterministic tests, no external dependencies.
_Source: [Playwright — Mock APIs](https://playwright.dev/docs/mock)_

#### Pattern 2: Real Sandbox Passthrough (No Mocking)

Let the browser hit the real API backend, which in turn calls Resend/Polar sandbox APIs. Assert on outcomes via API polling or webhook reception.

**Best for:** Smoke tests, pre-release validation, catching real API behavior changes.
_Source: [Best Practices for E2E Testing 2025](https://www.bunnyshell.com/blog/best-practices-for-end-to-end-testing-in-2025/)_

#### Pattern 3: Hybrid (Recommended for CI)

Mock external services for most CI runs (fast, deterministic). Run scheduled (nightly/pre-release) tests against real sandboxes to catch API drift.

> "Mock payment gateways, auth providers, and external APIs during fast feedback loops, but run real integration tests periodically (nightly, weekly) to catch actual API changes."

_Source: [Testlio — Payment Testing Guide](https://testlio.com/blog/ultimate-guide-to-payments-testing/)_

### Resend Webhook Integration

Resend provides 17 webhook event types covering the full email lifecycle:

**Email events (11):** `email.sent`, `email.delivered`, `email.opened`, `email.clicked`, `email.bounced`, `email.complained`, `email.failed`, `email.delivery_delayed`, `email.scheduled`, `email.received`, `email.suppressed`

**Domain events (3):** `domain.created`, `domain.updated`, `domain.deleted`

**Contact events (3):** `contact.created`, `contact.updated`, `contact.deleted`

**E2E testing integration flow:**
1. Test sends email to `delivered@resend.dev` via app UI/API
2. Resend returns `email.id` immediately
3. Test polls `GET /emails/{id}` to check `last_event === "delivered"`
4. Alternatively, Resend fires `email.delivered` webhook to your backend

**For webhook testing locally:** Use a tunnel (ngrok or similar) to receive Resend webhook events during local/CI test runs.
_Source: [Resend — Webhook Event Types](https://resend.com/docs/webhooks/event-types)_

### Polar Webhook Integration

Polar webhooks follow the **Standard Webhooks specification** with cryptographic signature verification.

**Key webhook events for e2e testing:**
- `checkout.created` / `checkout.updated` — track checkout session lifecycle
- `order.created` / `order.paid` — confirm payment completion
- `subscription.created` / `subscription.active` / `subscription.canceled` — subscription lifecycle
- `customer.created` — customer provisioning

**Local webhook testing via Polar CLI:**
```bash
# Install CLI
npm install -g @polarsource/cli

# Tunnel sandbox webhooks to localhost
polar listen --forward-to http://localhost:4000/polar/webhooks
```

The CLI creates a tunnel that relays sandbox webhook events to your local server, enabling full e2e flow testing without deploying.
_Source: [Polar CLI GitHub](https://github.com/polarsource/cli), [Polar — Webhooks](https://polar.sh/docs/integrate/webhooks/endpoints)_

### Better Auth Webhook Handler Integration

The `@polar-sh/better-auth` webhooks plugin exposes a handler at `/polar/webhooks` that:
1. Verifies webhook signatures via `POLAR_WEBHOOK_SECRET`
2. Routes to 25+ typed event handlers (`onOrderPaid`, `onSubscriptionActive`, etc.)
3. Works identically in sandbox and production (just swap the SDK `server` param)

**E2E test flow for payment checkout:**
```
[Playwright] → clicks "Subscribe" button
  → [Frontend] authClient.checkout({ products: [...] })
    → [Better Auth] creates Polar checkout session (sandbox)
      → [Playwright] fills Stripe test card 4242...
        → [Polar sandbox] processes payment
          → [Webhook] POST /polar/webhooks → onOrderPaid handler
            → [Backend] updates user subscription state
              → [Playwright] asserts UI shows "subscribed" state
```
_Source: [Better Auth — Polar Plugin](https://better-auth.com/docs/plugins/polar)_

### Data Formats & Communication Protocols

| Integration Point | Protocol | Data Format | Auth Method |
|-------------------|----------|-------------|-------------|
| Resend Send Email | REST (HTTPS) | JSON | Bearer token (API key) |
| Resend Retrieve Email | REST (HTTPS) | JSON | Bearer token (API key) |
| Resend Webhooks | HTTPS POST | JSON | Svix signature verification |
| Polar Checkout API | REST (HTTPS) | JSON | Bearer token (org access token) |
| Polar Webhooks | HTTPS POST | JSON | Standard Webhooks signature |
| Polar CLI Tunnel | WebSocket tunnel | JSON relay | CLI auth |
| Better Auth Polar | Internal handler | Typed payloads | Webhook secret verification |

### Security Patterns for Testing

**API Key Isolation:** Both Resend and Polar use separate API keys/tokens for sandbox vs production. The e2e test environment must use sandbox-only credentials stored in test-specific `.env` files.

**Webhook Signature Verification:** Both services use cryptographic signing:
- Resend: Svix-based webhook signatures
- Polar: Standard Webhooks specification signatures
- Both SDKs provide `validateEvent()` / signature verification utilities

**Test Card Security:** Polar sandbox uses Stripe's test card `4242 4242 4242 4242` — this only works against sandbox endpoints and cannot accidentally process real payments.

### CI Pipeline Integration Strategy

| Pipeline Stage | Email Testing | Payment Testing |
|---------------|--------------|-----------------|
| **PR / Commit** | Mock via `page.route()` | Mock via `page.route()` |
| **Nightly / Pre-release** | Real Resend sandbox + API polling | Real Polar sandbox + test cards |
| **Pre-deploy smoke** | Real Resend → verify `last_event` | Real Polar → verify webhook delivery |

_Source: [TestKube — Integration vs E2E Testing in CI/CD](https://testkube.io/blog/integration-end-to-end-testing-cicd-pipelines)_

## Architectural Patterns and Design

### System Architecture: E2E Test Environment for big-ocean

The recommended architecture layers the test environment on top of big-ocean's existing Docker-based integration test setup (port 5433 for PG, port 4001 for API):

```
┌─────────────────────────────────────────────────────┐
│                  Playwright Test Runner               │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐  │
│  │ Page      │  │ API      │  │ Service Fixtures   │  │
│  │ Objects   │  │ Fixtures │  │ (email, payment)   │  │
│  └──────────┘  └──────────┘  └───────────────────┘  │
├─────────────────────────────────────────────────────┤
│              Network Interception Layer               │
│  page.route() for mocked runs                        │
│  Passthrough for sandbox runs                         │
├─────────────────────────────────────────────────────┤
│              Application Under Test                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │ Frontend  │  │ API      │  │ Better   │          │
│  │ :3000     │  │ :4001    │  │ Auth     │          │
│  └──────────┘  └──────────┘  └──────────┘          │
├─────────────────────────────────────────────────────┤
│              External Service Layer                   │
│  ┌──────────────────┐  ┌───────────────────┐        │
│  │ Resend Sandbox    │  │ Polar Sandbox      │        │
│  │ (or mocked)       │  │ sandbox-api.polar  │        │
│  └──────────────────┘  │ + polar listen CLI  │        │
│                         └───────────────────┘        │
├─────────────────────────────────────────────────────┤
│              Infrastructure                           │
│  ┌──────────┐  ┌──────────────────────────┐         │
│  │ PG :5433  │  │ Docker Compose (test)    │         │
│  └──────────┘  └──────────────────────────┘         │
└─────────────────────────────────────────────────────┘
```

**Key design decision:** Two run modes controlled by an environment variable (e.g., `E2E_MOCK_EXTERNALS=true`):
- **Mocked mode** (default, CI): `page.route()` intercepts all external API calls
- **Sandbox mode** (nightly/manual): passthrough to real Resend + Polar sandboxes

_Source: [Modern E2E Test Architecture Patterns](https://www.thunders.ai/articles/modern-e2e-test-architecture-patterns-and-anti-patterns-for-a-maintainable-test-suite)_

### Design Principles: Playwright Fixtures + Page Objects

**Fixture-based dependency injection** is the recommended Playwright pattern. Define fixtures that encapsulate external service setup/teardown:

```typescript
// e2e/fixtures.ts
import { test as base } from '@playwright/test';

type TestFixtures = {
  emailService: EmailTestHelper;
  paymentService: PaymentTestHelper;
};

export const test = base.extend<TestFixtures>({
  emailService: async ({ page }, use) => {
    const helper = new EmailTestHelper(page, process.env.E2E_MOCK_EXTERNALS === 'true');
    await helper.setup();
    await use(helper);
    await helper.teardown();
  },
  paymentService: async ({ page }, use) => {
    const helper = new PaymentTestHelper(page, process.env.E2E_MOCK_EXTERNALS === 'true');
    await helper.setup();
    await use(helper);
    await helper.teardown();
  },
});
```

**Page Object Model (POM)** for checkout and email-dependent flows:
```typescript
// e2e/pages/checkout.page.ts
export class CheckoutPage {
  constructor(private page: Page) {}
  async fillTestCard() {
    // Stripe test card within Polar checkout iframe/redirect
    await this.page.fill('[data-testid="card-number"]', '4242424242424242');
    // ...
  }
  async expectSubscribed() {
    await expect(this.page.getByText('Subscribed')).toBeVisible();
  }
}
```

_Source: [Playwright — Fixtures](https://playwright.dev/docs/test-fixtures), [Playwright — Page Object Models](https://playwright.dev/docs/pom)_

### Webhook Receiver Architecture for E2E Tests

For sandbox-mode tests that need to verify webhook delivery, two approaches:

**Approach A — Polar CLI tunnel (simplest):**
```bash
# In CI/test setup script:
polar listen --forward-to http://localhost:4001/polar/webhooks &
```
The Polar CLI acts as a tunnel, forwarding sandbox webhooks to the test API server. After triggering a payment, the test polls the database or an API endpoint to verify the webhook was processed.

**Approach B — Lightweight webhook catcher (more control):**
Spin up a minimal Express server in Docker that captures webhook payloads and exposes them via a test API:
```
POST /webhooks/polar  → stores payload in memory
GET  /webhooks/polar  → returns captured payloads for assertion
```

This pattern provides deterministic assertions without relying on timing. The test sends a payment, then polls the catcher until the expected webhook arrives.

_Source: [Mastering Webhook E2E Testing](https://dev.to/ash_dubai/mastering-webhook-e2e-test-a-devs-guide-3d96), [Mocking External Systems in E2E Tests](https://madewithlove.com/blog/mocking-external-systems-in-e2e-tests/)_

### Scalability and Performance Patterns

**Test isolation:** Each test should create its own user/session to avoid state leakage. Leverage big-ocean's existing seed utilities and create per-test sandbox data.

**Parallelization:** Playwright supports parallel workers. External service tests must be isolated per-worker to avoid webhook cross-talk:
- Each worker uses a unique test user email
- Webhook assertions filter by user/session ID

**Flakiness mitigation:**
- Use Playwright's `expect.poll()` for async assertions (email delivery, webhook processing)
- Set explicit timeouts for external service operations (sandbox APIs can be slower)
- Retry on transient sandbox failures (Playwright's `retries: 2` config)

**Critical paths only:** E2E tests with real sandboxes should focus on the 2-3 most critical flows:
1. Email verification (signup → receive email → click link)
2. Payment checkout (subscribe → test card → webhook → access granted)
3. Subscription management (cancel → webhook → access revoked)

_Source: [Best Practices for E2E Testing 2025](https://www.bunnyshell.com/blog/best-practices-for-end-to-end-testing-in-2025/), [E2E Testing Microservices 2026](https://www.bunnyshell.com/blog/end-to-end-testing-for-microservices-a-2025-guide/)_

### Security Architecture for Test Environments

**Credential isolation:** Test credentials must be separated from production:

| Credential | Storage | Scope |
|-----------|---------|-------|
| `RESEND_API_KEY` (test) | `.env.test` / CI secrets | Sandbox only |
| `POLAR_ACCESS_TOKEN` (sandbox) | `.env.test` / CI secrets | sandbox.polar.sh only |
| `POLAR_WEBHOOK_SECRET` (sandbox) | `.env.test` / CI secrets | Sandbox webhook verification |
| Stripe test card `4242...` | Hardcoded in test fixtures | Only works on sandbox endpoints |

**Never commit sandbox tokens** to the repository. Use CI secret management (GitHub Actions secrets, Railway env vars).

**Domain reputation protection:** Always use `delivered@resend.dev` (or sandbox domain) in tests — never send to real addresses from CI.

### Data Architecture: Test State Management

**Seed → Act → Assert → Cleanup pattern:**
1. **Seed:** Create test user via API, ensure clean subscription state
2. **Act:** Execute the e2e flow (send email, complete checkout)
3. **Assert:** Verify outcomes via API polling (`resend.emails.get()`, database queries)
4. **Cleanup:** Cancel test subscriptions, delete test data (Polar sandbox auto-cancels after 90 days)

**Database assertions:** For webhook-dependent tests, poll the application database (via test API endpoint or direct query) rather than relying on UI state alone — the UI may not update instantly after webhook processing.

_Source: [Microsoft — E2E Testing Playbook](https://microsoft.github.io/code-with-engineering-playbook/automated-testing/e2e-testing/)_

## Implementation Approaches and Technology Adoption

### Technology Adoption Strategy: Incremental Integration

Given big-ocean's existing test infrastructure (Docker-based integration tests, Playwright e2e setup, `MOCK_LLM=true` pattern), the recommended adoption is **incremental — email first, then payments:**

**Phase 1 — Email testing (low risk, immediate value):**
- Add Resend test address support (`delivered@resend.dev`) to existing e2e tests
- Implement `page.route()` mocking for email-sending endpoints
- Add Resend API key to `.env.test` for sandbox-mode runs

**Phase 2 — Payment testing (higher complexity):**
- Set up Polar sandbox account + organization at `sandbox.polar.sh`
- Configure `@polar-sh/sdk` with `server: 'sandbox'` in test environment
- Install Polar CLI for webhook tunneling
- Implement checkout flow e2e tests with Stripe test cards

**Phase 3 — CI integration:**
- Wire mocked-mode tests into existing pre-push hooks
- Add nightly/scheduled sandbox-mode test runs in CI

This mirrors big-ocean's existing `MOCK_LLM=true` pattern — a familiar approach the team already uses for swapping external dependencies in tests.

### Development Workflow and Tooling

**Recommended project structure** (extending existing `apps/front/e2e/` or top-level `e2e/`):

```
e2e/
├── fixtures/
│   ├── base.ts              # Extended test with all fixtures
│   ├── email.fixture.ts     # EmailTestHelper (mock/sandbox modes)
│   └── payment.fixture.ts   # PaymentTestHelper (mock/sandbox modes)
├── pages/
│   ├── checkout.page.ts     # Polar checkout POM
│   └── email-verify.page.ts # Email verification flow POM
├── helpers/
│   ├── resend.helper.ts     # Resend API wrapper (send, poll, verify)
│   └── polar.helper.ts      # Polar SDK wrapper (create checkout, verify webhook)
├── mocks/
│   ├── email.mock.ts        # page.route() handlers for Resend
│   └── payment.mock.ts      # page.route() handlers for Polar checkout
├── tests/
│   ├── email-verification.spec.ts
│   ├── payment-checkout.spec.ts
│   └── subscription-management.spec.ts
└── playwright.config.ts
```

_Source: [Simple and Effective E2E Test Architecture with Playwright](https://medium.com/@denisskvrtsv/a-simple-and-effective-e2e-test-architecture-with-playwright-and-typescript-913c62ce0e89)_

### Testing and Quality Assurance

**Email verification test flow (mocked mode):**
```typescript
test('user receives verification email after signup', async ({ page, emailService }) => {
  // emailService.setup() already registered page.route() mocks
  await page.goto('/signup');
  await page.fill('[data-testid="email-input"]', 'test@example.com');
  await page.click('[data-testid="signup-button"]');

  // Assert the app attempted to send an email
  const sentEmail = emailService.getLastInterceptedRequest();
  expect(sentEmail.to).toBe('test@example.com');
  expect(sentEmail.subject).toContain('Verify');
});
```

**Email verification test flow (sandbox mode):**
```typescript
test('user receives real verification email', async ({ page, emailService }) => {
  // emailService in sandbox mode uses Resend API directly
  await page.goto('/signup');
  await page.fill('[data-testid="email-input"]', 'delivered@resend.dev');
  await page.click('[data-testid="signup-button"]');

  // Poll Resend API for delivery confirmation
  await expect.poll(async () => {
    const email = await emailService.getLastSentEmail();
    return email?.last_event;
  }, { timeout: 30_000 }).toBe('delivered');
});
```

**Payment checkout test flow (sandbox mode):**
```typescript
test('user completes subscription checkout', async ({ page, paymentService }) => {
  await page.goto('/pricing');
  await page.click('[data-testid="subscribe-pro"]');

  // Polar sandbox checkout page
  await page.fill('[data-testid="card-number"]', '4242424242424242');
  await page.fill('[data-testid="card-expiry"]', '12/30');
  await page.fill('[data-testid="card-cvc"]', '123');
  await page.click('[data-testid="pay-button"]');

  // Wait for webhook to be processed and UI to update
  await expect.poll(async () => {
    const state = await paymentService.getCustomerState();
    return state.subscriptions.some(s => s.status === 'active');
  }, { timeout: 30_000 }).toBe(true);

  await expect(page.getByText('Pro Plan')).toBeVisible();
});
```

### Cost Optimization and Resource Management

| Service | Free Tier | E2E Test Impact | Optimization |
|---------|-----------|-----------------|-------------|
| **Resend** | 3,000 emails/month, 100/day, 5 req/s | Each sandbox test sends 1 email | Use mocked mode for CI (0 quota), sandbox only for nightly (~10-20 emails/run) |
| **Polar** | No monthly fee, 4% + $0.40 per txn | Sandbox transactions are free | No cost impact — sandbox is fully free |
| **Playwright** | Free (open source) | CI runner time | Parallel workers, mocked mode for fast runs |

_Source: [Resend Pricing](https://resend.com/pricing), [Polar Pricing](https://polar.sh/resources/pricing)_

**Key insight:** Resend's free tier (100 emails/day) is more than sufficient for nightly sandbox runs. Polar sandbox is completely free with no transaction costs. The primary cost is CI runner time.

### Risk Assessment and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|-----------|------------|
| Resend sandbox rate limiting (5 req/s) | Test failures in parallel runs | Medium | Serial execution for email tests, or mock mode |
| Polar sandbox downtime | Nightly tests fail | Low | Retry config + alerting, mock mode as fallback |
| Stripe test card UI changes in Polar checkout | Tests break on selector changes | Medium | Use `data-testid` selectors, abstract in POM |
| Webhook delivery delay | Flaky timeout assertions | Medium | Generous timeouts + `expect.poll()` with backoff |
| Sandbox/production credential leak | Security incident | Low | Separate `.env.test`, CI secret management, never commit |
| Polar sandbox auto-cancels subs after 90 days | Test data staleness | Low | Create fresh test data per run, don't rely on persistent state |

## Technical Research Recommendations

### Implementation Roadmap

| Phase | Scope | Effort | Dependencies |
|-------|-------|--------|-------------|
| **Phase 1** | Email mocking via `page.route()` | 1-2 days | Resend already integrated |
| **Phase 2** | Resend sandbox verification tests | 1 day | Resend API key in `.env.test` |
| **Phase 3** | Polar sandbox account + SDK setup | 1 day | Polar sandbox org + access token |
| **Phase 4** | Payment checkout e2e tests (mocked) | 2-3 days | Polar product IDs, Better Auth plugin config |
| **Phase 5** | Payment checkout e2e tests (sandbox) | 2-3 days | Polar CLI, webhook tunneling, Stripe test cards |
| **Phase 6** | CI pipeline integration | 1 day | GitHub Actions secrets, nightly schedule |

### Technology Stack Recommendations

**Use what's already there:**
- Playwright (already in big-ocean for e2e)
- Docker Compose test environment (ports 4001/5433)
- `MOCK_LLM=true` pattern → extend to `MOCK_EMAIL=true`, `MOCK_PAYMENTS=true`

**Add:**
- `@polar-sh/sdk` (if not already) with `server: 'sandbox'` config
- Polar CLI (`@polarsource/cli`) for webhook tunneling
- Playwright custom fixtures for email/payment helpers

**Skip (not needed):**
- Mailosaur/MailSlurp — Resend's test addresses + retrieval API cover the use case
- Custom webhook catcher — Polar CLI tunnel is simpler
- MSW (Mock Service Worker) — `page.route()` is sufficient for e2e; MSW is better suited for unit/integration tests

### Success Metrics and KPIs

| Metric | Target | Measurement |
|--------|--------|-------------|
| E2E email test coverage | Signup, password reset, email verification | All critical email flows tested |
| E2E payment test coverage | Checkout, subscription, cancellation | Full payment lifecycle tested |
| Mocked CI run time | < 2 min for email+payment tests | Playwright reporter |
| Sandbox nightly run time | < 10 min total | CI pipeline duration |
| Test flakiness rate | < 5% for sandbox tests | Playwright retry stats |
| Zero production credential exposure | 0 incidents | CI audit logs |

## Future Outlook

**Near-term (2026):** The shift-left testing movement is pushing e2e tests with external services earlier in the development cycle. Preview environments per PR (e.g., Bunnyshell, Vercel preview) enable sandbox-mode e2e tests on every PR rather than just nightly.

**Observability-driven testing:** Teams are integrating OpenTelemetry tracing into e2e test infrastructure, moving beyond "test passed/failed" to understanding *why* failures occur at the system level — particularly valuable for webhook-dependent flows where timing issues cause flakiness.

**AI-assisted test generation:** Agentic AI tools are beginning to generate and maintain e2e test suites autonomously, though this is still early-stage for complex external service integrations.
_Source: [QA Trends 2026](https://dev.to/unais_shahid/5-qa-trends-you-cant-ignore-in-2026-21e3), [E2E Testing Microservices 2026](https://www.bunnyshell.com/blog/end-to-end-testing-for-microservices-a-2025-guide/)_

---

## Research Methodology and Sources

### Primary Sources

| Source | URL | Used For |
|--------|-----|----------|
| Resend — E2E Testing with Playwright | https://resend.com/docs/knowledge-base/end-to-end-testing-with-playwright | Official email e2e testing guide |
| Resend — Retrieve Email API | https://resend.com/docs/api-reference/emails/retrieve-email | Programmatic email verification |
| Resend — Test Emails | https://resend.com/changelog/sending-test-emails | Test email addresses |
| Resend — Webhook Event Types | https://resend.com/docs/webhooks/event-types | Email webhook integration |
| Resend — Pricing | https://resend.com/pricing | Free tier limits |
| Polar — Sandbox Environment | https://polar.sh/docs/developers/sandbox | Sandbox setup and capabilities |
| Polar — Checkout Session API | https://polar.sh/docs/features/checkout/session | Programmatic checkout creation |
| Polar — Webhooks | https://polar.sh/docs/integrate/webhooks/endpoints | Webhook setup and events |
| Polar — Pricing | https://polar.sh/resources/pricing | Cost analysis |
| Polar CLI | https://github.com/polarsource/cli | Webhook tunneling tool |
| Better Auth — Polar Plugin | https://better-auth.com/docs/plugins/polar | Auth + payment integration |
| Playwright — Mock APIs | https://playwright.dev/docs/mock | Route interception patterns |
| Playwright — Fixtures | https://playwright.dev/docs/test-fixtures | Fixture architecture |
| Playwright — Page Object Models | https://playwright.dev/docs/pom | POM pattern |

### Secondary Sources

| Source | URL | Used For |
|--------|-----|----------|
| Mailosaur — Playwright Email Testing | https://mailosaur.com/docs/frameworks-and-tools/playwright/email-testing | Alternative inbox services |
| MailSlurp — Playwright Integration | https://docs.mailslurp.com/playwright/ | Alternative inbox services |
| Mastering Webhook E2E Testing | https://dev.to/ash_dubai/mastering-webhook-e2e-test-a-devs-guide-3d96 | Webhook testing patterns |
| Mocking External Systems in E2E | https://madewithlove.com/blog/mocking-external-systems-in-e2e-tests/ | External service architecture |
| Microsoft — E2E Testing Playbook | https://microsoft.github.io/code-with-engineering-playbook/automated-testing/e2e-testing/ | Best practices |
| Modern E2E Test Architecture | https://www.thunders.ai/articles/modern-e2e-test-architecture-patterns-and-anti-patterns-for-a-maintainable-test-suite | Architecture patterns |
| Best Practices for E2E Testing 2025 | https://www.bunnyshell.com/blog/best-practices-for-end-to-end-testing-in-2025/ | CI strategy |
| E2E Testing Microservices 2026 | https://www.bunnyshell.com/blog/end-to-end-testing-for-microservices-a-2025-guide/ | 2026 trends |
| Testlio — Payment Testing Guide | https://testlio.com/blog/ultimate-guide-to-payments-testing/ | Hybrid mock/sandbox strategy |
| TestKube — Integration vs E2E in CI/CD | https://testkube.io/blog/integration-end-to-end-testing-cicd-pipelines | CI pipeline patterns |
| BugBug — E2E Testing Guide 2026 | https://bugbug.io/blog/test-automation/end-to-end-testing/ | E2E best practices |

### Research Confidence Assessment

| Area | Confidence | Notes |
|------|-----------|-------|
| Resend test addresses & retrieval API | **High** | Verified against official docs |
| Polar sandbox environment | **High** | Verified against official docs + MCP tools |
| Better Auth Polar plugin | **High** | Verified against official docs + MCP |
| Playwright route interception | **High** | Well-documented, widely adopted |
| Polar CLI `polar listen` | **Medium** | CLI exists (v1.3.0), but limited public documentation on exact flags |
| Checkout flow selectors (`data-testid`) | **Medium** | Polar checkout uses Stripe Elements — selectors may vary |
| Cost estimates | **High** | Based on current published pricing |

---

**Technical Research Completed:** 2026-03-24
**Source Verification:** All facts cited with current sources (March 2026)
**Confidence Level:** High — based on official documentation, verified web sources, and MCP tool queries

_This document serves as the authoritative technical reference for implementing e2e testing of email and payment flows in big-ocean._
