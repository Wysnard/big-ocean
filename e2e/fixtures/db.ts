/**
 * Playwright Database Fixture
 *
 * Provides direct PostgreSQL seeding for e2e tests that need pre-populated
 * assessment data (e.g., results page). Connects to the test Docker database.
 */

import { test as base, expect } from "@playwright/test";
import pg from "pg";

const { Pool } = pg;

// ── Connection config (matches compose.test.yaml) ──────────────────────

const TEST_DB_CONFIG = {
	host: "localhost",
	port: 5433,
	database: "bigocean_test",
	user: "test_user",
	password: "test_password",
};

// ── Big Five facet→trait mapping (mirrors domain/src/constants/big-five.ts) ──

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

const TRAITS = [
	"openness",
	"conscientiousness",
	"extraversion",
	"agreeableness",
	"neuroticism",
] as const;

// ── Profile types ───────────────────────────────────────────────────────

interface FacetSeed {
	facetName: string;
	score: number; // 0-20
	confidence: number; // 0-100
}

interface TraitSeed {
	traitName: string;
	score: number; // 0-120 (sum of 6 facet scores)
	confidence: number; // 0-100 (avg of facet confidences)
}

interface SeedProfile {
	status?: string;
	messageCount?: number;
	facets: FacetSeed[];
	traits: TraitSeed[];
	/** JSONB confidence map for assessment_session.confidence column */
	confidenceMap: Record<string, number>;
}

// ── Profile builders ────────────────────────────────────────────────────

/**
 * All facets score=15, confidence=80.
 * Trait scores: 90 each → all "H" → HHHHH / HHHH → "The Idealist" (curated)
 * overallConfidence = 80
 */
export function highConfidenceProfile(): SeedProfile {
	const facets: FacetSeed[] = ALL_FACETS.map((f) => ({
		facetName: f,
		score: 15,
		confidence: 80,
	}));

	const confidenceMap: Record<string, number> = {};
	for (const f of ALL_FACETS) confidenceMap[f] = 80;

	const traits: TraitSeed[] = TRAITS.map((t) => ({
		traitName: t,
		score: 90, // 6 × 15
		confidence: 80,
	}));

	return { status: "completed", messageCount: 18, facets, traits, confidenceMap };
}

/**
 * All facets score=10, confidence=30.
 * Trait scores: 60 each → all "M" → MMMMM / MMMM → "The Centered Moderate" (curated)
 * overallConfidence = 30 (< 50 threshold → low-confidence banner)
 */
export function lowConfidenceProfile(): SeedProfile {
	const facets: FacetSeed[] = ALL_FACETS.map((f) => ({
		facetName: f,
		score: 10,
		confidence: 30,
	}));

	const confidenceMap: Record<string, number> = {};
	for (const f of ALL_FACETS) confidenceMap[f] = 30;

	const traits: TraitSeed[] = TRAITS.map((t) => ({
		traitName: t,
		score: 60, // 6 × 10
		confidence: 30,
	}));

	return { status: "active", messageCount: 6, facets, traits, confidenceMap };
}

/**
 * Mixed scores: O=H, C=H, E=M, A=H, N=L → HHMHL → HHMH → "The Creative Diplomat" (curated)
 * overallConfidence = 68 (weighted average)
 *
 * Per-trait facet scores:
 *   Openness:          all 15 → sum 90 (H), confidence 80
 *   Conscientiousness: all 15 → sum 90 (H), confidence 75
 *   Extraversion:      all 10 → sum 60 (M), confidence 60
 *   Agreeableness:     all 15 → sum 90 (H), confidence 70
 *   Neuroticism:       all 5  → sum 30 (L), confidence 55
 */
export function mixedLevelsProfile(): SeedProfile {
	const traitFacetConfig: Record<string, { score: number; confidence: number }> = {
		openness: { score: 15, confidence: 80 },
		conscientiousness: { score: 15, confidence: 75 },
		extraversion: { score: 10, confidence: 60 },
		agreeableness: { score: 15, confidence: 70 },
		neuroticism: { score: 5, confidence: 55 },
	};

	const facets: FacetSeed[] = ALL_FACETS.map((f) => {
		const trait = FACET_TO_TRAIT[f];
		const config = traitFacetConfig[trait];
		return { facetName: f, score: config.score, confidence: config.confidence };
	});

	const confidenceMap: Record<string, number> = {};
	for (const f of ALL_FACETS) {
		const trait = FACET_TO_TRAIT[f];
		confidenceMap[f] = traitFacetConfig[trait].confidence;
	}

	const traits: TraitSeed[] = TRAITS.map((t) => {
		const cfg = traitFacetConfig[t];
		return {
			traitName: t,
			score: cfg.score * 6,
			confidence: cfg.confidence,
		};
	});

	// overallConfidence = mean of all 30 facet confidences
	// (6×80 + 6×75 + 6×60 + 6×70 + 6×55) / 30 = (480+450+360+420+330)/30 = 2040/30 = 68

	return { status: "completed", messageCount: 15, facets, traits, confidenceMap };
}

