#!/usr/bin/env tsx
/**
 * Seed script to create a completed conversation session for quick manual testing
 *
 * Usage:
 *   pnpm seed:test-conversation
 *
 * Creates:
 * - Test user (if doesn't exist)
 * - Completed conversation session
 * - Exchange rows with Director model data (director briefs + coverage targets)
 * - Realistic conversation messages for a completed 15-turn assessment
 * - Assessment results (facets, traits, domain coverage)
 * - Conversation evidence linked to exchanges
 * - Public profile with OCEAN codes
 * - Second "peer" user (peer.invite.cta@bigocean.test) for manual testing: log in as the
 *   primary user and open the peer's public profile to exercise Invite into your Circle (Epic 6.2).
 *
 * Output: Prints session ID that can be used to navigate to /results/{conversationSessionId}
 *
 * Story 9.1: Updated for two-tier architecture — uses assessment_results
 * and conversation_evidence tables.
 * Story 44-2: Added exchange rows with Director model data (director briefs,
 * coverage targets), linked messages and evidence to exchanges.
 */

import "dotenv/config"; // Load .env file
import { Polar } from "@polar-sh/sdk";
import type { FacetName, LifeDomain } from "@workspace/domain";
import { AppConfig } from "@workspace/domain";
import { AppConfigLive, Database, DatabaseStack, dbSchema } from "@workspace/infrastructure";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { Effect, Redacted } from "effect";

const {
	account,
	exchange,
	message,
	assessmentResults,
	conversation,
	conversationEvidence,
	publicProfile,
	user,
} = dbSchema;

const TEST_USER_EMAIL = "vlay.consulting@gmail.com";
const TEST_USER_PASSWORD = "testpassword123";

type SeedUserConfig = {
	email: string;
	password: string;
	userId: string;
	accountId: string;
	name: string;
	oceanCode5: string;
	oceanCode4: string;
	label: string;
	/** When true, public profile is listable/viewable for invite CTA manual tests */
	isPublicProfile: boolean;
};

/** Primary dev login — same as historical single-user seed */
const PRIMARY_USER: SeedUserConfig = {
	email: TEST_USER_EMAIL,
	password: TEST_USER_PASSWORD,
	userId: "00000000-0000-4000-a000-000000000001",
	accountId: "00000000-0000-4000-a000-000000000002",
	name: "Test User",
	oceanCode5: "ODANT",
	oceanCode4: "ODAN",
	label: "primary",
	isPublicProfile: false,
};

/** Second assessed user — use primary login + this user's public profile URL for invite CTA */
const PEER_USER: SeedUserConfig = {
	email: "vlay.consulting+peerjordan@gmail.com",
	password: TEST_USER_PASSWORD,
	userId: "00000000-0000-4000-a000-000000000010",
	accountId: "00000000-0000-4000-a000-000000000011",
	name: "Jordan Peer",
	oceanCode5: "OCBAV",
	oceanCode4: "OCBA",
	label: "peer",
	isPublicProfile: true,
};

const SEEDED_ASSESSMENT_TURN_COUNT = 15;

const OPENING_MESSAGE =
	"Hi! I'm Nerin, your personality guide. I'd love to get to know you better. Tell me about a recent decision you made - big or small. What was going through your mind?";

