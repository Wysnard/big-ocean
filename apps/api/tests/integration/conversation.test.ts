/**
 * Conversation Flow Integration Tests
 *
 * Validates the authenticated conversation HTTP stack against the Dockerized API.
 * Uses Better Auth cookies and real HTTP requests, with mock LLM adapters from index.e2e.ts.
 */

import { randomUUID } from "node:crypto";
import {
	FinalizationStatusResponseSchema,
	GetResultsResponseSchema,
	ListSessionsResponseSchema,
	ResumeSessionResponseSchema,
	SendMessageResponseSchema,
	StartConversationResponseSchema,
} from "@workspace/contracts";
import { TRAIT_LETTER_MAP } from "@workspace/domain";
import bcrypt from "bcryptjs";
import { Schema } from "effect";
import pg from "pg";
import { describe, expect, test } from "vitest";

const API_URL = process.env.API_URL || "http://localhost:4001";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const TEST_DB_URL = "postgresql://test_user:test_password@localhost:5433/bigocean_test";

async function postJson(path: string, body: unknown, cookie?: string): Promise<Response> {
	return fetch(`${API_URL}${path}`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			...(cookie ? { Cookie: cookie } : {}),
		},
		body: JSON.stringify(body),
	});
}

async function getJson(path: string, cookie?: string): Promise<Response> {
	return fetch(`${API_URL}${path}`, {
		headers: {
			...(cookie ? { Cookie: cookie } : {}),
		},
	});
}

function extractCookie(response: Response): string {
	const setCookies = response.headers.getSetCookie();
	const cookie = setCookies
		.map((header) => header.split(";")[0])
		.find((header) => header.includes("session_token"));
	if (!cookie) {
		throw new Error(`Expected Better Auth session cookie, got: ${setCookies.join(", ")}`);
	}
	return cookie;
}

async function createVerifiedCredentialUser(email: string, password: string): Promise<void> {
	const pool = new pg.Pool({ connectionString: TEST_DB_URL });
	try {
		const userId = `user_${randomUUID()}`;
		const passwordHash = await bcrypt.hash(password, 12);
		await pool.query(
			`INSERT INTO "user" (id, name, email, email_verified, created_at, updated_at)
			 VALUES ($1, $2, $3, TRUE, NOW(), NOW())`,
			[userId, "Integration User", email],
		);
		await pool.query(
			`INSERT INTO account (id, account_id, provider_id, user_id, password, created_at, updated_at)
			 VALUES ($1, $2, 'credential', $3, $4, NOW(), NOW())`,
			[`account_${randomUUID()}`, userId, userId, passwordHash],
		);
	} finally {
		await pool.end();
	}
}

async function createAuthenticatedCookie(): Promise<string> {
	const id = randomUUID();
	const email = `conversation-${id}@example.com`;
	const password = `B!gOcean-${id}-secure-password`;

	await createVerifiedCredentialUser(email, password);

	const signInResponse = await postJson("/api/auth/sign-in/email", {
		email,
		password,
	});
	expect(signInResponse.status).toBeLessThan(300);

	return extractCookie(signInResponse);
}

async function startConversation(cookie: string): Promise<string> {
	const response = await postJson("/api/conversation/start", {}, cookie);
	expect(response.status).toBe(200);

	const decoded = Schema.decodeUnknownSync(StartConversationResponseSchema)(await response.json());
	expect(decoded.sessionId).toBeDefined();
	expect(decoded.messages.length).toBeGreaterThan(0);
	return decoded.sessionId;
}

async function sendMessage(cookie: string, sessionId: string, message: string): Promise<boolean> {
	const response = await postJson("/api/conversation/message", { sessionId, message }, cookie);
	expect(response.status).toBe(200);

	const decoded = Schema.decodeUnknownSync(SendMessageResponseSchema)(await response.json());
	expect(decoded.response.length).toBeGreaterThan(0);
	return decoded.isFinalTurn;
}

