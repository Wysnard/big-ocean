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
 * - Facet evidence with highlights (scores computed on-demand from evidence)
 *
 * Output: Prints session ID that can be used to navigate to /assessment/{sessionId}/results
 *
 * Story 2.9: facet_scores and trait_scores tables removed.
 * Scores are now computed on-demand from facet_evidence via pure functions.
 */

import "dotenv/config"; // Load .env file
import type { FacetName } from "@workspace/domain";
import { AppConfigLive, Database, DatabaseStack, dbSchema } from "@workspace/infrastructure";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { Effect } from "effect";

const { account, assessmentMessage, assessmentSession, facetEvidence, publicProfile, user } =
	dbSchema;

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
const FACET_SCORE_MAP: Record<FacetName, number> = {
	// Openness (High: 15-18) - intellectually curious, imaginative
	imagination: 17,
	artistic_interests: 14,
	emotionality: 16,
	adventurousness: 13,
	intellect: 18,
	liberalism: 16,

	// Conscientiousness (High: 15-18) - organized, disciplined
	self_efficacy: 17,
	orderliness: 19,
	dutifulness: 16,
	achievement_striving: 17,
	self_discipline: 18,
	cautiousness: 15,

	// Extraversion (Low: 4-8) - introverted, reserved
	friendliness: 8,
	gregariousness: 5,
	assertiveness: 9,
	activity_level: 10,
	excitement_seeking: 6,
	cheerfulness: 7,

	// Agreeableness (Medium: 10-14) - helpful but analytical
	trust: 11,
	morality: 14,
	altruism: 13,
	cooperation: 10,
	modesty: 12,
	sympathy: 11,

	// Neuroticism (Medium: 9-13) - moderate emotional stability
	anxiety: 11,
	anger: 9,
	depression: 10,
	self_consciousness: 12,
	immoderation: 8,
	vulnerability: 10,
};

// Evidence quotes mapping to facets
const EVIDENCE_QUOTES: Record<
	FacetName,
	Array<{ quote: string; messageIndex: number; confidence: number }>
