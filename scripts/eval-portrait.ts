#!/usr/bin/env tsx
/**
 * Portrait Evaluation Script
 *
 * Generates a synthetic conversation, analyzes it, and produces portraits
 * from 3 models (Haiku 4.5, Sonnet 4.6, Opus 4.6) for side-by-side comparison.
 *
 * Usage:
 *   pnpm eval:portrait                                    # Full run (generate + analyze + portraits)
 *   pnpm eval:portrait _eval-output/<ts>/intermediate-data.json  # Skip Steps 1-2, re-run portraits only
 *
 * Caching:
 *   On first run, conversation and evidence are saved to _eval-output/.
 *   Subsequent runs reuse them, skipping Steps 1-2 (only portraits re-run).
 *   Delete _eval-output/conversation.json and/or _eval-output/evidence.json to regenerate.
 *
 * Requires: ANTHROPIC_API_KEY in .env
 */

import "dotenv/config";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { ChatAnthropic } from "@langchain/anthropic";
import {
	type AnalysisTarget,
	AnalyzerRepository,
	AppConfig,
	type AppConfigService,
	aggregateFacetScores,
	buildChatSystemPrompt,
	type DomainMessage,
	deriveTraitScores,
	extract4LetterCode,
	generateOceanCode,
	lookupArchetype,
	type PortraitGenerationInput,
	PortraitGeneratorRepository,
	type SavedFacetEvidence,
} from "@workspace/domain";
import {
	AnalyzerClaudeRepositoryLive,
	LoggerPinoRepositoryLive,
	PortraitGeneratorClaudeRepositoryLive,
} from "@workspace/infrastructure";
import { Effect, Layer, Redacted } from "effect";

// ─── Configuration ───────────────────────────────────────────────

const HAIKU_MODEL = "claude-haiku-4-5-20251001";
const SONNET_MODEL = "claude-sonnet-4-6";
const OPUS_MODEL = "claude-opus-4-6";

const USER_MESSAGE_COUNT = 25;

const USER_PERSONA = `You are roleplaying as a specific person during a personality assessment conversation.

YOUR PERSONALITY:
You are a 32-year-old creative director at a small design agency. You're deeply imaginative (high openness), moderately organized (moderate conscientiousness), clearly introverted (low extraversion), warm but selective (moderate agreeableness), and emotionally sensitive (moderate-high neuroticism).

SPECIFIC TRAITS TO EXHIBIT:
- You love abstract ideas, art, and unconventional solutions
- You keep a detailed planner but sometimes abandon plans when inspiration strikes
- Social events drain you, but you're deeply engaged in 1-on-1 conversations
- You're empathetic and accommodating but have firm boundaries about creative integrity
- You overthink decisions and replay conversations in your head
- You recently turned down a promotion because it would mean less hands-on creative work
- You have a complicated relationship with your more conventional siblings
- You find peace in long solo hikes and journaling

CONVERSATION STYLE:
- Be natural and conversational, not clinical
- Share specific anecdotes and examples when prompted
- Sometimes deflect with humor before getting honest
- Occasionally contradict yourself (say you're fine with something, then reveal you're not)
- Use phrases like "I mean...", "honestly though...", "it's weird but..."
- Don't be overly self-aware — let insights emerge through stories, not self-analysis
- Keep responses 2-4 sentences typically, occasionally longer when sharing a story`;

// ─── AppConfig Layer Factory ─────────────────────────────────────

const baseConfig: AppConfigService = {
	anthropicApiKey: Redacted.make(process.env.ANTHROPIC_API_KEY ?? ""),
	betterAuthSecret: Redacted.make("placeholder"),
	databaseUrl: "placeholder",
	redisUrl: "placeholder",
	betterAuthUrl: "placeholder",
	frontendUrl: "placeholder",
	port: 0,
	nodeEnv: "development",
	analyzerModelId: HAIKU_MODEL,
	analyzerMaxTokens: 16000,
	analyzerTemperature: 0,
	portraitModelId: "OVERRIDDEN_PER_RUN",
	portraitMaxTokens: 16000,
	portraitTemperature: 0.7,
	nerinModelId: HAIKU_MODEL,
	nerinMaxTokens: 1024,
	nerinTemperature: 0.7,
	dailyCostLimit: 75,
	freeTierMessageThreshold: 25,
	shareMinConfidence: 70,
};

