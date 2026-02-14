/**
 * Assessment Factory — session creation via API + DB seeding for results.
 */

import pg from "pg";
import { API_URL, TEST_DB_CONFIG } from "../e2e-env.js";

const { Pool } = pg;

// ── Big Five facets (mirrors domain/src/constants/big-five.ts) ──────────

const FACET_TO_TRAIT: Record<string, string> = {
	imagination: "openness",
	artistic_interests: "openness",
	emotionality: "openness",
	adventurousness: "openness",
	intellect: "openness",
	liberalism: "openness",
	self_efficacy: "conscientiousness",
	orderliness: "conscientiousness",
	dutifulness: "conscientiousness",
	achievement_striving: "conscientiousness",
	self_discipline: "conscientiousness",
	cautiousness: "conscientiousness",
	friendliness: "extraversion",
	gregariousness: "extraversion",
	assertiveness: "extraversion",
	activity_level: "extraversion",
	excitement_seeking: "extraversion",
	cheerfulness: "extraversion",
	trust: "agreeableness",
	morality: "agreeableness",
	altruism: "agreeableness",
	cooperation: "agreeableness",
	modesty: "agreeableness",
	sympathy: "agreeableness",
	anxiety: "neuroticism",
	anger: "neuroticism",
	depression: "neuroticism",
	self_consciousness: "neuroticism",
	immoderation: "neuroticism",
	vulnerability: "neuroticism",
};

const ALL_FACETS = Object.keys(FACET_TO_TRAIT);

// ── API helpers ─────────────────────────────────────────────────────────

/**
 * Start a new anonymous assessment session via the API.
 * Returns the session ID assigned by the backend.
 */
export async function createAssessmentSession(cookieHeader?: string): Promise<string> {
	const headers: Record<string, string> = {
		"Content-Type": "application/json",
	};
	if (cookieHeader) {
		headers.Cookie = cookieHeader;
	}

	const res = await fetch(`${API_URL}/api/assessment/start`, {
		method: "POST",
		headers,
		body: JSON.stringify({}),
	});

	if (!res.ok) {
		const body = await res.text();
		throw new Error(`Assessment start failed (${res.status}): ${body}`);
	}

	const data = (await res.json()) as { sessionId: string };
	return data.sessionId;
}

// ── DB seeding ──────────────────────────────────────────────────────────

/**
 * Seed a session with enough data for the results page to render:
 * - 2 assessment_message rows (user + assistant)
 * - 30 facet_evidence rows (one per facet)
 * - Updates session to status=completed, message_count=2
 */
export async function seedSessionForResults(sessionId: string): Promise<void> {
	const pool = new Pool(TEST_DB_CONFIG);
	const client = await pool.connect();

	try {
		await client.query("BEGIN");

		// 1. Insert two conversation messages
		const userMsgResult = await client.query(
			`INSERT INTO assessment_message (session_id, role, content, created_at)
			 VALUES ($1, 'user', $2, NOW())
			 RETURNING id`,
			[sessionId, "I enjoy spending time with close friends and exploring new ideas."],
		);
		const userMsgId: string = userMsgResult.rows[0].id;

		const assistantMsgResult = await client.query(
			`INSERT INTO assessment_message (session_id, role, content, created_at)
			 VALUES ($1, 'assistant', $2, NOW())
			 RETURNING id`,
			[
				sessionId,
				"It sounds like you value both connection and curiosity. Tell me more about what excites you.",
			],
		);
		const _assistantMsgId: string = assistantMsgResult.rows[0].id;

		// 2. Insert 30 facet_evidence rows (one per facet, all linked to the user message)
		const userMsg = "I enjoy spending time with close friends and exploring new ideas.";

		for (const facet of ALL_FACETS) {
			const score = 12 + Math.floor(Math.random() * 6); // 12-17 range
			const confidence = 60 + Math.floor(Math.random() * 30); // 60-89 range
			const quote = userMsg.slice(0, 20);

			await client.query(
				`INSERT INTO facet_evidence
				 (assessment_message_id, facet_name, score, confidence, quote, highlight_start, highlight_end, created_at)
				 VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
				[userMsgId, facet, score, confidence, quote, 0, 20],
			);
		}

		// 3. Update session to completed with message_count >= 2
		await client.query(
			`UPDATE assessment_session
			 SET status = 'completed', message_count = 2, updated_at = NOW()
			 WHERE id = $1`,
			[sessionId],
		);

		await client.query("COMMIT");
	} catch (err) {
		await client.query("ROLLBACK");
		throw err;
	} finally {
		client.release();
		await pool.end();
	}
}

/**
 * Link an assessment session to a user ID via direct DB update.
 * Fallback in case the Better Auth hook doesn't fire in time.
 */
export async function linkSessionToUser(sessionId: string, userId: string): Promise<void> {
	const pool = new Pool(TEST_DB_CONFIG);
	const client = await pool.connect();

	try {
		await client.query(
			`UPDATE assessment_session SET user_id = $1, updated_at = NOW() WHERE id = $2`,
			[userId, sessionId],
		);
	} finally {
		client.release();
		await pool.end();
	}
}

/**
 * Look up the user_id for an assessment session.
 * Used to verify that the Better Auth hook linked the session.
 */
export async function getSessionUserId(sessionId: string): Promise<string | null> {
	const pool = new Pool(TEST_DB_CONFIG);
	const client = await pool.connect();

	try {
		const result = await client.query(`SELECT user_id FROM assessment_session WHERE id = $1`, [
			sessionId,
		]);
		return result.rows[0]?.user_id ?? null;
	} finally {
		client.release();
		await pool.end();
	}
}

/**
 * Look up a user by email in the Better Auth user table.
 */
export async function getUserByEmail(email: string): Promise<{ id: string } | null> {
	const pool = new Pool(TEST_DB_CONFIG);
	const client = await pool.connect();

	try {
		const result = await client.query(`SELECT id FROM "user" WHERE email = $1`, [email]);
		return result.rows[0] ?? null;
	} finally {
		client.release();
		await pool.end();
	}
}