describe("Authenticated conversation flow", () => {
	test("requires authentication to start a conversation", async () => {
		const response = await postJson("/api/conversation/start", {});
		expect(response.status).toBe(401);
	});

	test("starts, sends messages, resumes, finalizes, and returns results for the owner", async () => {
		const cookie = await createAuthenticatedCookie();
		const sessionId = await startConversation(cookie);

		expect(
			await sendMessage(
				cookie,
				sessionId,
				"I love exploring new creative ideas and imagining possibilities.",
			),
		).toBe(false);
		expect(
			await sendMessage(
				cookie,
				sessionId,
				"I tend to be organized and like making plans ahead of time.",
			),
		).toBe(false);
		expect(
			await sendMessage(cookie, sessionId, "I enjoy social gatherings and meeting new people."),
		).toBe(true);

		const resumeResponse = await getJson(`/api/conversation/${sessionId}/resume`, cookie);
		expect(resumeResponse.status).toBe(200);
		const resumed = Schema.decodeUnknownSync(ResumeSessionResponseSchema)(
			await resumeResponse.json(),
		);
		expect(resumed.messages.length).toBeGreaterThanOrEqual(6);
		expect(resumed.status).toBe("finalizing");

		const prematureResults = await getJson(`/api/conversation/${sessionId}/results`, cookie);
		expect(prematureResults.status).toBe(409);
		expect((await prematureResults.json())._tag).toBe("SessionNotCompleted");

		const statusResponse = await getJson(
			`/api/conversation/${sessionId}/finalization-status`,
			cookie,
		);
		expect(statusResponse.status).toBe(200);
		Schema.decodeUnknownSync(FinalizationStatusResponseSchema)(await statusResponse.json());

		const finalizeResponse = await postJson(
			`/api/conversation/${sessionId}/generate-results`,
			{},
			cookie,
		);
		expect(finalizeResponse.status).toBe(200);

		const resultsResponse = await getJson(`/api/conversation/${sessionId}/results`, cookie);
		expect(resultsResponse.status).toBe(200);
		const results = Schema.decodeUnknownSync(GetResultsResponseSchema)(await resultsResponse.json());

		expect(results.oceanCode5).toHaveLength(5);
		expect(results.oceanCode4).toHaveLength(4);
		expect(results.archetypeName.length).toBeGreaterThan(0);
		expect(results.archetypeColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
		expect(typeof results.isLatestVersion).toBe("boolean");

		const validTraitLevels = new Set(Object.values(TRAIT_LETTER_MAP).flat());
		expect(results.traits).toHaveLength(5);
		for (const trait of results.traits) {
			expect(trait.score).toBeGreaterThanOrEqual(0);
			expect(trait.score).toBeLessThanOrEqual(120);
			expect(validTraitLevels.has(trait.level)).toBe(true);
		}
		expect(results.facets).toHaveLength(30);
		expect(results.overallConfidence).toBeGreaterThanOrEqual(0);
		expect(results.overallConfidence).toBeLessThanOrEqual(100);

		const sessionsResponse = await getJson("/api/conversation/sessions", cookie);
		expect(sessionsResponse.status).toBe(200);
		const sessions = Schema.decodeUnknownSync(ListSessionsResponseSchema)(
			await sessionsResponse.json(),
		);
		expect(sessions.sessions.some((session) => session.id === sessionId)).toBe(true);
	});

	test("does not allow another authenticated user to read a conversation", async () => {
		const ownerCookie = await createAuthenticatedCookie();
		const otherCookie = await createAuthenticatedCookie();
		const sessionId = await startConversation(ownerCookie);

		const response = await getJson(`/api/conversation/${sessionId}/resume`, otherCookie);
		expect(response.status).toBe(404);
	});
});

describe("CORS - conversation endpoints", () => {
	test("includes CORS headers on unauthenticated POST /api/conversation/start", async () => {
		const response = await fetch(`${API_URL}/api/conversation/start`, {
			method: "POST",
			headers: {
				Origin: FRONTEND_URL,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({}),
		});

		expect(response.status).toBe(401);
		expect(response.headers.get("Access-Control-Allow-Origin")).toBe(FRONTEND_URL);
		expect(response.headers.get("Access-Control-Allow-Credentials")).toBe("true");
	});

	test("includes CORS headers on unauthenticated POST /api/conversation/message", async () => {
		const response = await fetch(`${API_URL}/api/conversation/message`, {
			method: "POST",
			headers: {
				Origin: FRONTEND_URL,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				sessionId: "session_test",
				message: "Test message",
			}),
		});

		expect(response.status).toBe(401);
		expect(response.headers.get("Access-Control-Allow-Origin")).toBe(FRONTEND_URL);
		expect(response.headers.get("Access-Control-Allow-Credentials")).toBe("true");
	});
});
