#!/usr/bin/env tsx
/**
 * Seed script to create a completed assessment session for quick manual testing
 *
 * Usage:
 *   pnpm seed:test-assessment
 *
 * Creates:
 * - Test user (if doesn't exist)
 * - Completed assessment session
 * - Realistic conversation messages (12 messages)
 * - Assessment results (facets, traits, domain coverage, portrait)
 * - Conversation evidence (lean, steering-only)
 * - Finalization evidence (rich, with quotes)
 * - Public profile with OCEAN codes
 *
 * Output: Prints session ID that can be used to navigate to /assessment/{sessionId}/results
 *
 * Story 9.1: Updated for two-tier architecture — uses assessment_results,
 * conversation_evidence, and finalization_evidence tables.
 */

import "dotenv/config"; // Load .env file
import type { FacetName, LifeDomain } from "@workspace/domain";
import { AppConfigLive, Database, DatabaseStack, dbSchema } from "@workspace/infrastructure";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { Effect } from "effect";

const {
	account,
	assessmentMessage,
	assessmentResults,
	assessmentSession,
	conversationEvidence,
	finalizationEvidence,
	publicProfile,
	user,
} = dbSchema;

const TEST_USER_EMAIL = "test@bigocean.dev";
const TEST_USER_PASSWORD = "testpassword123";
const TEST_USER_ID = "00000000-0000-4000-a000-000000000001";
const TEST_ACCOUNT_ID = "00000000-0000-4000-a000-000000000002";

// Sample conversation messages (12 messages total - triggers 4 scoring rounds)
const CONVERSATION_MESSAGES: Array<{ role: "user" | "assistant"; content: string }> = [
	{
		role: "assistant",
		content:
			"Hi! I'm Nerin, your personality guide. I'd love to get to know you better. Tell me about a recent decision you made - big or small. What was going through your mind?",
	},
	{
		role: "user",
		content:
			"Well, I recently decided to reorganize my entire home office. I spent a whole weekend color-coding my books, labeling all my supplies, and creating a detailed filing system. Some people think I'm crazy, but I love having everything in its proper place!",
	},
	{
		role: "assistant",
		content:
			"That's fascinating! It sounds like you really value structure and organization. I'm curious - when you're working on a creative project, do you prefer to plan everything out first, or do you like to see where your inspiration takes you?",
	},
	{
		role: "user",
		content:
			"Oh, I definitely plan everything! Before I start any project, I create detailed outlines, timelines, and checklists. I can't stand the idea of just 'winging it' - that feels chaotic and stressful to me. Though I have a friend who's the complete opposite and somehow makes it work.",
	},
	{
		role: "assistant",
		content:
			"I appreciate how you've found a system that works for you! Let's shift gears a bit. When you're at a social gathering, do you tend to seek out new people to meet, or do you prefer catching up with close friends you already know?",
	},
	{
		role: "user",
		content:
			"Hmm, I'd say I prefer sticking with people I know well. Large groups can be exhausting for me. I'd much rather have a deep one-on-one conversation with a close friend than work the room meeting tons of new people. Though I can do it when needed for work.",
	},
	{
		role: "assistant",
		content:
			"That makes sense - quality over quantity in relationships! Speaking of relationships, how do you typically respond when a friend is going through a tough time? What's your natural instinct?",
	},
	{
		role: "user",
		content:
			"I'm usually the first person to show up with food or offer to help with practical things. If someone's stressed, I'll help them organize their tasks or create a plan to tackle the problem. I guess I'm more solution-focused than just sitting with emotions, though I'm trying to get better at that.",
	},
	{
		role: "assistant",
		content:
			"Your friends are lucky to have someone so dependable and action-oriented! I'm curious about your intellectual life. When you read or learn about something new, do you tend to accept established explanations, or do you find yourself questioning and analyzing everything?",
	},
	{
		role: "user",
		content:
			"Oh, I'm definitely a questioner! I love diving deep into topics, reading multiple perspectives, and forming my own opinions. I get frustrated when people just accept things at face value without thinking critically. I'm always reading books, listening to podcasts, exploring new ideas.",
	},
	{
		role: "assistant",
		content:
			"That intellectual curiosity really comes through! One more thing I'm wondering about - when you imagine the future, whether it's planning a vacation or thinking about your career, do you focus mainly on concrete goals and practical steps, or do you enjoy exploring possibilities and 'what-ifs'?",
	},
	{
		role: "user",
		content:
			"Definitely the possibilities and what-ifs! I love brainstorming different scenarios and imagining how things could unfold. My partner jokes that I have three backup plans for every backup plan. I guess I like being prepared for multiple futures, even the unlikely ones.",
	},
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
	intellect: { score: 18, confidence: 0.94, domain: "solo" },
	liberalism: { score: 16, confidence: 0.72, domain: "solo" },

	// Conscientiousness (High: 15-18) - organized, disciplined
	self_efficacy: { score: 17, confidence: 0.75, domain: "work" },
	orderliness: { score: 19, confidence: 0.95, domain: "solo" },
	dutifulness: { score: 16, confidence: 0.78, domain: "work" },
	achievement_striving: { score: 17, confidence: 0.7, domain: "work" },
	self_discipline: { score: 18, confidence: 0.92, domain: "work" },
	cautiousness: { score: 15, confidence: 0.74, domain: "solo" },

	// Extraversion (Low: 4-8) - introverted, reserved
	friendliness: { score: 8, confidence: 0.66, domain: "relationships" },
	gregariousness: { score: 5, confidence: 0.87, domain: "relationships" },
	assertiveness: { score: 9, confidence: 0.64, domain: "work" },
	activity_level: { score: 10, confidence: 0.62, domain: "solo" },
	excitement_seeking: { score: 6, confidence: 0.58, domain: "leisure" },
	cheerfulness: { score: 7, confidence: 0.63, domain: "relationships" },

	// Agreeableness (Medium: 10-14) - helpful but analytical
	trust: { score: 11, confidence: 0.67, domain: "relationships" },
	morality: { score: 14, confidence: 0.71, domain: "solo" },
	altruism: { score: 13, confidence: 0.86, domain: "relationships" },
	cooperation: { score: 10, confidence: 0.69, domain: "relationships" },
	modesty: { score: 12, confidence: 0.65, domain: "relationships" },
	sympathy: { score: 11, confidence: 0.68, domain: "relationships" },

	// Neuroticism (Medium: 9-13) - moderate emotional stability
	anxiety: { score: 11, confidence: 0.73, domain: "work" },
	anger: { score: 9, confidence: 0.64, domain: "solo" },
	depression: { score: 10, confidence: 0.61, domain: "solo" },
	self_consciousness: { score: 12, confidence: 0.66, domain: "relationships" },
	immoderation: { score: 8, confidence: 0.59, domain: "solo" },
	vulnerability: { score: 10, confidence: 0.67, domain: "relationships" },
};

