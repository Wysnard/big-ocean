/**
 * Conversation Factory — session creation + message sending via Playwright APIRequestContext,
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
 * Start a new conversation session via the API.
 * If the APIRequestContext has auth cookies, the session is owned by that user.
 */
export async function createAssessmentSession(api: APIRequestContext): Promise<string> {
	const res = await api.post("/api/conversation/start", { data: {} });

	if (!res.ok()) {
		const body = await res.text();
		throw new Error(`Assessment start failed (${res.status()}): ${body}`);
	}

	const data = (await res.json()) as { sessionId: string };
	return data.sessionId;
}

/**
 * Send a user message to an existing conversation session via the API.
 */
export async function sendAssessmentMessage(
	api: APIRequestContext,
	sessionId: string,
	message: string,
): Promise<void> {
	const res = await api.post("/api/conversation/message", {
		data: { sessionId, message },
	});

	if (!res.ok()) {
		const body = await res.text();
		console.warn(`[conversation.factory] send-message returned ${res.status()}: ${body}`);
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
 * - 2 messages rows (user + assistant)
 * - 30 conversation_evidence rows (one per facet, Story 9.1 schema)
 * - Updates session to status=completed, message_count=2
 */
export async function seedSessionForResults(sessionId: string): Promise<void> {
	const pool = new Pool(TEST_DB_CONFIG);
	const client = await pool.connect();

	const domains = ["work", "relationships", "family", "leisure", "health", "other"];

	try {
		await client.query("BEGIN");

		// 1. Insert two conversation messages
		const userMsgResult = await client.query(
			`INSERT INTO messages (conversation_id, role, content, created_at)
			 VALUES ($1, 'user', $2, NOW())
			 RETURNING id`,
			[sessionId, "I enjoy spending time with close friends and exploring new ideas."],
		);
		const userMsgId: string = userMsgResult.rows[0].id;

		await client.query(
			`INSERT INTO messages (conversation_id, role, content, created_at)
			 VALUES ($1, 'assistant', $2, NOW())
			 RETURNING id`,
			[
				sessionId,
				"It sounds like you value both connection and curiosity. Tell me more about what excites you.",
			],
		);

		// 2. Insert 30 conversation_evidence rows (one per facet, v2 schema)
		const strengths = ["weak", "moderate", "strong"] as const;
		const confidences = ["low", "medium", "high"] as const;
		const facetScores: { facet: string; score: number; confidence: string }[] = [];
		for (let i = 0; i < ALL_FACETS.length; i++) {
			const facet = ALL_FACETS[i];
			const deviation = Math.floor(Math.random() * 5) - 2; // -2 to 2
			const strength = strengths[i % 3];
			const confidence = confidences[Math.min(2, Math.floor(i / 10))];
			const domain = domains[i % domains.length];
			// Keep facetScores for downstream assessment_results computation
			const score = 10 + deviation + 2; // map deviation to 0-20ish range
			facetScores.push({
				facet,
				score,
				confidence: confidence === "high" ? "0.850" : confidence === "medium" ? "0.700" : "0.550",
			});

			const polarity = deviation >= 0 ? "high" : "low";
			await client.query(
				`INSERT INTO conversation_evidence
				 (conversation_id, message_id, bigfive_facet, strength, confidence, domain, polarity, note, created_at)
				 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
				[
					sessionId,
					userMsgId,
					facet,
					strength,
					confidence,
					domain,
					polarity,
					`Seed evidence for ${facet}`,
				],
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
			`INSERT INTO assessment_results (conversation_id, facets, traits, domain_coverage, portrait)
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
		const _resultId: string = resultRow.rows[0].id;

		// 4. Insert conversation_evidence rows (needed by portrait/relationship analysis)
		for (let i = 0; i < facetScores.length; i++) {
			const { facet, score, confidence } = facetScores[i];
			const domain = domains[i % domains.length];
			// Map legacy score/confidence to v2 format
			const deviation = Math.round(((score - 10) / 10) * 3);
			const strength = confidence >= 0.7 ? "strong" : confidence >= 0.4 ? "moderate" : "weak";
			const confEnum = confidence >= 0.7 ? "high" : confidence >= 0.4 ? "medium" : "low";
			const polarity = deviation >= 0 ? "high" : "low";
			await client.query(
				`INSERT INTO conversation_evidence
				 (conversation_id, message_id, bigfive_facet, strength, confidence, domain, polarity, note, created_at)
				 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
				[sessionId, userMsgId, facet, strength, confEnum, domain, polarity, "Seeded evidence note"],
			);
		}

		// 5. Update session to completed with message_count >= 2
		await client.query(
			`UPDATE conversations
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
		await client.query(`UPDATE conversations SET user_id = $1, updated_at = NOW() WHERE id = $2`, [
			userId,
			sessionId,
		]);
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
		const result = await client.query(`SELECT user_id FROM conversations WHERE id = $1`, [sessionId]);
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
 * Seed a full portrait row for a session so the results page renders PersonalPortrait.
 * Looks up the assessment_results row for the session and inserts a "full" tier portrait.
 */
export async function seedFullPortrait(sessionId: string): Promise<void> {
	const pool = new Pool(TEST_DB_CONFIG);
	const client = await pool.connect();

	try {
		const resultRow = await client.query(
			`SELECT id FROM assessment_results WHERE conversation_id = $1 LIMIT 1`,
			[sessionId],
		);
		if (resultRow.rows.length === 0) {
			throw new Error(`No assessment_results found for session ${sessionId}`);
		}
		const assessmentResultId: string = resultRow.rows[0].id;

		await client.query(
			`INSERT INTO portraits (assessment_result_id, tier, content, model_used, created_at)
			 VALUES ($1, 'full', $2, 'e2e-seed', NOW())
			 ON CONFLICT (assessment_result_id, tier) DO UPDATE SET content = $2`,
			[assessmentResultId, SEED_FULL_PORTRAIT],
		);
	} finally {
		client.release();
		await pool.end();
	}
}

const SEED_FULL_PORTRAIT = `# The Explorer's Mind

You approach the world with a rare combination of intellectual curiosity and emotional depth. Your conversations reveal someone who doesn't just think about ideas — you feel them, turning abstract concepts into lived experiences.

## Openness & Curiosity

Your imagination isn't idle daydreaming; it's an active force that shapes how you engage with everything from creative projects to everyday problem-solving. You're drawn to novelty not for its own sake, but because you genuinely believe there's always something new to discover.

## Connection & Independence

There's an interesting tension in your personality: you value deep, meaningful connections with others, yet you also need space to explore on your own terms. This isn't contradictory — it's what makes your relationships feel authentic rather than performative.`;

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