const SEEDED_ASSESSMENT_TURNS = [
	{
		user:
			"Well, I recently decided to reorganize my entire home office. I spent a whole weekend color-coding my books, labeling all my supplies, and creating a detailed filing system. Some people think I'm crazy, but I love having everything in its proper place!",
		assistant:
			"That's fascinating! It sounds like you really value structure and organization. I'm curious - when you're working on a creative project, do you prefer to plan everything out first, or do you like to see where your inspiration takes you?",
	},
	{
		user:
			"Oh, I definitely plan everything! Before I start any project, I create detailed outlines, timelines, and checklists. I can't stand the idea of just 'winging it' - that feels chaotic and stressful to me. Though I have a friend who's the complete opposite and somehow makes it work.",
		assistant:
			"I appreciate how you've found a system that works for you! Let's shift gears a bit. When you're at a social gathering, do you tend to seek out new people to meet, or do you prefer catching up with close friends you already know?",
	},
	{
		user:
			"Hmm, I'd say I prefer sticking with people I know well. Large groups can be exhausting for me. I'd much rather have a deep one-on-one conversation with a close friend than work the room meeting tons of new people. Though I can do it when needed for work.",
		assistant:
			"That makes sense - quality over quantity in relationships! Speaking of relationships, how do you typically respond when a friend is going through a tough time? What's your natural instinct?",
	},
	{
		user:
			"I'm usually the first person to show up with food or offer to help with practical things. If someone's stressed, I'll help them organize their tasks or create a plan to tackle the problem. I guess I'm more solution-focused than just sitting with emotions, though I'm trying to get better at that.",
		assistant:
			"Your friends are lucky to have someone so dependable and action-oriented! I'm curious about your intellectual life. When you read or learn about something new, do you tend to accept established explanations, or do you find yourself questioning and analyzing everything?",
	},
	{
		user:
			"Oh, I'm definitely a questioner! I love diving deep into topics, reading multiple perspectives, and forming my own opinions. I get frustrated when people just accept things at face value without thinking critically. I'm always reading books, listening to podcasts, exploring new ideas.",
		assistant:
			"That intellectual curiosity really comes through! One more thing I'm wondering about - when you imagine the future, whether it's planning a vacation or thinking about your career, do you focus mainly on concrete goals and practical steps, or do you enjoy exploring possibilities and 'what-ifs'?",
	},
	{
		user:
			"Definitely the possibilities and what-ifs! I love brainstorming different scenarios and imagining how things could unfold. My partner jokes that I have three backup plans for every backup plan. I guess I like being prepared for multiple futures, even the unlikely ones.",
		assistant:
			"When stress starts building, what helps you feel steady again? Do you reach for routine, conversation, solitude, movement - what actually works in your body?",
	},
	{
		user:
			"Routine helps most. I clean my desk, make a list, and usually go for a walk before I talk to anyone. If I can get the mess outside me sorted, the mess inside me calms down too.",
		assistant:
			"That pairing of order and self-regulation is really clear. How do you relate to risk when something excites you - do you jump, or do you build a landing plan first and then move?",
	},
	{
		user:
			"I almost never jump blind. I'll take a big swing if I believe in it, but only after I've mapped the failure modes. I like novelty; I just don't trust chaos to carry me through it.",
		assistant:
			"What happens when conflict shows up with someone you care about? Do you go straight into the conversation, take time to think, or quietly keep score until you know what you actually feel?",
	},
	{
		user:
			"I usually step back first. I need enough distance to understand what actually happened before I say anything sharp. Then I come back pretty prepared - maybe too prepared - because I want the conversation to be fair and useful.",
		assistant:
			"That sounds measured rather than avoidant. I'm wondering how that same part of you shows up around family or obligation - when people need you, do you feel strengthened by being dependable, or crowded by it?",
	},
	{
		user:
			"Both, honestly. I take pride in being the reliable one, especially for family, but I can start to disappear into that role if I'm not careful. If I don't protect some solo thinking time, I get resentful and then feel guilty about being resentful.",
		assistant:
			"There's a lot of self-awareness in that. When your body tells you something is off - low sleep, tension, burnout - do you listen early, or do you tend to notice only once the signal gets loud?",
	},
	{
		user:
			"I usually notice it late. I can power through for a while because I tell myself I'm being disciplined, and then suddenly my jaw hurts, I stop sleeping well, and I realize my version of discipline has quietly turned into overcontrol.",
		assistant:
			"That distinction feels important. In the parts of life that are supposed to be fun - weekends, travel, hobbies - do you want looseness, or do you secretly enjoy structuring your leisure too?",
	},
	{
		user:
			"I tell myself I want looseness, but even my spontaneity comes with tabs open. I like wandering a city or trying something new, but I also love having a map, a shortlist, and enough context that the freedom feels intentional instead of random.",
		assistant:
			"That sounds like you want room to explore without losing your footing. What does achievement mean to you these days - winning, mastering, being respected, building something solid, proving something to yourself?",
	},
	{
		user:
			"More than anything, I want to build something I trust. Recognition is nice, but it's secondary. The satisfying part is when I can look at a piece of work and feel that it reflects both rigor and imagination - like it could hold weight and still feel alive.",
		assistant:
			"When you feel misunderstood, what do you most wish people noticed about you that they usually miss on first glance?",
	},
	{
		user:
			"That the carefulness isn't fear. People sometimes read me as rigid because I plan, but most of the time I'm planning so I can be brave without being reckless. The structure is there to support the leap, not replace it.",
		assistant:
			"That's a sharp distinction. Last thing: if someone close to you had to describe what they rely on in you, what would they say without hesitation?",
	},
	{
		user:
			"They'd probably say I'm the person who can make the chaos workable. I can see the pattern, make the plan, and still leave room for something surprising to happen. I think that's the version of me I trust most too.",
		assistant:
			"There's something striking about you: your imagination isn't airy and your structure isn't rigid. They work together. You don't just dream in possibilities or live by systems - you build systems sturdy enough to carry possibility. That's a rarer kind of steadiness than you may realize.",
	},
] as const;

