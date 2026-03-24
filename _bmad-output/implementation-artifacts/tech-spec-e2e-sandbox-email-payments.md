---
title: 'E2E Sandbox Testing for Email & Payments'
slug: 'e2e-sandbox-email-payments'
created: '2026-03-24'
status: 'ready-for-dev'
stepsCompleted: [1, 2, 3, 4]
tech_stack: ['standardwebhooks', '@polar-sh/sdk', 'resend', 'playwright', 'effect-ts', 'better-auth']
files_to_modify: ['apps/api/src/index.e2e.ts', 'compose.e2e.yaml', 'e2e/e2e-env.ts', 'e2e/global-setup.ts', '.env.e2e.example', '.env.e2e', 'e2e/specs/purchase-credits.spec.ts', 'e2e/specs/golden-path.spec.ts']
files_to_create: ['e2e/helpers/webhook.helper.ts']
files_to_delete: ['packages/domain/src/repositories/payment-gateway.repository.ts', 'packages/infrastructure/src/repositories/payment-gateway.polar.repository.ts', 'packages/infrastructure/src/repositories/payment-gateway.mock.repository.ts', 'packages/infrastructure/src/repositories/__mocks__/payment-gateway.polar.repository.ts']
code_patterns: ['hexagonal-dependency-swap', 'standard-webhooks-signing', 'better-auth-polar-plugin']
test_patterns: ['webhook-simulation', 'sandbox-api-passthrough', 'test-step-narrative']
---

# Tech-Spec: E2E Sandbox Testing for Email & Payments

**Created:** 2026-03-24

## Overview

### Problem Statement

E2E tests currently mock the email repository, which means they never validate Resend API contract compatibility. Payment webhook testing is absent — purchase state is seeded directly in the database, bypassing the full `onOrderPaid` pipeline (webhook signature verification → product mapping → purchase event insert → portrait placeholder creation). SDK changes or webhook format changes would go undetected until production.

### Solution

**Email:** Swap `ResendEmailMockRepositoryLive` → `ResendEmailResendRepositoryLive` in `index.e2e.ts` so the Effect-based email pipeline (drop-off re-engagement emails) calls the real Resend sandbox API. Note: Better Auth's own email sending (signup verification, password reset) already uses a live Resend client — this swap only covers the Effect email repo.

**Payments:** Create a webhook simulation helper using `standardwebhooks` to sign payloads and POST them to `/api/polar/webhooks`. This endpoint is handled by Better Auth's `@polar-sh/better-auth` `webhooks()` plugin, which internally calls `validateEvent()` from `@polar-sh/sdk/webhooks` (confirmed in source: `node_modules/@polar-sh/better-auth/dist/index.js` line 721). The helper signs with the same secret the plugin uses, so the full `onOrderPaid` pipeline executes. No mock swapping needed for payments — the webhook endpoint was never served by the Effect `PaymentGatewayRepository`.

**Cleanup:** Remove the dead `PaymentGatewayRepository` interface, its implementations, and all mocks. It was superseded when webhook handling moved to the Better Auth plugin and is not imported by any handler or use-case.

### Scope

**In Scope:**
- Swap `ResendEmailMockRepositoryLive` → `ResendEmailResendRepositoryLive` in `index.e2e.ts`
- Remove `PaymentGatewayMockRepositoryLive` from `index.e2e.ts` (and delete dead `PaymentGatewayRepository` + implementations)
- Add `RESEND_API_KEY` + `EMAIL_FROM_ADDRESS` to `compose.e2e.yaml`
- Add `standardwebhooks` as direct dev dependency
- Create `e2e/helpers/webhook.helper.ts` for signed Polar webhook simulation
- Migrate `purchase-credits.spec.ts` to POST signed webhooks for purchase state
- Migrate `golden-path.spec.ts` portrait seeding to use webhook helper
- Update `.env.e2e.example` and `.env.e2e` with new vars
- Use `onboarding@resend.dev` as sender, `delivered+{test-name}@resend.dev` as recipient
- Add fail-fast `RESEND_API_KEY` check in `global-setup.ts`
- Align `POLAR_WEBHOOK_SECRET` to a valid base64 canonical value across all files
- Add concrete Playwright serial config for email-sending tests

