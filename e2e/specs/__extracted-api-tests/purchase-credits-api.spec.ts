/**
 * Purchase Credits API Tests (Story 14.1) — extracted from e2e/specs/purchase-credits.spec.ts
 *
 * These are pure API tests (no browser interaction) and belong in the
 * integration test tier. They live here temporarily until migrated.
 *
 * Validates:
 * - Free credit granted on signup (AC1)
 * - Credits endpoint returns correct state (AC2)
 */

import { execSync } from "node:child_process";
import {
	createAssessmentSession,
	seedSessionForResults,
} from "../../factories/conversation.factory.js";
import { createUser } from "../../factories/user.factory.js";
import { expect, test } from "../../fixtures/base.fixture.js";

const CREDITS_USER = {
	email: `e2e-credits-${Date.now()}@gmail.com`,
	password: "OceanDepth#Nerin42xQ",
	name: "Credits Tester",
} as const;

const NO_ASSESSMENT_USER = {
	email: `e2e-no-assess-${Date.now()}@gmail.com`,
	password: "OceanDepth#Nerin42xQ",
	name: "No Assessment User",
} as const;

test.describe("Purchase Credits API", () => {
	test.setTimeout(60_000);

	const todayKey = new Date().toISOString().slice(0, 10);
	const redisKey = `global_assessments:${todayKey}`;

	test.beforeAll(() => {
		execSync(`docker exec bigocean-redis-e2e redis-cli DEL ${redisKey}`);
	});

	test("free credit granted on signup and credits endpoint returns correct state", async ({
		apiContext,
	}) => {
		let sessionId = "";

		await test.step("sign up user and create owned session", async () => {
			await createUser(apiContext, CREDITS_USER);
			sessionId = await createAssessmentSession(apiContext);
		});

		await test.step("seed results", async () => {
			try {
				await seedSessionForResults(sessionId);
			} catch (err) {
				console.warn(
					`[purchase-credits] Skipping evidence seed: ${err instanceof Error ? err.message : err}`,
				);
			}
		});

		await test.step("verify credits endpoint returns 1 credit + completed assessment", async () => {
			const response = await apiContext.get("/api/purchase/credits");
			expect(response.ok()).toBe(true);

			const data = await response.json();
			expect(data.availableCredits).toBe(1);
			expect(data.hasCompletedAssessment).toBe(true);
		});
	});

	test("credits endpoint returns correct state for user without assessment", async ({
		apiContext,
	}) => {
		await test.step("sign up user without session", async () => {
			await createUser(apiContext, NO_ASSESSMENT_USER);
		});

		await test.step("verify credits endpoint returns 1 credit + no completed assessment", async () => {
			const response = await apiContext.get("/api/purchase/credits");
			expect(response.ok()).toBe(true);

			const data = await response.json();
			expect(data.availableCredits).toBe(1);
			expect(data.hasCompletedAssessment).toBe(false);
		});
	});
});