const CONVERSATION_MESSAGES: Array<{ role: "user" | "assistant"; content: string }> = [
	{ role: "assistant", content: OPENING_MESSAGE },
	...SEEDED_ASSESSMENT_TURNS.flatMap((turn) => [
		{ role: "user" as const, content: turn.user },
		{ role: "assistant" as const, content: turn.assistant },
	]),
];

// Generate realistic facet scores (0-20 scale)
// This profile represents: High O, High C, Low E, Medium A, Medium N
const FACET_SCORE_MAP: Record<
	FacetName,
	{ score: number; confidence: number; domain: LifeDomain }
> = {
	// Openness (High: 15-18) - intellectually curious, imaginative
	imagination: { score: 17, confidence: 0.89, domain: "leisure" },
	artistic_interests: { score: 14, confidence: 0.65, domain: "leisure" },
	emotionality: { score: 16, confidence: 0.6, domain: "relationships" },
	adventurousness: { score: 13, confidence: 0.68, domain: "leisure" },
	intellect: { score: 18, confidence: 0.94, domain: "leisure" },
	liberalism: { score: 16, confidence: 0.72, domain: "leisure" },

	// Conscientiousness (High: 15-18) - organized, disciplined
	self_efficacy: { score: 17, confidence: 0.75, domain: "work" },
	orderliness: { score: 19, confidence: 0.95, domain: "leisure" },
	dutifulness: { score: 16, confidence: 0.78, domain: "work" },
	achievement_striving: { score: 17, confidence: 0.7, domain: "work" },
	self_discipline: { score: 18, confidence: 0.92, domain: "work" },
	cautiousness: { score: 15, confidence: 0.74, domain: "health" },

	// Extraversion (Low: 4-8) - introverted, reserved
	friendliness: { score: 8, confidence: 0.66, domain: "relationships" },
	gregariousness: { score: 5, confidence: 0.87, domain: "relationships" },
	assertiveness: { score: 9, confidence: 0.64, domain: "work" },
	activity_level: { score: 10, confidence: 0.62, domain: "health" },
	excitement_seeking: { score: 6, confidence: 0.58, domain: "leisure" },
	cheerfulness: { score: 7, confidence: 0.63, domain: "relationships" },

	// Agreeableness (Medium: 10-14) - helpful but analytical
	trust: { score: 11, confidence: 0.67, domain: "relationships" },
	morality: { score: 14, confidence: 0.71, domain: "leisure" },
	altruism: { score: 13, confidence: 0.86, domain: "relationships" },
	cooperation: { score: 10, confidence: 0.69, domain: "relationships" },
	modesty: { score: 12, confidence: 0.65, domain: "relationships" },
	sympathy: { score: 11, confidence: 0.68, domain: "relationships" },

	// Neuroticism (Medium: 9-13) - moderate emotional stability
	anxiety: { score: 11, confidence: 0.73, domain: "work" },
	anger: { score: 9, confidence: 0.64, domain: "leisure" },
	depression: { score: 10, confidence: 0.61, domain: "leisure" },
	self_consciousness: { score: 12, confidence: 0.66, domain: "relationships" },
	immoderation: { score: 8, confidence: 0.59, domain: "health" },
	vulnerability: { score: 10, confidence: 0.67, domain: "relationships" },
};

// Evidence quotes mapping to facets (used for conversation evidence notes)
const _EVIDENCE_QUOTES: Partial<
	Record<FacetName, Array<{ quote: string; messageIndex: number; rawDomain: string }>>