// ── DB fixture ──────────────────────────────────────────────────────────

interface EvidenceSeed {
	messageId: string;
	messageContent: string;
	messageRole: "user" | "assistant";
	facetName: string;
	score: number;
	confidence: number;
	quote: string;
	highlightStart: number;
	highlightEnd: number;
}

interface DbFixture {
	seedResultsData: (profile: SeedProfile) => Promise<string>;
	seedEvidenceData: (
		sessionId: string,
		evidence: EvidenceSeed[],
	) => Promise<{ sessionId: string; messageIds: string[] }>;
}

export const test = base.extend<{ db: DbFixture }>({
	// biome-ignore lint/correctness/noEmptyPattern: Playwright fixture API requires destructured first arg
	db: async ({}, use) => {
		const pool = new Pool(TEST_DB_CONFIG);
		const seededSessionIds: string[] = [];

		const seedResultsData = async (profile: SeedProfile): Promise<string> => {
			const client = await pool.connect();
			try {
				await client.query("BEGIN");

				// 1. Insert assessment_session
				const sessionResult = await client.query(
					`INSERT INTO assessment_session (status, confidence, message_count)
					 VALUES ($1, $2, $3)
					 RETURNING id`,
					[
						profile.status ?? "completed",
						JSON.stringify(profile.confidenceMap),
						profile.messageCount ?? 12,
					],
				);
				const sessionId: string = sessionResult.rows[0].id;
				seededSessionIds.push(sessionId);

				// 2. Insert facet_scores (30 rows)
				for (const facet of profile.facets) {
					await client.query(
						`INSERT INTO facet_scores (session_id, facet_name, score, confidence)
						 VALUES ($1, $2, $3, $4)`,
						[sessionId, facet.facetName, facet.score, facet.confidence],
					);
				}

				// 3. Insert trait_scores (5 rows)
				for (const trait of profile.traits) {
					await client.query(
						`INSERT INTO trait_scores (session_id, trait_name, score, confidence)
						 VALUES ($1, $2, $3, $4)`,
						[sessionId, trait.traitName, trait.score, trait.confidence],
					);
				}

				await client.query("COMMIT");
				return sessionId;
			} catch (err) {
				await client.query("ROLLBACK");
				throw err;
			} finally {
				client.release();
			}
		};

		const seedEvidenceData = async (
			sessionId: string,
			evidence: EvidenceSeed[],
		): Promise<{ sessionId: string; messageIds: string[] }> => {
			const client = await pool.connect();
			const messageIds: string[] = [];
			const messageIdMap = new Map<string, string>();

			try {
				await client.query("BEGIN");

				// 1. Insert unique messages first
				const uniqueMessages = Array.from(new Set(evidence.map((e) => e.messageId))).map((msgId) => {
					const ev = evidence.find((e) => e.messageId === msgId);
					return {
						tempId: msgId,
						content: ev?.messageContent || "",
						role: ev?.messageRole || "user",
					};
				});

				for (const msg of uniqueMessages) {
					const msgResult = await client.query(
						`INSERT INTO assessment_message (session_id, message, role, created_at)
						 VALUES ($1, $2, $3, NOW())
						 RETURNING id`,
						[sessionId, msg.content, msg.role],
					);
					const realId: string = msgResult.rows[0].id;
					messageIdMap.set(msg.tempId, realId);
					messageIds.push(realId);
				}

				// 2. Insert facet_evidence rows
				for (const ev of evidence) {
					const realMessageId = messageIdMap.get(ev.messageId);
					if (!realMessageId) continue;

					await client.query(
						`INSERT INTO facet_evidence
						 (assessment_message_id, facet_name, score, confidence, quote, highlight_start, highlight_end, created_at)
						 VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
						[
							realMessageId,
							ev.facetName,
							ev.score,
							ev.confidence,
							ev.quote,
							ev.highlightStart,
							ev.highlightEnd,
						],
					);
				}

				await client.query("COMMIT");
				return { sessionId, messageIds };
			} catch (err) {
				await client.query("ROLLBACK");
				throw err;
			} finally {
				client.release();
			}
		};

		await use({ seedResultsData, seedEvidenceData });

		// Cleanup: delete all seeded sessions (CASCADE handles child rows)
		if (seededSessionIds.length > 0) {
			const client = await pool.connect();
			try {
				for (const id of seededSessionIds) {
					await client.query("DELETE FROM assessment_session WHERE id = $1", [id]);
				}
			} finally {
				client.release();
			}
		}

		await pool.end();
	},
});

export { expect };
export type { EvidenceSeed };
