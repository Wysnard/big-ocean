/**
 * Assessment Factory — session creation + message sending via Playwright APIRequestContext,
 * DB seeding for evidence data (no API endpoint for bulk evidence).
 */

import type { APIRequestContext } from "@playwright/test";
import pg from "pg";
import { TEST_DB_CONFIG } from "../e2e-env.js";

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
 * Start a new assessment session via the API.
 * If the APIRequestContext has auth cookies, the session is owned by that user.
 */
export async function createAssessmentSession(api: APIRequestContext): Promise<string> {
	const res = await api.post("/api/assessment/start", { data: {} });

	if (!res.ok()) {
		const body = await res.text();
		throw new Error(`Assessment start failed (${res.status()}): ${body}`);
	}

	const data = (await res.json()) as { sessionId: string };
	return data.sessionId;
}

/**
 * Send a user message to an existing assessment session via the API.
 */
export async function sendAssessmentMessage(
	api: APIRequestContext,
	sessionId: string,
	message: string,
): Promise<void> {
	const res = await api.post("/api/assessment/message", {
		data: { sessionId, message },
	});

	if (!res.ok()) {
		const body = await res.text();
		console.warn(`[assessment.factory] send-message returned ${res.status()}: ${body}`);
	}
}

/**
 * Create a shareable public profile for a session.
 */
export async function createShareableProfile(
	api: APIRequestContext,
	sessionId: string,
): Promise<{ publicProfileId: string; shareableUrl: string }> {
	const res = await api.post("/api/public-profile/share", {
		data: { sessionId },
	});

	if (!res.ok()) {
		const body = await res.text();
		throw new Error(`Share profile failed (${res.status()}): ${body}`);
	}

	return (await res.json()) as { publicProfileId: string; shareableUrl: string };
}

/**
 * Toggle a public profile's visibility.
 */
export async function toggleProfileVisibility(
	api: APIRequestContext,
	publicProfileId: string,
	isPublic: boolean,
): Promise<void> {
	const res = await api.patch(`/api/public-profile/${publicProfileId}/visibility`, {
		data: { isPublic },
	});

	if (!res.ok()) {
		const body = await res.text();
		throw new Error(`Toggle visibility failed (${res.status()}): ${body}`);
	}
}

// ── DB seeding (no API endpoints for bulk evidence) ─────────────────────

/**
 * Seed a session with enough data for the results page to render:
 * - 2 assessment_message rows (user + assistant)
 * - 30 conversation_evidence rows (one per facet, Story 9.1 schema)
 * - Updates session to status=completed, message_count=2
 */
export async function seedSessionForResults(sessionId: string): Promise<void> {
	const pool = new Pool(TEST_DB_CONFIG);
	const client = await pool.connect();

	const domains = ["work", "relationships", "family", "leisure", "solo", "other"];

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

		await client.query(
			`INSERT INTO assessment_message (session_id, role, content, created_at)
			 VALUES ($1, 'assistant', $2, NOW())
			 RETURNING id`,
			[
				sessionId,
				"It sounds like you value both connection and curiosity. Tell me more about what excites you.",
			],
		);

		// 2. Insert 30 conversation_evidence rows (one per facet, Story 9.1 schema)
		const facetScores: { facet: string; score: number; confidence: string }[] = [];
		for (let i = 0; i < ALL_FACETS.length; i++) {
			const facet = ALL_FACETS[i];
			const score = 10 + Math.floor(Math.random() * 8); // 10-17 range (0-20 scale)
			const confidence = (0.6 + Math.random() * 0.3).toFixed(3); // 0.600-0.899
			const domain = domains[i % domains.length];
			facetScores.push({ facet, score, confidence });

			await client.query(
				`INSERT INTO conversation_evidence
				 (assessment_session_id, assessment_message_id, bigfive_facet, score, confidence, domain, created_at)
				 VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
				[sessionId, userMsgId, facet, score, confidence, domain],
			);
		}

		// 3. Insert assessment_results row (needed by relationship analysis daemon)
		const facetsJson: Record<string, { score: number; confidence: number }> = {};
		const traitSums: Record<string, { total: number; count: number; confSum: number }> = {};
		for (const { facet, score, confidence } of facetScores) {
			facetsJson[facet] = { score, confidence: Number.parseFloat(confidence) };
			const trait = FACET_TO_TRAIT[facet];
			if (!traitSums[trait]) traitSums[trait] = { total: 0, count: 0, confSum: 0 };
			traitSums[trait].total += score;
			traitSums[trait].count += 1;
			traitSums[trait].confSum += Number.parseFloat(confidence);
		}
		const traitsJson: Record<string, { score: number; confidence: number }> = {};
		for (const [trait, sums] of Object.entries(traitSums)) {
			traitsJson[trait] = {
				score: sums.total,
				confidence: Number.parseFloat((sums.confSum / sums.count).toFixed(3)),
			};
		}
		const resultRow = await client.query(
			`INSERT INTO assessment_results (assessment_session_id, facets, traits, domain_coverage, portrait)
			 VALUES ($1, $2, $3, $4, $5)
			 RETURNING id`,
			[
				sessionId,
				JSON.stringify(facetsJson),
				JSON.stringify(traitsJson),
				JSON.stringify({}),
				"Seeded portrait",
			],
		);
		const resultId: string = resultRow.rows[0].id;

		// 4. Insert finalization_evidence rows (needed by relationship analysis daemon)
		for (let i = 0; i < facetScores.length; i++) {
			const { facet, score, confidence } = facetScores[i];
			const domain = domains[i % domains.length];
			await client.query(
				`INSERT INTO finalization_evidence
				 (assessment_result_id, assessment_message_id, bigfive_facet, score, confidence, domain, raw_domain, quote, highlight_start, highlight_end, created_at)
				 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())`,
				[resultId, userMsgId, facet, score, confidence, domain, domain, "Seeded evidence quote", 0, 22],
			);
		}

		// 5. Update session to completed with message_count >= 2
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
 * Grant extra invitation credits to a user via direct DB insert.
 * Inserts a `free_credit_granted` purchase event.
 */
export async function grantCredits(userId: string, count = 1): Promise<void> {
	const pool = new Pool(TEST_DB_CONFIG);
	const client = await pool.connect();

	try {
		for (let i = 0; i < count; i++) {
			await client.query(
				`INSERT INTO purchase_events (user_id, event_type, created_at)
				 VALUES ($1, 'free_credit_granted', NOW())`,
				[userId],
			);
		}
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