> = {
	orderliness: [
		{
			quote: "color-coding my books, labeling all my supplies, and creating a detailed filing system",
			messageIndex: 1,
			rawDomain: "home office organization",
		},
		{
			quote: "I love having everything in its proper place",
			messageIndex: 1,
			rawDomain: "personal space management",
		},
	],
	self_discipline: [
		{
			quote: "I create detailed outlines, timelines, and checklists",
			messageIndex: 3,
			rawDomain: "project planning habits",
		},
		{
			quote: "I can't stand the idea of just 'winging it'",
			messageIndex: 3,
			rawDomain: "work approach",
		},
	],
	intellect: [
		{
			quote:
				"I love diving deep into topics, reading multiple perspectives, and forming my own opinions",
			messageIndex: 9,
			rawDomain: "intellectual exploration",
		},
		{
			quote: "always reading books, listening to podcasts, exploring new ideas",
			messageIndex: 9,
			rawDomain: "learning habits",
		},
	],
	imagination: [
		{
			quote: "I love brainstorming different scenarios and imagining how things could unfold",
			messageIndex: 11,
			rawDomain: "future planning and creativity",
		},
		{
			quote: "I have three backup plans for every backup plan",
			messageIndex: 11,
			rawDomain: "contingency thinking",
		},
	],
	gregariousness: [
		{
			quote: "Large groups can be exhausting for me",
			messageIndex: 5,
			rawDomain: "social gatherings",
		},
		{
			quote: "I'd much rather have a deep one-on-one conversation",
			messageIndex: 5,
			rawDomain: "social preferences",
		},
	],
	altruism: [
		{
			quote: "I'm usually the first person to show up with food or offer to help",
			messageIndex: 7,
			rawDomain: "helping friends in need",
		},
	],
};

/**
 * Director model exchange templates reused across the seeded 15-turn conversation.
 * Turn 0 is the greeting exchange with no director output.
 *
 * Each brief follows the three-beat structure:
 *   Observation (when warranted) → Connection (when needed) → Question (always)
 */
const DIRECTOR_EXCHANGE_TEMPLATES: Array<{
	directorOutput: string;
	coverageTargets: { targetFacets: string[]; targetDomain: string };
}> = [
	{
		// Turn 1: After user talks about home office organization
		directorOutput: `OBSERVATION: They didn't just reorganize — they color-coded, labeled, and filed. This is someone who finds genuine pleasure in imposing structure on chaos. Note the phrase "I love having everything in its proper place" — that's not obligation, that's desire.

CONNECTION: Their organizational drive is a window into how they approach uncertainty. Bridge from the concrete (physical space) to the abstract (how they think about projects, creative work).

QUESTION: Ask about creative projects — do they plan everything or follow inspiration? This probes the tension between their obvious orderliness and their openness to novelty.`,
		coverageTargets: {
			targetFacets: ["orderliness", "self_discipline", "cautiousness"],
			targetDomain: "work",
		},
	},
	{
		// Turn 2: After user talks about planning vs. winging it
		directorOutput: `OBSERVATION: "I can't stand the idea of just 'winging it' — that feels chaotic and stressful." The language is visceral — chaos isn't just inefficient, it's threatening. But then they add "though I have a friend who's the complete opposite and somehow makes it work." That qualifier shows intellectual openness even while behaviorally rigid.

CONNECTION: They've revealed how they manage internal anxiety through external structure. Now shift the lens from individual work habits to social dynamics — how does this structured person navigate the unpredictability of other humans?

QUESTION: Move to social gatherings. Do they seek novelty (new people) or depth (known friends)? This tests extraversion while keeping the conversation natural.`,
		coverageTargets: {
			targetFacets: ["gregariousness", "friendliness", "excitement_seeking"],
			targetDomain: "relationships",
		},
	},
	{
		// Turn 3: After user talks about social preferences
		directorOutput: `CONNECTION: They prefer depth over breadth in relationships — "deep one-on-one" over "working the room." But they can do it when needed for work, suggesting adaptability despite preference. Move from how they handle social situations to how they handle others' emotional situations.

QUESTION: Ask about responding to a friend in crisis. This probes altruism, sympathy, and emotional approach — are they a fixer or a listener?`,
		coverageTargets: {
			targetFacets: ["altruism", "sympathy", "cooperation"],
			targetDomain: "relationships",
		},
	},
	{
		// Turn 4: After user talks about helping friends
		directorOutput: `OBSERVATION: "I'm usually the first person to show up with food or offer to help with practical things" — action-oriented care, not emotional mirroring. Then the self-awareness: "I'm trying to get better at that." They know their blind spot. This is someone who shows love through competence.

CONNECTION: Their helping style reveals a practical, solution-focused mind. Bridge to their intellectual life — how do they engage with ideas and information?

QUESTION: Probe their relationship with established knowledge. Do they accept or question? This targets intellect and liberalism while exploring a different domain.`,
		coverageTargets: {
			targetFacets: ["intellect", "liberalism", "imagination"],
			targetDomain: "leisure",
		},
	},
	{
		// Turn 5: After user talks about questioning and intellectual curiosity
		directorOutput: `OBSERVATION: "I get frustrated when people just accept things at face value" — intellectual impatience suggests high openness to ideas. The frustration itself is telling — they don't just prefer critical thinking, they can't understand its absence.

CONNECTION: They've shown us a rich inner intellectual life. For the final beat, move from how they engage with ideas to how they engage with the future — imagination, planning, possibility-thinking.

QUESTION: Ask about imagining the future — concrete goals vs. what-if exploration. This final question probes imagination and adventurousness, rounding out the openness picture.`,
		coverageTargets: {
			targetFacets: ["imagination", "adventurousness", "achievement_striving"],
			targetDomain: "leisure",
		},
	},
	{
		// Closing turn template
		directorOutput: `OBSERVATION: "I have three backup plans for every backup plan" — said with humor but it's a profound reveal. This is someone who manages anxiety through preparation, who finds peace in having mapped every contingency. The partner joke suggests they know it's excessive but can't help it. That self-awareness paired with inability to change the behavior is the tension that makes them interesting.

This is the final exchange. Make your boldest observation — name the core tension you've been watching build: their deep need for order and structure coexists with a genuinely expansive imagination. They don't just plan — they dream in organized folders. That's not a contradiction; it's their superpower.

QUESTION: End with something that leaves them wanting more. Name what you see in them that they might not see in themselves.`,
		coverageTargets: {
			targetFacets: ["vulnerability", "anxiety", "self_consciousness"],
			targetDomain: "health",
		},
	},
];