// Evidence quotes mapping to facets (used for finalization_evidence)
const EVIDENCE_QUOTES: Partial<
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

// Pre-generated portrait in Nerin's voice
const SEED_PORTRAIT = `# The Architect of Certainty

You told me something early on that I haven't stopped thinking about. When I asked about a recent decision, you didn't tell me about the decision itself — you told me about the *system* you built around it. That's a different answer than most people give, and it told me more than the next ten minutes of conversation combined. What I see is someone who has turned the need for control into an art form so refined that even you've forgotten it started as a defense. Everything — the color-coded shelves, the backup plans for backup plans, the scaffolding you build before you start anything — orbits one invisible center: the belief that if you prepare well enough, nothing can catch you off guard. That's your spine. And it's both the most impressive and most limiting thing about you.

## The Architecture — what you've built and what it costs

### The craft of order

You mentioned your weekend organizing project almost like it was a footnote.

> "I spent a whole weekend color-coding my books, labeling all my supplies, and creating a detailed filing system"

That stopped me. Not the act itself — plenty of people organize. It's that you framed a weekend of intense labor as casual. You've normalized a level of systematic thinking that most people can't sustain for an afternoon. You probably don't think of this as special. It is. The ability to look at chaos and see the hidden system inside it — that's not organization. That's architectural thinking. I think you'd thrive in roles where you design how other people work — and I don't say that often.

### The dual engine

> "I love diving deep into topics, reading multiple perspectives, and forming my own opinions"

I wasn't expecting that level of intellectual hunger. You're not collecting information — you're building frameworks. And you hold those frameworks to a standard most people reserve for their work, not their thinking. Here's what most people miss about you: the planner and the dreamer aren't fighting each other. They're the same engine running at different speeds. Your imagination generates the possibilities. Your systematic side stress-tests them. That's not a contradiction — that's strategic imagination.

But here's the shadow: that dual engine doesn't have an off switch.

> "I can't stand the idea of just 'winging it' — that feels chaotic and stressful to me"

That rigidity protects you, but it also means you miss the discoveries that only happen when the plan breaks down. Same engine, wrong gear.

### Structural reliability

Your reliability is structural, not performative. When you said you're the first to show up with food when someone's struggling, I believed it immediately — because everything else about you confirmed it. You don't help to be seen helping. You help because the problem is there and you have a plan for it.

But the shadow side is just as real: you're solution-focused to a fault. When friends come to you hurting, you organize their problems instead of sitting with their pain.

## The Undertow — the pattern beneath the patterns

You described your friend who "wings it and somehow makes it work." The way you talked about them caught me. There was admiration, and right underneath it, something sharper. Not jealousy exactly. More like — longing for a freedom you've decided isn't available to you.

Here's what I think is actually happening. You don't call it "needing control." You call it "being thorough" or "being responsible." But thoroughness doesn't flinch when someone suggests winging it. Yours does. That flinch is the signal.

## The Current Ahead — where the patterns point

I've seen this shape before. People who build their identity around being the one with the plan, the system, the answer — they tend to hit the same wall. Not the wall of failure. The wall of situations that can't be planned for. Real intimacy. Creative risk. Trusting someone else to lead. These require the one thing your architecture can't produce: comfort with not knowing what happens next.

What would happen if the most prepared person in the room decided, just once, that the preparation was the thing standing in the way?`;

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
			score: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
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