**Out of Scope:**
- LLM agent mocks (stay mocked — cost + determinism)
- `__mocks__/` vitest unit test mocks for non-payment repos (unchanged)
- Frontend code changes
- Polar checkout UI testing (no tunnel/ngrok)
- Extending `SendEmailInput` domain interface (using `+` labeling instead)
- Better Auth's own Resend client (already live when `RESEND_API_KEY` is configured)

## Context for Development

### Critical Architecture Notes

**Webhook endpoint ownership:** `/api/polar/webhooks` is handled entirely by Better Auth's `@polar-sh/better-auth` `webhooks()` plugin. The route is intercepted in `apps/api/src/middleware/better-auth.ts` line 19 (`url.startsWith("/api/polar")`). It never reaches Effect handlers. The `PaymentGatewayRepository` Effect interface is **dead code** — it was superseded when webhook handling moved to Better Auth.

**Verification chain (confirmed from source):**
```
Better Auth webhooks({ secret })
  → validateEvent(buf, headers, secret)     // @polar-sh/sdk/webhooks (line 721)
    → standardwebhooks Webhook.verify()      // internal
```

Both signing and verification use `standardwebhooks`. The secret must be valid base64 (after stripping optional `whsec_` prefix). The `Webhook` constructor calls `base64.decode(secret)` (line 44 of standardwebhooks/dist/index.js).

**Two separate Resend clients:**
1. **Better Auth's Resend** — `new Resend(resendApiKey)` in `better-auth.ts` for verification/password-reset emails. Already live when `RESEND_API_KEY` is set. NOT affected by the mock swap.
2. **Effect `ResendEmailResendRepositoryLive`** — for drop-off re-engagement emails. Currently mocked in e2e. This is what we swap.

**`onOrderPaid` handler does NOT insert `free_credit_granted`.** It inserts: (1) purchase event with mapped `eventType`, (2) portrait placeholder if `portrait_unlocked` or `extended_conversation_unlocked`. The `free_credit_granted` event is inserted in `user.create.after` hook on signup — completely separate.

**Portrait generation is triggered lazily** via `getPortraitStatus` endpoint polling (comment at `better-auth.ts` line 239). The webhook only creates a placeholder row with no content. Tests must hit the portrait status endpoint to trigger the mock generator, then wait for completion.

### Codebase Patterns

- **Hexagonal dependency swap:** `index.e2e.ts` is a separate composition root that swaps infrastructure layers structurally. We follow this pattern for the Resend swap.
- **Standard Webhooks signing:** `standardwebhooks` `Webhook.sign(msgId, timestamp, payload)` returns `v1,<base64-hmac>` (line 87). The helper constructs headers manually: `webhook-id`, `webhook-timestamp`, `webhook-signature`.
- **`.env.e2e` flow:** `.env.e2e` → `docker compose --env-file .env.e2e` → container env vars → `AppConfigLive` reads them. The `global-setup.ts` conditionally passes `--env-file` if the file exists (line 119).
- **Test `+` labeling:** Resend test addresses support `+` labels (e.g., `delivered+purchase-credits@resend.dev`). Labels visible in Resend dashboard for debugging.

### Files to Reference

| File | Purpose |
| ---- | ------- |
| `apps/api/src/index.e2e.ts` | E2E server composition root — swap Resend mock, remove payment mock |
| `compose.e2e.yaml` | Docker Compose — add `RESEND_API_KEY`, `EMAIL_FROM_ADDRESS`, fix webhook secret |
| `e2e/e2e-env.ts` | E2E constants — align `POLAR_CONFIG.webhookSecret`, add Resend config |
| `e2e/global-setup.ts` | Global setup — add fail-fast check, verify env flows to container |
| `.env.e2e.example` / `.env.e2e` | Env files — add Resend vars |
| `e2e/helpers/webhook.helper.ts` | **NEW** — webhook signing + POST helper |
| `e2e/specs/purchase-credits.spec.ts` | Migrate to POST signed webhook |
| `e2e/specs/golden-path.spec.ts` | Migrate portrait seeding — needs fixture change for `apiContext` |
| `packages/infrastructure/src/context/better-auth.ts` | `onOrderPaid` handler + `webhooks({ secret })` |
| `node_modules/@polar-sh/better-auth/dist/index.js` | Source verification: line 721 `validateEvent` import |
| `node_modules/standardwebhooks/dist/index.js` | Source verification: base64 secret, `sign()` returns `v1,<sig>` |
| `packages/domain/src/repositories/payment-gateway.repository.ts` | **DELETE** — dead interface |
| `packages/infrastructure/src/repositories/payment-gateway.polar.repository.ts` | **DELETE** — dead implementation |
| `packages/infrastructure/src/repositories/payment-gateway.mock.repository.ts` | **DELETE** — dead e2e mock |
| `packages/infrastructure/src/repositories/__mocks__/payment-gateway.polar.repository.ts` | **DELETE** — dead vitest mock |