function makeAppConfigLayer(overrides?: Partial<AppConfigService>) {
	return Layer.succeed(AppConfig, { ...baseConfig, ...overrides });
}

// ─── Step 1: Generate Conversation ──────────────────────────────

const ConversationJsonSchema = {
	type: "object" as const,
	properties: {
		messages: {
			type: "array" as const,
			description: "The full conversation between Nerin and the user, alternating roles",
			items: {
				type: "object" as const,
				properties: {
					role: {
						type: "string" as const,
						enum: ["user", "assistant"],
						description: "assistant = Nerin, user = the person being assessed",
					},
					content: {
						type: "string" as const,
						description: "The message content",
					},
				},
				required: ["role", "content"],
			},
		},
	},
	required: ["messages"],
};

const conversationSystemPrompt = `You are generating a realistic personality assessment conversation between two people.

NERIN (assistant):
${buildChatSystemPrompt()}

THE PERSON BEING ASSESSED (user):
${USER_PERSONA}

TASK:
Generate a natural ${USER_MESSAGE_COUNT}-exchange conversation. Nerin opens with a warm greeting, then they alternate. Each exchange = one user message + one Nerin response. The conversation should feel organic and gradually reveal the user's personality through stories and reflections.`;

async function generateConversation(): Promise<DomainMessage[]> {
	console.log("\n━━━ Step 1: Generating conversation ━━━");

	const model = new ChatAnthropic({
		model: HAIKU_MODEL,
		maxTokens: 16000,
		temperature: 0.8,
	}).withStructuredOutput(ConversationJsonSchema);

	const result = await model.invoke([
		{ role: "system", content: conversationSystemPrompt },
		{ role: "user", content: "Generate the conversation now." },
	]);

	const rawMessages = (result as { messages: Array<{ role: string; content: string }> }).messages;

	const messages: DomainMessage[] = rawMessages.map((m) => ({
		id: crypto.randomUUID(),
		role: m.role as "user" | "assistant",
		content: m.content,
	}));

	const userCount = messages.filter((m) => m.role === "user").length;
	console.log(
		`  Generated ${messages.length} messages (${userCount} user, ${messages.length - userCount} assistant)`,
	);
	return messages;
}

// ─── Step 2: Analyze User Messages ──────────────────────────────

async function analyzeMessages(messages: DomainMessage[]): Promise<SavedFacetEvidence[]> {
	console.log("\n━━━ Step 2: Analyzing user messages ━━━");

	const userMessages = messages.filter((m) => m.role === "user");
	const targets: AnalysisTarget[] = userMessages.map((m) => ({
		assessmentMessageId: m.id,
		content: m.content,
	}));

	const analyzerLayer = AnalyzerClaudeRepositoryLive.pipe(
		Layer.provide(Layer.mergeAll(LoggerPinoRepositoryLive, makeAppConfigLayer())),
	);

	const evidenceMap = await Effect.runPromise(
		Effect.gen(function* () {
			const analyzer = yield* AnalyzerRepository;
			return yield* analyzer.analyzeFacetsBatch(targets, messages);
		}).pipe(Effect.provide(analyzerLayer)),
	);

	// Convert to SavedFacetEvidence with synthetic ids and sequential timestamps
	const baseTime = new Date("2026-02-22T12:00:00Z");
	const allEvidence: SavedFacetEvidence[] = [];
	let minuteOffset = 0;

	for (const [_messageId, evidenceList] of evidenceMap) {
		for (const ev of evidenceList) {
			allEvidence.push({
				...ev,
				id: crypto.randomUUID(),
				createdAt: new Date(baseTime.getTime() + minuteOffset * 60_000),
			});
			minuteOffset++;
		}
	}

	console.log(
		`  Extracted ${allEvidence.length} evidence records from ${userMessages.length} messages`,
	);
	return allEvidence;
}

// ─── Step 3: Compute Scores ─────────────────────────────────────

function computeScores(evidence: SavedFacetEvidence[]) {
	console.log("\n━━━ Step 3: Computing scores ━━━");

	const facetScores = aggregateFacetScores(evidence);
	const traitScores = deriveTraitScores(facetScores);
	const oceanCode5 = generateOceanCode(facetScores);
	const oceanCode4 = extract4LetterCode(oceanCode5);
	const archetype = lookupArchetype(oceanCode4);

	console.log(`  OCEAN code: ${oceanCode5} -> ${oceanCode4}`);
	console.log(`  Archetype: ${archetype.name} (curated: ${archetype.isCurated})`);

	for (const [trait, score] of Object.entries(traitScores)) {
		console.log(`  ${trait}: ${score.score}/120 (confidence: ${score.confidence}%)`);
	}

	return { facetScores, traitScores, oceanCode5, oceanCode4, archetype };
}