> = {
	orderliness: [
		{
			quote: "color-coding my books, labeling all my supplies, and creating a detailed filing system",
			messageIndex: 1,
			confidence: 95,
		},
		{
			quote: "I love having everything in its proper place",
			messageIndex: 1,
			confidence: 90,
		},
	],
	self_discipline: [
		{
			quote: "I create detailed outlines, timelines, and checklists",
			messageIndex: 3,
			confidence: 92,
		},
		{ quote: "I can't stand the idea of just 'winging it'", messageIndex: 3, confidence: 88 },
	],
	intellect: [
		{
			quote:
				"I love diving deep into topics, reading multiple perspectives, and forming my own opinions",
			messageIndex: 9,
			confidence: 94,
		},
		{
			quote: "always reading books, listening to podcasts, exploring new ideas",
			messageIndex: 9,
			confidence: 91,
		},
	],
	imagination: [
		{
			quote: "I love brainstorming different scenarios and imagining how things could unfold",
			messageIndex: 11,
			confidence: 89,
		},
		{
			quote: "I have three backup plans for every backup plan",
			messageIndex: 11,
			confidence: 85,
		},
	],
	gregariousness: [
		{
			quote: "Large groups can be exhausting for me",
			messageIndex: 5,
			confidence: 87,
		},
		{
			quote: "I'd much rather have a deep one-on-one conversation",
			messageIndex: 5,
			confidence: 82,
		},
	],
	altruism: [
		{
			quote: "I'm usually the first person to show up with food or offer to help",
			messageIndex: 7,
			confidence: 86,
		},
	],
	// Add minimal evidence for other facets (to avoid empty data)
	artistic_interests: [{ quote: "creative project", messageIndex: 2, confidence: 65 }],
	emotionality: [{ quote: "sitting with emotions", messageIndex: 7, confidence: 60 }],
	adventurousness: [{ quote: "exploring new ideas", messageIndex: 9, confidence: 68 }],
	liberalism: [{ quote: "multiple perspectives", messageIndex: 9, confidence: 72 }],
	self_efficacy: [{ quote: "help them organize their tasks", messageIndex: 7, confidence: 75 }],
	dutifulness: [{ quote: "dependable and action-oriented", messageIndex: 8, confidence: 78 }],
	achievement_striving: [{ quote: "thinking about your career", messageIndex: 10, confidence: 70 }],
	cautiousness: [{ quote: "being prepared for multiple futures", messageIndex: 11, confidence: 74 }],
	friendliness: [{ quote: "close friend", messageIndex: 5, confidence: 66 }],
	assertiveness: [{ quote: "I can do it when needed for work", messageIndex: 5, confidence: 64 }],
	activity_level: [{ quote: "spent a whole weekend", messageIndex: 1, confidence: 62 }],
	excitement_seeking: [{ quote: "unlikely ones", messageIndex: 11, confidence: 58 }],
	cheerfulness: [{ quote: "love having everything", messageIndex: 1, confidence: 63 }],
	trust: [{ quote: "close friends", messageIndex: 5, confidence: 67 }],
	morality: [{ quote: "forming my own opinions", messageIndex: 9, confidence: 71 }],
	cooperation: [{ quote: "help with practical things", messageIndex: 7, confidence: 69 }],
	modesty: [{ quote: "trying to get better at that", messageIndex: 7, confidence: 65 }],
	sympathy: [{ quote: "friend is going through a tough time", messageIndex: 6, confidence: 68 }],
	anxiety: [{ quote: "feels chaotic and stressful to me", messageIndex: 3, confidence: 73 }],
	anger: [{ quote: "I get frustrated when", messageIndex: 9, confidence: 64 }],
	depression: [{ quote: "tough time", messageIndex: 6, confidence: 61 }],
	self_consciousness: [{ quote: "Some people think I'm crazy", messageIndex: 1, confidence: 66 }],
	immoderation: [{ quote: "whole weekend", messageIndex: 1, confidence: 59 }],
	vulnerability: [{ quote: "can be exhausting", messageIndex: 5, confidence: 67 }],
};