function getDirectorExchangeData(turn: number) {
	const closingTemplate = DIRECTOR_EXCHANGE_TEMPLATES[DIRECTOR_EXCHANGE_TEMPLATES.length - 1];
	if (!closingTemplate) {
		throw new Error("Missing closing director exchange template");
	}

	if (turn === SEEDED_ASSESSMENT_TURN_COUNT) {
		return closingTemplate;
	}

	const exploratoryTemplates = DIRECTOR_EXCHANGE_TEMPLATES.slice(0, -1);
	const template = exploratoryTemplates[(turn - 1) % exploratoryTemplates.length];
	if (!template) {
		throw new Error(`Missing director exchange template for turn ${turn}`);
	}

	return template;
}

// Build JSONB facets data
const buildFacetsJson = () => {
	const facets: Record<string, { score: number; confidence: number; domain: string }> = {};
	for (const [name, data] of Object.entries(FACET_SCORE_MAP)) {
		facets[name] = { score: data.score, confidence: data.confidence, domain: data.domain };
	}
	return facets;
};

// Build JSONB traits data (aggregated from facets)
const buildTraitsJson = () => {
	const traitFacets: Record<string, FacetName[]> = {
		openness: [
			"imagination",
			"artistic_interests",
			"emotionality",
			"adventurousness",
			"intellect",
			"liberalism",
		],
		conscientiousness: [
			"self_efficacy",
			"orderliness",
			"dutifulness",
			"achievement_striving",
			"self_discipline",
			"cautiousness",
		],
		extraversion: [
			"friendliness",
			"gregariousness",
			"assertiveness",
			"activity_level",
			"excitement_seeking",
			"cheerfulness",
		],
		agreeableness: ["trust", "morality", "altruism", "cooperation", "modesty", "sympathy"],
		neuroticism: [
			"anxiety",
			"anger",
			"depression",
			"self_consciousness",
			"immoderation",
			"vulnerability",
		],
	};

	const traits: Record<string, { score: number; confidence: number }> = {};
	for (const [trait, facetNames] of Object.entries(traitFacets)) {
		const scores = facetNames.map((f) => FACET_SCORE_MAP[f].score);
		const confidences = facetNames.map((f) => FACET_SCORE_MAP[f].confidence);
		traits[trait] = {
			score: scores.reduce((a, b) => a + b, 0),
			confidence: Number((confidences.reduce((a, b) => a + b, 0) / confidences.length).toFixed(3)),
		};
	}
	return traits;
};

// Build domain coverage
const buildDomainCoverage = () => {
	const domains = new Set<string>();
	for (const data of Object.values(FACET_SCORE_MAP)) {
		domains.add(data.domain);
	}
	const coverage: Record<string, number> = {};
	for (const domain of domains) {
		const count = Object.values(FACET_SCORE_MAP).filter((d) => d.domain === domain).length;
		coverage[domain] = Number((count / 30).toFixed(3));
	}
	return coverage;
};