### Technical Decisions

- **`standardwebhooks` as direct dev dep** — needed for `sign()` method; `@polar-sh/sdk` only re-exports `validateEvent()`, not signing.
- **Canonical webhook secret must be valid base64.** `standardwebhooks` constructor calls `base64.decode()` after stripping `whsec_` prefix. Use `whsec_dGVzdC1lMmUtd2ViaG9vay1zZWNyZXQ=` (= `whsec_` + base64("test-e2e-webhook-secret")).
- **`onboarding@resend.dev` sender** — Resend's sandbox domain, no verified domain needed.
- **`delivered+{test-name}@resend.dev` recipient** — per-test `+` labeling for Resend dashboard debugging. No domain interface changes.
- **Email assertion: trust-no-throw** — live repo wraps Resend errors in `EmailError`. If no throw, email was accepted.
- **Fail-fast checks in global-setup** — verifies `.env.e2e` exists and `RESEND_API_KEY` is set before launching tests. The check runs in the Playwright process; the env var flows to the Docker container via `--env-file .env.e2e`.
- **Remove `PaymentGatewayRepository`** — dead code. Not imported by any handler or use-case. Webhook handling lives in Better Auth plugin.
- **golden-path needs fixture upgrade** — currently imports from `@playwright/test` (no `apiContext`). Must switch to custom `base.fixture.ts` or create an `APIRequestContext` inline.
- **Portrait generation is lazy** — webhook creates placeholder, generation triggers via status endpoint polling. Tests must poll, then reload.
- **Keep `seedFullPortrait()` utility** — still useful for tests that don't need the full webhook pipeline.
- **Use `crypto.randomUUID()` for `checkoutId`** — avoids `Date.now()` collision risk in parallel workers.
- **No changes to `PaymentGatewayPolarRepositoryLive` swap in `index.e2e.ts`** — this layer is dead code being removed, not swapped.

## Implementation Plan

### Tasks

- [ ] **Task 1: Add `standardwebhooks` dev dependency**
  - File: `package.json` (root)
  - Action: `pnpm add -D standardwebhooks`
  - Notes: Already in lockfile as transitive dep of `@polar-sh/sdk`. Adding as direct dep for `sign()` access.

- [ ] **Task 2: Update `.env.e2e` and `.env.e2e.example`**
  - File: `.env.e2e`
  - Action: Add (actual sandbox key — file is gitignored):
    ```
    RESEND_API_KEY=<sandbox-key-from-env-not-committed>
    EMAIL_FROM_ADDRESS=onboarding@resend.dev
    ```
  - File: `.env.e2e.example`
  - Action: Add placeholder entries:
    ```
    # Resend Sandbox Credentials
    RESEND_API_KEY=re_your_sandbox_api_key
    EMAIL_FROM_ADDRESS=onboarding@resend.dev
    ```
  - Notes: `.env.e2e` is gitignored (line 25). The actual API key must never appear in committed files.

- [ ] **Task 3: Add env vars to `compose.e2e.yaml` + fix webhook secret**
  - File: `compose.e2e.yaml`
  - Action: In `api-e2e.environment`, add:
    ```yaml
    RESEND_API_KEY: "${RESEND_API_KEY:-}"
    EMAIL_FROM_ADDRESS: "${EMAIL_FROM_ADDRESS:-onboarding@resend.dev}"
    ```
  - Action: Change existing `POLAR_WEBHOOK_SECRET` fallback to valid base64 canonical value:
    ```yaml
    POLAR_WEBHOOK_SECRET: "${POLAR_WEBHOOK_SECRET:-whsec_dGVzdC1lMmUtd2ViaG9vay1zZWNyZXQ=}"
    ```
  - Notes: `whsec_dGVzdC1lMmUtd2ViaG9vay1zZWNyZXQ=` = `whsec_` + base64("test-e2e-webhook-secret"). Must be valid base64 or `standardwebhooks` constructor fails.

