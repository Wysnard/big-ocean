/**
 * Base Fixture — extends env fixture with a shared `apiContext` fixture.
 *
 * Usage:
 *   import { test, expect } from "../fixtures/base.fixture.js";
 *   test("...", async ({ page, apiContext }) => { ... });
 */

import type { APIRequestContext } from "@playwright/test";
import { request } from "@playwright/test";
import { test as envTest, expect } from "./env.fixture.js";

interface Fixtures {
	apiContext: APIRequestContext;
}

export const test = envTest.extend<Fixtures>({
	apiContext: async ({ apiUrl }, use) => {
		const ctx = await request.newContext({ baseURL: apiUrl });
		await use(ctx);
		await ctx.dispose();
	},
});

export { expect };