const seedOneUser = (cfg: SeedUserConfig) =>
	Effect.gen(function* () {
		const db = yield* Database;

		console.log(`\n--- ${cfg.label}: ${cfg.email} ---\n`);

		// 1. Create or get test user
		console.log("Creating test user...");
		const existingUsers = yield* db
			.select()
			.from(user)
			.where(eq(user.email, cfg.email))
			.limit(1)
			.pipe(Effect.mapError((error) => new Error(`Failed to query user: ${error}`)));

		let userId: string;
		if (existingUsers.length > 0) {
			const existingUser = existingUsers[0];
			console.log(`  Test user already exists: ${existingUser.email}`);
			userId = existingUser.id;
		} else {
			const [newUser] = yield* db
				.insert(user)
				.values({
					id: cfg.userId,
					name: cfg.name,
					email: cfg.email,
					emailVerified: true,
				})
				.returning()
				.pipe(Effect.mapError((error) => new Error(`Failed to create user: ${error}`)));
			userId = newUser.id;
			console.log(`  Created test user: ${cfg.email}`);
		}

		// 1b. Create credential account (Better Auth password login)
		const existingAccounts = yield* db
			.select()
			.from(account)
			.where(eq(account.userId, userId))
			.limit(1)
			.pipe(Effect.mapError((error) => new Error(`Failed to query account: ${error}`)));

		if (existingAccounts.length > 0) {
			console.log("  Credential account already exists");
		} else {
			const hashedPassword = yield* Effect.promise(() => bcrypt.hash(cfg.password, 12));
			yield* db
				.insert(account)
				.values({
					id: cfg.accountId,
					accountId: cfg.userId,
					providerId: "credential",
					userId,
					password: hashedPassword,
				})
				.pipe(Effect.mapError((error) => new Error(`Failed to create account: ${error}`)));
			console.log("  Created credential account with password");
		}

		// 1c. Ensure Polar customer exists for test user (needed for checkout plugin)
		const config = yield* AppConfig;
		const polarToken = Redacted.value(config.polarAccessToken);
		if (polarToken && polarToken !== "not-configured") {
			yield* Effect.promise(async () => {
				const polarClient = new Polar({
					accessToken: polarToken,
					server: config.betterAuthUrl.includes("localhost") ? "sandbox" : "production",
				});
				try {
					const { result: existing } = await polarClient.customers.list({ email: cfg.email });
					if (existing.items.length > 0) {
						const customer = existing.items[0];
						if (customer.externalId !== userId) {
							await polarClient.customers.update({
								id: customer.id,
								customerUpdate: { externalId: userId },
							});
							console.log(`  Updated Polar customer externalId: ${customer.id}`);
						} else {
							console.log(`  Polar customer already exists: ${customer.id}`);
						}
					} else {
						const customer = await polarClient.customers.create({
							email: cfg.email,
							name: cfg.name,
							externalId: userId,
						});
						console.log(`  Created Polar customer: ${customer.id}`);
					}
				} catch (err) {
					console.warn(`  Warning: Failed to create Polar customer (checkout may not work): ${err}`);
				}
			});
		} else {
			console.log("  Skipping Polar customer creation (POLAR_ACCESS_TOKEN not configured)");
		}

		// Clean up existing assessment data for test user (allows re-running seed)
		const existingSessions = yield* db
			.select()
			.from(conversation)
			.where(eq(conversation.userId, userId))
			.limit(1)
			.pipe(Effect.mapError((error) => new Error(`Failed to query sessions: ${error}`)));

		if (existingSessions.length > 0) {
			const existingSessionId = existingSessions[0].id;
			yield* db
				.delete(conversation)
				.where(eq(conversation.id, existingSessionId))
				.pipe(Effect.mapError((error) => new Error(`Failed to clean up existing session: ${error}`)));
			console.log(`  Cleaned up existing session: ${existingSessionId}`);
		}

		// 2. Create completed conversation session
		console.log("\nCreating completed conversation session...");
		const [sessionRecord] = yield* db
			.insert(conversation)
			.values({
				userId,
				status: "completed",
				finalizationProgress: "completed",
				messageCount: SEEDED_ASSESSMENT_TURN_COUNT,
			})
			.returning()
			.pipe(Effect.mapError((error) => new Error(`Failed to create conversation session: ${error}`)));

		console.log(`  Created session: ${sessionRecord.id}`);

		// 3. Create exchange rows (Director model pipeline state per turn)
		// Turn 0 = greeting (no director output), Turns 1-15 = user-response turns
		console.log("\nCreating exchange rows...");
		const exchangeRecords: Array<{ id: string; turnNumber: number }> = [];

		// Turn 0: greeting exchange (no extraction, no director output)
		const [openerExchange] = yield* db
			.insert(exchange)
			.values({
				conversationId: sessionRecord.id,
				turnNumber: 0,
				extractionTier: null,
				directorOutput: null,
				coverageTargets: null,
			})
			.returning()
			.pipe(Effect.mapError((error) => new Error(`Failed to create opener exchange: ${error}`)));
		exchangeRecords.push({ id: openerExchange.id, turnNumber: 0 });
		console.log("  Turn 0: greeting exchange (no director output)");

		// Turns 1-15: user-response exchanges with director briefs and coverage targets
		for (let turn = 1; turn <= SEEDED_ASSESSMENT_TURN_COUNT; turn++) {
			const exchangeData = getDirectorExchangeData(turn);
			const [exchangeRecord] = yield* db
				.insert(exchange)
				.values({
					conversationId: sessionRecord.id,
					turnNumber: turn,
					extractionTier: 1, // Successful strict extraction
					directorOutput: exchangeData.directorOutput,
					coverageTargets: exchangeData.coverageTargets,
				})
				.returning()
				.pipe(
					Effect.mapError((error) => new Error(`Failed to create exchange turn ${turn}: ${error}`)),
				);
			exchangeRecords.push({ id: exchangeRecord.id, turnNumber: turn });
			console.log(`  Turn ${turn}: exchange with director brief and coverage targets`);
		}
		console.log(`  Created ${exchangeRecords.length} exchange rows`);

		// 4. Insert conversation messages (linked to exchanges)
		// Turn 0: greeting assistant message (index 0)
		// Turn N (1-15): user message (index 2N-1) + assistant response (index 2N)
		console.log("\nInserting conversation messages...");
		const messageRecords = [];
		for (const [index, msg] of CONVERSATION_MESSAGES.entries()) {
			// Determine which exchange this message belongs to
			// Index 0 (assistant greeting) → turn 0
			// Index 1 (user) → turn 1, Index 2 (assistant) → turn 1
			// Index 3 (user) → turn 2, Index 4 (assistant) → turn 2, etc.
			const turn = index === 0 ? 0 : Math.ceil(index / 2);
			const exchange = exchangeRecords.find((e) => e.turnNumber === turn);

			const [msgRecord] = yield* db
				.insert(message)
				.values({
					conversationId: sessionRecord.id,
					exchangeId: exchange?.id ?? null,
					role: msg.role,
					content: msg.content,
				})
				.returning()
				.pipe(Effect.mapError((error) => new Error(`Failed to insert message: ${error}`)));
			messageRecords.push(msgRecord);
			console.log(`  ${index + 1}. [turn ${turn}] ${msg.role}: ${msg.content.substring(0, 50)}...`);
		}

		// 5. Insert assessment results
		console.log("\nInserting assessment results...");
		const facetsJson = buildFacetsJson();
		const traitsJson = buildTraitsJson();
		const domainCoverageJson = buildDomainCoverage();

		const [resultRecord] = yield* db
			.insert(assessmentResults)
			.values({
				conversationId: sessionRecord.id,
				facets: facetsJson,
				traits: traitsJson,
				domainCoverage: domainCoverageJson,
				portrait: "",
				stage: "completed",
			})
			.returning()
			.pipe(Effect.mapError((error) => new Error(`Failed to insert assessment results: ${error}`)));
		console.log(`  Created assessment results: ${resultRecord.id}`);

		// 6. Insert conversation evidence (linked to messages and exchanges)
		console.log("\nInserting conversation evidence...");
		// User messages are at odd indices → turns 1-15.
		// Distribute the 30 seeded facet signals evenly across the completed run.
		const userMsgIndices = CONVERSATION_MESSAGES.map((m, i) => ({ role: m.role, index: i }))
			.filter((m) => m.role === "user")
			.map((m) => m.index);

		let convEvidenceCount = 0;
		for (const [facet, data] of Object.entries(FACET_SCORE_MAP)) {
			// Distribute evidence across the seeded user turns (2 evidence per turn)
			const turnIndex = convEvidenceCount % userMsgIndices.length;
			const msgIndex = userMsgIndices[turnIndex];
			const message = messageRecords[msgIndex];
			const turn = Math.ceil(msgIndex / 2); // Convert message index to turn number
			const exchange = exchangeRecords.find((e) => e.turnNumber === turn);

			// Convert seed scores to v2 evidence format (Story 18-1)
			const strength =
				data.confidence >= 0.7 ? "strong" : data.confidence >= 0.4 ? "moderate" : "weak";
			const confidence = data.confidence >= 0.7 ? "high" : data.confidence >= 0.4 ? "medium" : "low";
			const polarity = data.score >= 10 ? "high" : "low";
			yield* db
				.insert(conversationEvidence)
				.values({
					conversationId: sessionRecord.id,
					messageId: message.id,
					exchangeId: exchange?.id ?? null,
					bigfiveFacet: facet as FacetName,
					strength,
					confidence,
					domain: data.domain,
					polarity,
					note: `Seed evidence for ${facet}`,
				})
				.pipe(
					Effect.mapError((error) => new Error(`Failed to insert conversation evidence: ${error}`)),
				);
			convEvidenceCount++;
		}
		console.log(`  Inserted ${convEvidenceCount} conversation evidence records`);

		// 7. Create public profile with OCEAN codes
		console.log("\nCreating public profile...");
		const [profile] = yield* db
			.insert(publicProfile)
			.values({
				conversationId: sessionRecord.id,
				assessmentResultId: resultRecord.id,
				userId,
				oceanCode5: cfg.oceanCode5,
				oceanCode4: cfg.oceanCode4,
				isPublic: cfg.isPublicProfile,
			})
			.returning()
			.pipe(Effect.mapError((error) => new Error(`Failed to create public profile: ${error}`)));
		console.log(`  Created public profile: ${profile.id} (OCEAN: ${cfg.oceanCode5})`);

		// 8. Print summary
		const exchangeCount = exchangeRecords.length;
		console.log("\nSeed completed successfully!\n");
		console.log("=".repeat(60));
		console.log("SESSION DETAILS");
		console.log("=".repeat(60));
		console.log(`Session ID: ${sessionRecord.id}`);
		console.log(`User: ${cfg.email}`);
		console.log(`Status: ${sessionRecord.status}`);
		console.log(`User Turns: ${SEEDED_ASSESSMENT_TURN_COUNT}`);
		console.log(`Messages: ${CONVERSATION_MESSAGES.length}`);
		console.log(
			`Exchanges: ${exchangeCount} (1 greeting + ${exchangeCount - 1} with director briefs)`,
		);
		console.log(`Conversation Evidence: ${convEvidenceCount}`);
		console.log(`OCEAN Code: ${cfg.oceanCode5}`);
		console.log(`Public Profile ID: ${profile.id}`);
		console.log("=".repeat(60));
		console.log("\nLogin Credentials:");
		console.log(`   Email:    ${cfg.email}`);
		console.log(`   Password: ${cfg.password}`);
		console.log("\nQuick Test URLs:");
		console.log(`   Profile Page: http://localhost:3000/profile`);
		console.log(`   Results Page: http://localhost:3000/results/${sessionRecord.id}`);
		console.log(`   Chat Page:    http://localhost:3000/chat?sessionId=${sessionRecord.id}`);
		console.log(`\nPublic profile: http://localhost:3000/public-profile/${profile.id}\n`);

		return { sessionId: sessionRecord.id, publicProfileId: profile.id };
	});