- [ ] **Task 4: Align webhook secret in `e2e-env.ts`**
  - File: `e2e/e2e-env.ts`
  - Action: Change `POLAR_CONFIG.webhookSecret` fallback to match compose:
    ```typescript
    webhookSecret: process.env.POLAR_WEBHOOK_SECRET ?? "whsec_dGVzdC1lMmUtd2ViaG9vay1zZWNyZXQ=",
    ```
  - Action: Add Resend config export:
    ```typescript
    export const RESEND_CONFIG = {
      apiKey: process.env.RESEND_API_KEY ?? "",
    } as const;
    ```

- [ ] **Task 5: Add fail-fast check in `global-setup.ts`**
  - File: `e2e/global-setup.ts`
  - Action: After `await waitForHealth()` and before `await createAuthState()`, add:
    ```typescript
    // Fail fast if Resend sandbox key is not configured
    if (!process.env.RESEND_API_KEY) {
      throw new Error(
        "[global-setup] RESEND_API_KEY not configured — set it in .env.e2e\n" +
        "See .env.e2e.example for required variables."
      );
    }
    ```
  - Notes: The check runs in the Playwright Node process. The env var flows to Docker via `--env-file .env.e2e` (line 119-124 of `global-setup.ts`). If `.env.e2e` exists and has the key, both Playwright and Docker will have it.

- [ ] **Task 6: Swap Resend mock + remove payment mock in `index.e2e.ts`**
  - File: `apps/api/src/index.e2e.ts`
  - Action — Resend swap:
    - Replace import `ResendEmailMockRepositoryLive` → `ResendEmailResendRepositoryLive` (from `@workspace/infrastructure`)
    - In `RepositoryLayers = Layer.mergeAll(...)`: replace `ResendEmailMockRepositoryLive` with `ResendEmailResendRepositoryLive`
  - Action — Payment removal:
    - Remove `PaymentGatewayMockRepositoryLive` import
    - Remove `PaymentGatewayMockRepositoryLive` from `RepositoryLayers = Layer.mergeAll(...)`
  - Action: Update startup log in `logStartup()`:
    - Change `"  - Resend Email (mock)"` → `"  - Resend Email (sandbox)"`
    - Remove `"  - Payment Gateway (mock)"` (webhook handled by Better Auth, not Effect layer)
  - Notes: `ResendEmailResendRepositoryLive` is `Layer.effect` needing `AppConfig` + `LoggerRepository` — satisfied by `InfrastructureLayer` via existing `.pipe(Layer.provide(InfrastructureLayer))`. Payment layer removal is safe — `PaymentGatewayRepository` is not imported by any handler or use-case.

- [ ] **Task 7: Delete dead `PaymentGatewayRepository` code**
  - Files to delete:
    - `packages/domain/src/repositories/payment-gateway.repository.ts`
    - `packages/infrastructure/src/repositories/payment-gateway.polar.repository.ts`
    - `packages/infrastructure/src/repositories/payment-gateway.mock.repository.ts`
    - `packages/infrastructure/src/repositories/__mocks__/payment-gateway.polar.repository.ts`
  - Action: Remove re-exports from:
    - `packages/domain/src/index.ts` (if `PaymentGatewayRepository` is re-exported)
    - `packages/infrastructure/src/index.ts` (if mock/live layers are re-exported)
  - Action: Remove any `vi.mock()` calls referencing `payment-gateway.polar.repository` in test files
  - Notes: Grep confirmed no imports in `apps/api/src/`. May need to check `packages/domain/src/index.ts` and `packages/infrastructure/src/index.ts` for barrel exports.