const seedProgram = Effect.gen(function* () {
	const db = yield* Database;

	console.log("🌱 Starting seed script for completed assessment...\n");

	// 1. Create or get test user
	console.log("👤 Creating test user...");
	const existingUsers = yield* db
		.select()
		.from(user)
		.where(eq(user.email, TEST_USER_EMAIL))
		.limit(1)
		.pipe(Effect.mapError((error) => new Error(`Failed to query user: ${error}`)));

	let userId: string;
	if (existingUsers.length > 0) {
		const existingUser = existingUsers[0];
		console.log(`✓ Test user already exists: ${existingUser.email}`);
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
		console.log(`✓ Created test user: ${TEST_USER_EMAIL}`);
	}

	// 1b. Create credential account (Better Auth password login)
	const existingAccounts = yield* db
		.select()
		.from(account)
		.where(eq(account.userId, userId))
		.limit(1)
		.pipe(Effect.mapError((error) => new Error(`Failed to query account: ${error}`)));

	if (existingAccounts.length > 0) {
		console.log("✓ Credential account already exists");
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
		console.log("✓ Created credential account with password");
	}

	// 2. Create completed assessment session
	console.log("\n📊 Creating completed assessment session...");
	const [session] = yield* db
		.insert(assessmentSession)
		.values({
			userId,
			status: "completed",
			messageCount: CONVERSATION_MESSAGES.length,
		})
		.returning()
		.pipe(Effect.mapError((error) => new Error(`Failed to create assessment session: ${error}`)));

	console.log(`✓ Created session: ${session.id}`);

	// 3. Insert conversation messages
	console.log("\n💬 Inserting conversation messages...");
	const messageRecords = [];
	for (const [index, msg] of CONVERSATION_MESSAGES.entries()) {
		const [msgRecord] = yield* db
			.insert(assessmentMessage)
			.values({
				sessionId: session.id,
				userId: msg.role === "user" ? userId : null,
				role: msg.role,
				content: msg.content,
			})
			.returning()
			.pipe(Effect.mapError((error) => new Error(`Failed to insert message: ${error}`)));
		messageRecords.push(msgRecord);
		console.log(`  ${index + 1}. ${msg.role}: ${msg.content.substring(0, 60)}...`);
	}

	// 4. Insert facet evidence with highlights
	// (Scores are computed on-demand from evidence via pure functions)
	console.log("\n🔍 Inserting facet evidence...");
	let evidenceCount = 0;
	for (const [facet, evidenceList] of Object.entries(EVIDENCE_QUOTES)) {
		for (const evidence of evidenceList) {
			const message = messageRecords[evidence.messageIndex];
			const highlightStart = message.content.indexOf(evidence.quote);
			if (highlightStart === -1) continue; // Skip if quote not found

			yield* db
				.insert(facetEvidence)
				.values({
					assessmentMessageId: message.id,
					facetName: facet,
					score: FACET_SCORE_MAP[facet as FacetName],
					confidence: evidence.confidence,
					quote: evidence.quote,
					highlightStart,
					highlightEnd: highlightStart + evidence.quote.length,
				})
				.pipe(Effect.mapError((error) => new Error(`Failed to insert facet evidence: ${error}`)));
			evidenceCount++;
		}
	}
	console.log(`✓ Inserted ${evidenceCount} pieces of facet evidence`);

	// 5. Create public profile with OCEAN codes
	// Computed from FACET_SCORE_MAP: O=94(O), C=102(D), E=45(A), A=71(N), N=60(T)
	console.log("\n🌊 Creating public profile...");
	const [profile] = yield* db
		.insert(publicProfile)
		.values({
			sessionId: session.id,
			userId,
			oceanCode5: "ODANT",
			oceanCode4: "ODAN",
			isPublic: false,
		})
		.returning()
		.pipe(Effect.mapError((error) => new Error(`Failed to create public profile: ${error}`)));
	console.log(`✓ Created public profile: ${profile.id} (OCEAN: ODANT)`);

	// 6. Print summary
	console.log("\n✨ Seed completed successfully!\n");
	console.log("=".repeat(60));
	console.log("SESSION DETAILS");
	console.log("=".repeat(60));
	console.log(`Session ID: ${session.id}`);
	console.log(`User: ${TEST_USER_EMAIL}`);
	console.log(`Status: ${session.status}`);
	console.log(`Messages: ${CONVERSATION_MESSAGES.length}`);
	console.log(`Evidence Records: ${evidenceCount}`);
	console.log(`OCEAN Code: ODANT`);
	console.log(`Public Profile ID: ${profile.id}`);
	console.log("=".repeat(60));
	console.log("\n🔑 Login Credentials:");
	console.log(`   Email:    ${TEST_USER_EMAIL}`);
	console.log(`   Password: ${TEST_USER_PASSWORD}`);
	console.log("\n🔗 Quick Test URLs:");
	console.log(`   Profile Page: http://localhost:3000/profile`);
	console.log(`   Results Page: http://localhost:3000/results/${session.id}`);
	console.log(`   Chat Page:    http://localhost:3000/chat?sessionId=${session.id}`);
	console.log("\n💡 Tip: Log in as test@bigocean.dev to see the assessment on /profile\n");

	return session.id;
});

// Run the Effect program
const mainProgram = seedProgram.pipe(Effect.provide(DatabaseStack), Effect.provide(AppConfigLive));

Effect.runPromise(mainProgram)
	.then(() => {
		process.exit(0);
	})
	.catch((error) => {
		console.error("❌ Seed failed:", error);
		process.exit(1);
	});
