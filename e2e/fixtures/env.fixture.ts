/**
 * Environment Fixture — provides env constants via Playwright fixtures.
 *
 * This is the ONLY file in fixtures/specs that should import from e2e-env.
 */

import { readFileSync } from "node:fs";
import { test as base, expect } from "@playwright/test";
import { API_URL, AUTH_FILES, OTHER_USER, OWNER_USER } from "../e2e-env.js";

interface EnvFixtures {
	ownerUser: typeof OWNER_USER;
	otherUser: typeof OTHER_USER;
	testSessionId: string;
	apiUrl: string;
}

export const test = base.extend<EnvFixtures>({
	ownerUser: [OWNER_USER, { option: true }],
	otherUser: [OTHER_USER, { option: true }],
	apiUrl: [API_URL, { option: true }],
	// biome-ignore lint/correctness/noEmptyPattern: Playwright fixture API requires destructured first arg
	testSessionId: async ({}, use) => {
		const data = JSON.parse(readFileSync(AUTH_FILES.testSession, "utf-8")) as {
			sessionId: string;
		};
		await use(data.sessionId);
	},
});

export { expect };