- [ ] **Task 8: Create webhook helper**
  - File: `e2e/helpers/webhook.helper.ts` (**NEW**)
  - Action:
    ```typescript
    import type { APIRequestContext } from "@playwright/test";
    import { Webhook } from "standardwebhooks";
    import { POLAR_CONFIG } from "../e2e-env.js";

    /**
     * Simulate a Polar webhook by signing a payload with the canonical
     * webhook secret and POSTing to the Better Auth Polar webhook endpoint.
     *
     * The Better Auth webhooks() plugin calls validateEvent() from
     * @polar-sh/sdk/webhooks, which uses standardwebhooks internally.
     * This helper signs with the same secret so verification passes.
     */
    export async function sendPolarWebhook(
      apiContext: APIRequestContext,
      event: {
        type: string;
        data: {
          id: string;
          productId: string;
          checkoutId: string;
          totalAmount: number;
          currency: string;
          customer: { externalId: string };
          metadata?: Record<string, unknown>;
        };
      },
    ) {
      const wh = new Webhook(POLAR_CONFIG.webhookSecret);
      const payload = JSON.stringify(event);
      const msgId = `msg_e2e_${crypto.randomUUID()}`;
      const timestamp = new Date();
      const signature = wh.sign(msgId, timestamp, payload);

      const response = await apiContext.post("/api/polar/webhooks", {
        data: payload,
        headers: {
          "content-type": "application/json",
          "webhook-id": msgId,
          "webhook-timestamp": Math.floor(timestamp.getTime() / 1000).toString(),
          "webhook-signature": signature,
        },
      });

      if (!response.ok()) {
        throw new Error(
          `Polar webhook simulation failed: ${response.status()} ${await response.text()}`
        );
      }

      return response;
    }
    ```
  - Notes: `wh.sign()` returns `v1,<base64-hmac>` string (confirmed from source line 87). Headers follow Standard Webhooks spec. Uses `crypto.randomUUID()` for `msgId` to avoid collisions.

- [ ] **Task 9: Migrate `purchase-credits.spec.ts` to use webhook helper**
  - File: `e2e/specs/purchase-credits.spec.ts`
  - Action: In the "credits section visible" test, after user creation and evidence seeding, add a step that sends a signed webhook to simulate a **relationship credit purchase** (not portrait unlock — this test is about credits):
    ```typescript
    import { sendPolarWebhook } from "../helpers/webhook.helper.js";
    import { POLAR_CONFIG } from "../e2e-env.js";

    await test.step("simulate credit purchase via webhook", async () => {
      const user = await getUserByEmail(uiTestEmail);
      await sendPolarWebhook(apiContext, {
        type: "order.paid",
        data: {
          id: crypto.randomUUID(),
          productId: POLAR_CONFIG.productRelationshipSingle,
          checkoutId: crypto.randomUUID(),
          totalAmount: 500,
          currency: "usd",
          customer: { externalId: user!.id },
        },
      });
    });
    ```
  - Action: After webhook step, assert **both API state and UI**:
    ```typescript
    await test.step("verify credits increased via API", async () => {
      const response = await apiContext.get("/api/purchase/credits");
      const data = await response.json();
      // Should have free_credit_granted (from signup) + credit_purchased (from webhook)
      expect(data.availableCredits).toBeGreaterThanOrEqual(2);
    });
    ```
  - Notes: Use `productRelationshipSingle` (not `productPortraitUnlock`) — this test validates relationship credits. The `onOrderPaid` handler inserts a `credit_purchased` event with 1 unit.

- [ ] **Task 10: Migrate `golden-path.spec.ts` portrait seeding to webhook**
  - File: `e2e/specs/golden-path.spec.ts`
  - Action: Switch import from `@playwright/test` to custom fixture (`../fixtures/base.fixture.js`) to get `apiContext`:
    ```typescript
    import { expect, test } from "../fixtures/base.fixture.js";
    ```
  - Action: Update test function signature to include `apiContext`:
    ```typescript
    test("golden path: ...", async ({ page, apiContext }) => {
    ```
  - Action: Replace lines 131-134 (`seedFullPortrait()` call) with webhook + polling:
    ```typescript
    await test.step("simulate portrait purchase via webhook", async () => {
      const user = await getUserByEmail(goldenEmail);
      await sendPolarWebhook(apiContext, {
        type: "order.paid",
        data: {
          id: crypto.randomUUID(),
          productId: POLAR_CONFIG.productPortraitUnlock,
          checkoutId: crypto.randomUUID(),
          totalAmount: 500,
          currency: "usd",
          customer: { externalId: user!.id },
        },
      });
    });

    await test.step("trigger portrait generation and wait for completion", async () => {
      // Portrait generation is lazy — triggered by polling getPortraitStatus
      await expect.poll(async () => {
        const res = await apiContext.get(`/api/portrait/${sessionId}/status`);
        if (!res.ok()) return "pending";
        const data = await res.json();
        return data.status;
      }, { timeout: 15_000, message: "Portrait generation did not complete" }).not.toBe("pending");

      await page.reload();
    });
    ```
  - Notes: Verify the exact portrait status endpoint path before implementing — may be `/api/portrait/:assessmentResultId/status` instead of `/api/portrait/:sessionId/status`. **Keep `seedFullPortrait()` utility in codebase** for other tests. The mock portrait generator is still active (LLM agents stay mocked).

