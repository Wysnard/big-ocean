/**
 * Base Fixture — extends Playwright `test` with a shared `apiContext` fixture.
 *
 * Usage:
 *   import { test, expect } from "../fixtures/base.fixture.js";
 *   test("...", async ({ page, apiContext }) => { ... });
 */

import type { APIRequestContext } from "@playwright/test";
import { test as base, expect } from "@playwright/test";
import { createApiContext } from "../utils/api-client.js";

interface Fixtures {
	apiContext: APIRequestContext;
}

export const test = base.extend<Fixtures>({
	// biome-ignore lint/correctness/noEmptyPattern: Playwright fixture API requires destructured first arg
	apiContext: async ({}, use) => {
		const ctx = await createApiContext();
		await use(ctx);
		await ctx.dispose();
	},
});

export { expect };