// ─── Step 4: Write Intermediate Data ────────────────────────────

function writeIntermediateData(
	outputDir: string,
	messages: DomainMessage[],
	evidence: SavedFacetEvidence[],
	scores: ReturnType<typeof computeScores>,
) {
	console.log("\n━━━ Step 4: Writing intermediate data ━━━");

	const data = {
		generatedAt: new Date().toISOString(),
		userPersona: USER_PERSONA,
		conversation: { messages, messageCount: messages.length },
		analysis: {
			evidence: evidence.map((e) => ({ ...e, createdAt: e.createdAt.toISOString() })),
			evidenceCount: evidence.length,
		},
		scores: {
			facetScores: scores.facetScores,
			traitScores: scores.traitScores,
			oceanCode5: scores.oceanCode5,
			oceanCode4: scores.oceanCode4,
			archetype: scores.archetype,
		},
	};

	const filePath = path.join(outputDir, "intermediate-data.json");
	fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
	console.log(`  Written to ${filePath}`);
}

// ─── Step 5: Generate Portraits ─────────────────────────────────

async function generatePortraits(
	outputDir: string,
	messages: DomainMessage[],
	evidence: SavedFacetEvidence[],
	scores: ReturnType<typeof computeScores>,
) {
	console.log("\n━━━ Step 5: Generating portraits ━━━");

	const models = [
		{ id: HAIKU_MODEL, name: "haiku-4-5" },
		{ id: SONNET_MODEL, name: "sonnet-4-6" },
		{ id: OPUS_MODEL, name: "opus-4-6" },
	];

	const portraitInput: PortraitGenerationInput = {
		sessionId: crypto.randomUUID(),
		facetScoresMap: scores.facetScores,
		allEvidence: evidence,
		archetypeName: scores.archetype.name,
		archetypeDescription: scores.archetype.description,
		oceanCode5: scores.oceanCode5,
		messages,
	};

	await Promise.all(
		models.map(async (model) => {
			console.log(`\n  Generating portrait with ${model.name}...`);
			const startTime = Date.now();

			try {
				const portraitLayer = PortraitGeneratorClaudeRepositoryLive.pipe(
					Layer.provide(
						Layer.mergeAll(LoggerPinoRepositoryLive, makeAppConfigLayer({ portraitModelId: model.id })),
					),
				);

				const portrait = await Effect.runPromise(
					Effect.gen(function* () {
						const generator = yield* PortraitGeneratorRepository;
						return yield* generator.generatePortrait(portraitInput);
					}).pipe(Effect.provide(portraitLayer)),
				);

				const filePath = path.join(outputDir, `portrait-${model.name}.md`);
				fs.writeFileSync(filePath, portrait);

				const duration = ((Date.now() - startTime) / 1000).toFixed(1);
				console.log(`  ${model.name}: ${portrait.length} chars in ${duration}s -> ${filePath}`);
			} catch (error) {
				const duration = ((Date.now() - startTime) / 1000).toFixed(1);
				console.error(`  ${model.name} FAILED after ${duration}s:`, error);
			}
		}),
	);
}

// ─── Load Cached Data ────────────────────────────────────────────

function loadCachedData(filePath: string): {
	messages: DomainMessage[];
	evidence: SavedFacetEvidence[];
} {
	console.log(`\n━━━ Loading cached data from ${filePath} ━━━`);

	const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));
	const messages: DomainMessage[] = raw.conversation.messages;
	const evidence: SavedFacetEvidence[] = raw.analysis.evidence.map(
		(e: SavedFacetEvidence & { createdAt: string }) => ({
			...e,
			createdAt: new Date(e.createdAt),
		}),
	);

	const userCount = messages.filter((m) => m.role === "user").length;
	console.log(
		`  Loaded ${messages.length} messages (${userCount} user, ${messages.length - userCount} assistant)`,
	);
	console.log(`  Loaded ${evidence.length} evidence records`);
	console.log("  Skipping Steps 1-2");

	return { messages, evidence };
}

// ─── Conversation Cache ──────────────────────────────────────────