- [ ] **Task 11: Add concrete serial config for email tests**
  - File: `e2e/playwright.config.ts`
  - Action: For any project that triggers email sending (e.g., `golden-path` which does signup → verification email), add `workers: 1` or `fullyParallel: false` to prevent Resend 429s:
    ```typescript
    {
      name: "golden-path",
      // ... existing config ...
      fullyParallel: false, // Serial — Resend rate limit 5 req/s
    }
    ```
  - Notes: Only needed for projects that trigger real email sending. Payment webhook tests are local-only and safe to parallelize.

- [ ] **Task 12: Verify full e2e suite passes**
  - Action: Run `pnpm test:e2e` with `.env.e2e` configured
  - Verify: All existing tests pass with live Resend layer
  - Verify: Webhook-migrated tests (purchase-credits, golden-path) pass with signed webhooks
  - Verify: Resend dashboard shows test emails with `+` labels (manual)
  - Verify: No Resend 429 rate limit errors
  - Verify: No typecheck errors from `PaymentGatewayRepository` removal

### Acceptance Criteria

- [ ] **AC1:** Given the e2e server starts with `index.e2e.ts`, when the server boots, then `ResendEmailResendRepositoryLive` is the active email layer (startup log confirms "Resend Email (sandbox)") and no payment gateway layer is listed.

- [ ] **AC2:** Given `RESEND_API_KEY` is not set in `.env.e2e`, when `pnpm test:e2e` runs, then global-setup throws `"RESEND_API_KEY not configured — set it in .env.e2e"` before any tests execute.

- [ ] **AC3:** Given `RESEND_API_KEY` is set with a valid sandbox key, when the e2e server sends an email via the Effect repo (drop-off re-engagement), then the Resend API accepts the request without error. *(Manual verification: email is visible in the Resend dashboard with the `+` label.)*

- [ ] **AC4:** Given a signed webhook payload with `type: "order.paid"` and a valid `productId`, when `sendPolarWebhook()` POSTs to `/api/polar/webhooks`, then Better Auth's `webhooks()` plugin validates the HMAC signature via `validateEvent()` and `onOrderPaid` inserts the purchase event into the database.

- [ ] **AC5:** Given `POLAR_WEBHOOK_SECRET` is set to `"whsec_dGVzdC1lMmUtd2ViaG9vay1zZWNyZXQ="` in `compose.e2e.yaml`, when the webhook helper signs with the same secret via `new Webhook(secret)`, then `standardwebhooks` accepts the secret as valid base64 and produces a signature that `validateEvent()` accepts.

- [ ] **AC6:** Given `POLAR_WEBHOOK_SECRET` in `compose.e2e.yaml` and `POLAR_CONFIG.webhookSecret` fallback in `e2e-env.ts`, when compared, then both resolve to the same canonical value `"whsec_dGVzdC1lMmUtd2ViaG9vay1zZWNyZXQ="`.

- [ ] **AC7:** Given `purchase-credits.spec.ts` runs, when the "simulate credit purchase via webhook" step executes with `productRelationshipSingle`, then `onOrderPaid` inserts a `credit_purchased` event and the credits API returns an increased count.

- [ ] **AC8:** Given `golden-path.spec.ts` runs with the `apiContext` fixture, when the portrait purchase webhook + portrait status polling executes, then the portrait placeholder is created via webhook, generation completes via lazy polling, and the portrait renders after page reload.

- [ ] **AC9:** Given the full e2e suite runs with sandbox credentials, when all specs execute, then zero Resend 429 rate limit errors occur (email-triggering projects run with `fullyParallel: false`).

- [ ] **AC10:** Given `.env.e2e.example` is read by a new contributor, when they copy it to `.env.e2e` and fill in their Resend sandbox key, then all e2e tests pass.

- [ ] **AC11:** Given a webhook with an already-used `checkoutId`, when `sendPolarWebhook()` POSTs it a second time, then the server returns success (no error) and no duplicate purchase event is created (idempotency via `onConflictDoNothing` on `polar_checkout_id`).