const seedProgram = Effect.gen(function* () {
	console.log("Starting seed script for completed conversation...\n");
	const primary = yield* seedOneUser(PRIMARY_USER);
	const peer = yield* seedOneUser(PEER_USER);
	console.log("\n");
	console.log("=".repeat(60));
	console.log("INVITE CTA (Epic 6.2) — peer public profile");
	console.log("=".repeat(60));
	console.log(`Log in as primary user:`);
	console.log(`  ${PRIMARY_USER.email}`);
	console.log(`  ${PRIMARY_USER.password}`);
	console.log("Open peer profile (assessed viewer, not own profile):");
	console.log(`  http://localhost:3000/public-profile/${peer.publicProfileId}`);
	console.log(`Peer user (optional separate login): ${PEER_USER.email}`);
	console.log("=".repeat(60));
	console.log(`\nPrimary session id: ${primary.sessionId}`);
	console.log(`Peer session id:    ${peer.sessionId}\n`);
});

// Run the Effect program
const mainProgram = seedProgram.pipe(Effect.provide(DatabaseStack), Effect.provide(AppConfigLive));

Effect.runPromise(mainProgram)
	.then(() => {
		process.exit(0);
	})
	.catch((error) => {
		console.error("Seed failed:", error);
		process.exit(1);
	});
