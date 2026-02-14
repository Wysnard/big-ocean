/**
 * Playwright Setup Project — creates test users, links assessment session,
 * seeds evidence data, and saves browser storage state for spec files.
 *
 * Runs before all access-control spec files.
 */

import { writeFileSync } from "node:fs";
import { test as setup } from "@playwright/test";
import { AUTH_FILES, OTHER_USER, OWNER_USER } from "../e2e-env.js";
import {
	createAssessmentSession,
	getSessionUserId,
	getUserByEmail,
	linkSessionToUser,
	seedSessionForResults,
} from "../factories/assessment.factory.js";
import { createUser } from "../factories/user.factory.js";

/**
 * Parse Set-Cookie headers into Playwright cookie objects.
 */
function parseCookies(setCookieHeaders: string[]): Array<{
	name: string;
	value: string;
	domain: string;
	path: string;
	expires: number;
	httpOnly: boolean;
	secure: boolean;
	sameSite: "Strict" | "Lax" | "None";
}> {
	return setCookieHeaders.map((header) => {
		const parts = header.split(";").map((p) => p.trim());
		const [nameValue, ...attributes] = parts;
		const eqIdx = nameValue.indexOf("=");
		const name = nameValue.slice(0, eqIdx);
		const value = nameValue.slice(eqIdx + 1);

		const attrs: Record<string, string> = {};
		for (const attr of attributes) {
			const [key, val] = attr.split("=");
			attrs[key.toLowerCase().trim()] = val?.trim() ?? "";
		}

		return {
			name,
			value,
			domain: attrs.domain || "localhost",
			path: attrs.path || "/",
			expires: attrs["max-age"] ? Math.floor(Date.now() / 1000) + Number(attrs["max-age"]) : -1,
			httpOnly: "httponly" in attrs,
			secure: "secure" in attrs,
			sameSite: (attrs.samesite as "Strict" | "Lax" | "None") || "Lax",
		};
	});
}

/**
 * Write a Playwright-compatible storage state JSON file from cookies.
 */
function writeStorageState(filePath: string, cookies: ReturnType<typeof parseCookies>): void {
	writeFileSync(filePath, JSON.stringify({ cookies, origins: [] }, null, 2));
}

// ── Setup: create owner user with linked session ────────────────────────

setup("create owner and other-user auth state", async () => {
	// 1. Create an anonymous assessment session via the API
	const sessionId = await createAssessmentSession();
	console.log(`[auth.setup] Created anonymous session: ${sessionId}`);

	// 2. Sign up the owner user with anonymousSessionId → triggers session linking hook
	const ownerAuth = await createUser({
		...OWNER_USER,
		anonymousSessionId: sessionId,
	});
	console.log(`[auth.setup] Owner signed up: ${OWNER_USER.email}`);

	// 3. Verify the Better Auth hook linked the session, fallback to direct DB update
	const linkedUserId = await getSessionUserId(sessionId);
	if (!linkedUserId) {
		console.log("[auth.setup] Hook did not link session, falling back to direct DB update");
		const ownerUser = await getUserByEmail(OWNER_USER.email);
		if (!ownerUser) throw new Error("Owner user not found after sign-up");
		await linkSessionToUser(sessionId, ownerUser.id);
		console.log(`[auth.setup] Linked session ${sessionId} to user ${ownerUser.id}`);
	} else {
		console.log(`[auth.setup] Session linked to user ${linkedUserId} via hook`);
	}

	// 4. Seed facet_evidence so results page renders
	await seedSessionForResults(sessionId);
	console.log("[auth.setup] Seeded evidence data for results");

	// 5. Save owner storage state
	const ownerCookies = parseCookies(ownerAuth.setCookieHeaders);
	writeStorageState(AUTH_FILES.owner, ownerCookies);
	console.log(`[auth.setup] Saved owner storage state → ${AUTH_FILES.owner}`);

	// 6. Sign up the other user (no session link)
	const otherAuth = await createUser(OTHER_USER);
	console.log(`[auth.setup] Other user signed up: ${OTHER_USER.email}`);

	// 7. Save other user storage state
	const otherCookies = parseCookies(otherAuth.setCookieHeaders);
	writeStorageState(AUTH_FILES.otherUser, otherCookies);
	console.log(`[auth.setup] Saved other-user storage state → ${AUTH_FILES.otherUser}`);

	// 8. Write test session ID for spec files
	writeFileSync(AUTH_FILES.testSession, JSON.stringify({ sessionId }));
	console.log(`[auth.setup] Wrote test session → ${AUTH_FILES.testSession}`);
});