const CONVERSATION_CACHE_PATH = path.resolve("_eval-output", "conversation.json");
const EVIDENCE_CACHE_PATH = path.resolve("_eval-output", "evidence.json");

function saveConversation(messages: DomainMessage[]): void {
	fs.mkdirSync(path.dirname(CONVERSATION_CACHE_PATH), { recursive: true });
	fs.writeFileSync(CONVERSATION_CACHE_PATH, JSON.stringify({ messages }, null, 2));
	console.log(`  Conversation cached to ${CONVERSATION_CACHE_PATH}`);
}

function loadConversation(): DomainMessage[] | null {
	if (!fs.existsSync(CONVERSATION_CACHE_PATH)) return null;

	console.log(`\n━━━ Loading cached conversation from ${CONVERSATION_CACHE_PATH} ━━━`);
	const raw = JSON.parse(fs.readFileSync(CONVERSATION_CACHE_PATH, "utf-8"));
	const messages: DomainMessage[] = raw.messages;
	const userCount = messages.filter((m) => m.role === "user").length;
	console.log(
		`  Loaded ${messages.length} messages (${userCount} user, ${messages.length - userCount} assistant)`,
	);
	console.log("  Skipping Step 1 (conversation generation)");
	return messages;
}

function saveEvidence(evidence: SavedFacetEvidence[]): void {
	const data = evidence.map((e) => ({ ...e, createdAt: e.createdAt.toISOString() }));
	fs.writeFileSync(EVIDENCE_CACHE_PATH, JSON.stringify({ evidence: data }, null, 2));
	console.log(`  Evidence cached to ${EVIDENCE_CACHE_PATH}`);
}

function loadEvidence(): SavedFacetEvidence[] | null {
	if (!fs.existsSync(EVIDENCE_CACHE_PATH)) return null;

	console.log(`\n━━━ Loading cached evidence from ${EVIDENCE_CACHE_PATH} ━━━`);
	const raw = JSON.parse(fs.readFileSync(EVIDENCE_CACHE_PATH, "utf-8"));
	const evidence: SavedFacetEvidence[] = raw.evidence.map(
		(e: SavedFacetEvidence & { createdAt: string }) => ({
			...e,
			createdAt: new Date(e.createdAt),
		}),
	);
	console.log(`  Loaded ${evidence.length} evidence records`);
	console.log("  Skipping Step 2 (analysis)");
	return evidence;
}

// ─── Main ────────────────────────────────────────────────────────

async function main() {
	if (!process.env.ANTHROPIC_API_KEY) {
		console.error("Error: ANTHROPIC_API_KEY not set. Add it to .env");
		process.exit(1);
	}

	const cachedDataPath = process.argv[2];

	const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
	const outputDir = path.resolve("_eval-output", timestamp);
	fs.mkdirSync(outputDir, { recursive: true });
	console.log(`Output directory: ${outputDir}`);

	const startTime = Date.now();

	let messages: DomainMessage[];
	let evidence: SavedFacetEvidence[];

	if (cachedDataPath) {
		const cached = loadCachedData(path.resolve(cachedDataPath));
		messages = cached.messages;
		evidence = cached.evidence;
	} else {
		// Step 1: Generate or load cached conversation
		const cached = loadConversation();
		if (cached) {
			messages = cached;
		} else {
			messages = await generateConversation();
			saveConversation(messages);
		}

		// Step 2: Analyze or load cached evidence
		const cachedEvidence = loadEvidence();
		if (cachedEvidence) {
			evidence = cachedEvidence;
		} else {
			evidence = await analyzeMessages(messages);
			saveEvidence(evidence);
		}
	}

	// Step 3: Compute scores from evidence (pure functions)
	const scores = computeScores(evidence);

	// Step 4: Write intermediate data for inspection
	writeIntermediateData(outputDir, messages, evidence, scores);

	// Step 5: Generate portraits with 3 models
	await generatePortraits(outputDir, messages, evidence, scores);

	const totalDuration = ((Date.now() - startTime) / 1000).toFixed(0);
	console.log(`\nDone in ${totalDuration}s`);
	console.log(`Output: ${outputDir}`);
	console.log(`\nPortraits:`);
	for (const name of ["haiku-4-5", "sonnet-4-6", "opus-4-6"]) {
		console.log(`  ${path.join(outputDir, `portrait-${name}.md`)}`);
	}
}

main().catch((error) => {
	console.error("Fatal error:", error);
	process.exit(1);
});
