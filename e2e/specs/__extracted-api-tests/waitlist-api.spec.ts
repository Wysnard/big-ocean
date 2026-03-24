import { expect, test } from "../../fixtures/base.fixture.js";

/**
 * Waitlist API Tests (Story 15.3) — extracted from e2e/specs/waitlist.spec.ts
 *
 * These are pure API tests (no browser interaction) and belong in the
 * integration test tier. They live here temporarily until migrated.
 *
 * Tests:
 * - POST /api/waitlist/signup accepts valid email
 * - Duplicate email is handled gracefully (idempotent)
 * - Invalid email is rejected by contract validation
 */

test.describe("Waitlist API", () => {
	test("POST /api/waitlist/signup — valid email returns ok", async ({ apiContext, apiUrl }) => {
		const uniqueEmail = `e2e-waitlist-${Date.now()}@gmail.com`;

		const res = await apiContext.post(`${apiUrl}/api/waitlist/signup`, {
			data: { email: uniqueEmail },
		});

		if (res.status() !== 200) {
			console.error("API error:", res.status(), await res.text());
		}
		expect(res.status()).toBe(200);
		const body = await res.json();
		expect(body).toEqual({ ok: true });
	});

	test("POST /api/waitlist/signup — duplicate email succeeds (idempotent)", async ({
		apiContext,
		apiUrl,
	}) => {
		const uniqueEmail = `e2e-waitlist-dup-${Date.now()}@gmail.com`;

		// First signup
		const res1 = await apiContext.post(`${apiUrl}/api/waitlist/signup`, {
			data: { email: uniqueEmail },
		});
		expect(res1.status()).toBe(200);

		// Same email again — should still succeed
		const res2 = await apiContext.post(`${apiUrl}/api/waitlist/signup`, {
			data: { email: uniqueEmail },
		});
		expect(res2.status()).toBe(200);
		const body = await res2.json();
		expect(body).toEqual({ ok: true });
	});

	test("POST /api/waitlist/signup — invalid email rejected", async ({ apiContext, apiUrl }) => {
		const res = await apiContext.post(`${apiUrl}/api/waitlist/signup`, {
			data: { email: "not-an-email" },
		});

		// Contract validation rejects malformed email
		expect(res.status()).toBeGreaterThanOrEqual(400);
	});
});