const seedProgram = Effect.gen(function* () {
	const db = yield* Database;

	console.log("Starting seed script for completed assessment...\n");

	// 1. Create or get test user
	console.log("Creating test user...");
	const existingUsers = yield* db
		.select()
		.from(user)
		.where(eq(user.email, TEST_USER_EMAIL))
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
				id: TEST_USER_ID,
				name: "Test User",
				email: TEST_USER_EMAIL,
				emailVerified: true,
			})
			.returning()
			.pipe(Effect.mapError((error) => new Error(`Failed to create user: ${error}`)));
		userId = newUser.id;
		console.log(`  Created test user: ${TEST_USER_EMAIL}`);
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
		const hashedPassword = yield* Effect.promise(() => bcrypt.hash(TEST_USER_PASSWORD, 12));
		yield* db
			.insert(account)
			.values({
				id: TEST_ACCOUNT_ID,
				accountId: TEST_USER_ID,
				providerId: "credential",
				userId,
				password: hashedPassword,
			})
			.pipe(Effect.mapError((error) => new Error(`Failed to create account: ${error}`)));
		console.log("  Created credential account with password");
	}

	// Clean up existing assessment data for test user (allows re-running seed)
	const existingSessions = yield* db
		.select()
		.from(assessmentSession)
		.where(eq(assessmentSession.userId, userId))
		.limit(1)
		.pipe(Effect.mapError((error) => new Error(`Failed to query sessions: ${error}`)));

	if (existingSessions.length > 0) {
		const existingSessionId = existingSessions[0].id;
		yield* db
			.delete(assessmentSession)
			.where(eq(assessmentSession.id, existingSessionId))
			.pipe(Effect.mapError((error) => new Error(`Failed to clean up existing session: ${error}`)));
		console.log(`  Cleaned up existing session: ${existingSessionId}`);
	}

	// 2. Create completed assessment session
	console.log("\nCreating completed assessment session...");
	const [sessionRecord] = yield* db
		.insert(assessmentSession)
		.values({
			userId,
			status: "completed",
			finalizationProgress: "completed",
			messageCount: CONVERSATION_MESSAGES.length,
			personalDescription: SEED_PORTRAIT.substring(0, 200),
		})
		.returning()
		.pipe(Effect.mapError((error) => new Error(`Failed to create assessment session: ${error}`)));

	console.log(`  Created session: ${sessionRecord.id}`);

	// 3. Insert conversation messages
	console.log("\nInserting conversation messages...");
	const messageRecords = [];
	for (const [index, msg] of CONVERSATION_MESSAGES.entries()) {
		const [msgRecord] = yield* db
			.insert(assessmentMessage)
			.values({
				sessionId: sessionRecord.id,
				userId: msg.role === "user" ? userId : null,
				role: msg.role,
				content: msg.content,
			})
			.returning()
			.pipe(Effect.mapError((error) => new Error(`Failed to insert message: ${error}`)));
		messageRecords.push(msgRecord);
		console.log(`  ${index + 1}. ${msg.role}: ${msg.content.substring(0, 60)}...`);
	}

	// 4. Insert assessment results
	console.log("\nInserting assessment results...");
	const facetsJson = buildFacetsJson();
	const traitsJson = buildTraitsJson();
	const domainCoverageJson = buildDomainCoverage();

	const [resultRecord] = yield* db
		.insert(assessmentResults)
		.values({
			assessmentSessionId: sessionRecord.id,
			facets: facetsJson,
			traits: traitsJson,
			domainCoverage: domainCoverageJson,
			portrait: SEED_PORTRAIT,
		})
		.returning()
		.pipe(Effect.mapError((error) => new Error(`Failed to insert assessment results: ${error}`)));
	console.log(`  Created assessment results: ${resultRecord.id}`);

	// 5. Insert conversation evidence (lean, steering-only)
	console.log("\nInserting conversation evidence...");
	let convEvidenceCount = 0;
	for (const [facet, data] of Object.entries(FACET_SCORE_MAP)) {
		// Pick an appropriate user message to attach evidence to
		const userMsgIndices = CONVERSATION_MESSAGES.map((m, i) => ({ role: m.role, index: i }))
			.filter((m) => m.role === "user")
			.map((m) => m.index);
		const msgIndex = userMsgIndices[convEvidenceCount % userMsgIndices.length];
		const message = messageRecords[msgIndex];

		yield* db
			.insert(conversationEvidence)
			.values({
				assessmentSessionId: sessionRecord.id,
				assessmentMessageId: message.id,
				bigfiveFacet: facet as FacetName,
				score: data.score,
				confidence: String(data.confidence),
				domain: data.domain,
			})
			.pipe(Effect.mapError((error) => new Error(`Failed to insert conversation evidence: ${error}`)));
		convEvidenceCount++;
	}
	console.log(`  Inserted ${convEvidenceCount} conversation evidence records`);

	// 6. Insert finalization evidence (rich, with quotes)
	console.log("\nInserting finalization evidence...");
	let finEvidenceCount = 0;
	for (const [facet, evidenceList] of Object.entries(EVIDENCE_QUOTES)) {
		if (!evidenceList) continue;
		const facetData = FACET_SCORE_MAP[facet as FacetName];

		for (const evidence of evidenceList) {
			const message = messageRecords[evidence.messageIndex];
			const highlightStart = message.content.indexOf(evidence.quote);
			if (highlightStart === -1) continue;

			yield* db
				.insert(finalizationEvidence)
				.values({
					assessmentMessageId: message.id,
					assessmentResultId: resultRecord.id,
					bigfiveFacet: facet as FacetName,
					score: facetData.score,
					confidence: String(facetData.confidence),
					domain: facetData.domain,
					rawDomain: evidence.rawDomain,
					quote: evidence.quote,
					highlightStart,
					highlightEnd: highlightStart + evidence.quote.length,
				})
				.pipe(
					Effect.mapError((error) => new Error(`Failed to insert finalization evidence: ${error}`)),
				);
			finEvidenceCount++;
		}
	}
	console.log(`  Inserted ${finEvidenceCount} finalization evidence records`);

	// 7. Create public profile with OCEAN codes
	console.log("\nCreating public profile...");
	const [profile] = yield* db
		.insert(publicProfile)
		.values({
			sessionId: sessionRecord.id,
			assessmentResultId: resultRecord.id,
			userId,
			oceanCode5: "ODANT",
			oceanCode4: "ODAN",
			isPublic: false,
		})
		.returning()
		.pipe(Effect.mapError((error) => new Error(`Failed to create public profile: ${error}`)));
	console.log(`  Created public profile: ${profile.id} (OCEAN: ODANT)`);

	// 8. Print summary
	console.log("\nSeed completed successfully!\n");
	console.log("=".repeat(60));
	console.log("SESSION DETAILS");
	console.log("=".repeat(60));
	console.log(`Session ID: ${sessionRecord.id}`);
	console.log(`User: ${TEST_USER_EMAIL}`);
	console.log(`Status: ${sessionRecord.status}`);
	console.log(`Messages: ${CONVERSATION_MESSAGES.length}`);
	console.log(`Conversation Evidence: ${convEvidenceCount}`);
	console.log(`Finalization Evidence: ${finEvidenceCount}`);
	console.log(`OCEAN Code: ODANT`);
	console.log(`Public Profile ID: ${profile.id}`);
	console.log("=".repeat(60));
	console.log("\nLogin Credentials:");
	console.log(`   Email:    ${TEST_USER_EMAIL}`);
	console.log(`   Password: ${TEST_USER_PASSWORD}`);
	console.log("\nQuick Test URLs:");
	console.log(`   Profile Page: http://localhost:3000/profile`);
	console.log(`   Results Page: http://localhost:3000/results/${sessionRecord.id}`);
	console.log(`   Chat Page:    http://localhost:3000/chat?sessionId=${sessionRecord.id}`);
	console.log("\nTip: Log in as test@bigocean.dev to see the assessment on /profile\n");

	return sessionRecord.id;
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