- [ ] **AC12:** Given `PaymentGatewayRepository` and all its implementations are deleted, when `pnpm typecheck` runs, then zero type errors occur (confirming the interface was dead code).

## Additional Context

### Dependencies

- `standardwebhooks` — npm package for Standard Webhooks signing. Already in lockfile as transitive dep of `@polar-sh/sdk`. Adding as direct dev dep for `sign()` access.
- Resend sandbox API key — stored in `.env.e2e` (gitignored). New contributors must obtain their own sandbox key from Resend.
- No new Polar sandbox account required — webhooks are simulated locally with known secret.

### Testing Strategy

- **Smoke test after Resend swap (Task 6):** Run existing e2e suite before webhook migration to verify the live Resend layer doesn't break tests.
- **Typecheck after deletion (Task 7):** Run `pnpm typecheck` to confirm `PaymentGatewayRepository` removal causes no type errors.
- **Webhook migration (Tasks 9-10):** Migrate DB-seeding tests to `sendPolarWebhook()`, exercising the full Better Auth `onOrderPaid` pipeline.
- **Email assertion:** Trust-no-throw. Live repo wraps Resend errors in `EmailError`.
- **Serialization:** Projects that trigger email sending use `fullyParallel: false` in Playwright config.
- **Fail-fast:** `global-setup.ts` checks `RESEND_API_KEY` before test data creation.

### CI / New Contributor Guidance

- New contributors must create a free Resend account and generate a sandbox API key
- Copy `.env.e2e.example` → `.env.e2e` and fill in `RESEND_API_KEY`
- The `POLAR_WEBHOOK_SECRET` has a hardcoded fallback — no Polar account needed
- If the Resend key expires or is revoked, only email-related assertions fail — webhook tests are self-contained

### Notes

- `.env.e2e` is gitignored (line 25 of `.gitignore`)
- LLM agent mocks remain in `index.e2e.ts` — cost and determinism reasons
- The webhook helper POSTs to `/api/polar/webhooks` (Better Auth endpoint), NOT an Effect handler
- Better Auth's own Resend client (verification emails) was already live — the mock swap only affects the Effect email repo
- `seedFullPortrait()` utility is kept in codebase for tests that don't need webhook pipeline
- Portrait status endpoint path must be verified before implementing Task 10

### Adversarial Review Findings (2026-03-24)

| ID | Severity | Finding | Resolution |
|----|----------|---------|-----------|
| F1 | Critical | Webhook endpoint bypasses `PaymentGatewayPolarRepositoryLive` entirely | Removed payment mock swap. Webhook helper POSTs directly to Better Auth endpoint. |
| F2 | Critical | Better Auth plugin verification mismatch | Verified: plugin uses `validateEvent` from `@polar-sh/sdk/webhooks` which uses `standardwebhooks`. Chain confirmed. |
| F3 | Critical | `whsec_e2e-test-secret` is not valid base64 | Changed to `whsec_dGVzdC1lMmUtd2ViaG9vay1zZWNyZXQ=` (valid base64). |
| F4 | High | `onOrderPaid` does not insert `free_credit_granted` | Corrected description. `free_credit_granted` is on signup, not webhook. |
| F5 | High | Resend API key hardcoded in spec | Removed. Placeholder only in `.env.e2e.example`. |
| F6 | High | Fail-fast check runs in Playwright, not Docker | Documented env flow: `.env.e2e` → `--env-file` → container. Check is valid. |
| F7 | High | `golden-path.spec.ts` has no `apiContext` fixture | Added fixture migration step in Task 10. |
| F8 | High | Portrait seeding not equivalent (placeholder vs completed) | Added portrait status polling + lazy generation trigger in Task 10. |
| F9 | Medium | Serial email execution not implemented | Added concrete `fullyParallel: false` config in Task 11. |
| F10 | Medium | Better Auth has its own Resend client | Clarified scope: swap only covers Effect email repo. BA emails were always live. |
| F11 | Medium | No fallback if Resend key expires | Added CI/contributor guidance section. |
| F12 | Low | Wrong product for `purchase-credits` test | Changed to `productRelationshipSingle` (credit purchase, not portrait). |
| F13 | Low | `Date.now()` checkoutId collision | Changed to `crypto.randomUUID()`. |
