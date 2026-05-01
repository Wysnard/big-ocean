/**
 * Database Schema (Drizzle ORM - PostgreSQL)
 *
 * Core tables for Better Auth:
 * - user: User accounts
 * - session: Active sessions (Better Auth)
 * - account: OAuth/provider accounts
 * - verification: Email verification tokens
 *
 * Assessment tables (Two-tier architecture — Story 9.1 clean-slate):
 * - conversation: Assessment conversation sessions
 * - message: Conversation messages in sessions
 * - conversationEvidence: Lean evidence for steering (conversanalyzer)
 * - conversationEvidence: Evidence extracted by ConversAnalyzer on every message
 * - assessmentResults: Final scored results with portrait
 * - userSummaryVersions: ADR-55 versioned UserSummary history (current + frozen per result)
 * - publicProfile: Shareable profile links
 */

import { ALL_FACETS } from "@workspace/domain/constants/big-five";
import {
	DEPTH_SIGNAL_LEVELS,
	PORTRAIT_RATINGS,
	PORTRAIT_TYPES,
} from "@workspace/domain/types/portrait-rating.types";
import { PURCHASE_EVENT_TYPES } from "@workspace/domain/types/purchase.types";
import { defineRelations, sql } from "drizzle-orm";
import {
	boolean,
	check,
	date,
	index,
	integer,
	jsonb,
	pgEnum,
	pgTable,
	smallint,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";

// ─── pgEnums (single source of truth from domain constants) ───────────────

/**
 * DB-level evidence domain enum — matches LIFE_DOMAINS from domain constants.
 * Solo removed in Story C.1 (post-implementation cleanup).
 */
const DB_EVIDENCE_DOMAINS = [
	"work",
	"relationships",
	"family",
	"leisure",
	"health",
	"other",
] as const;
export const evidenceDomainEnum = pgEnum("evidence_domain", DB_EVIDENCE_DOMAINS);

export const bigfiveFacetNameEnum = pgEnum("bigfive_facet_name", ALL_FACETS);

export const evidenceStrengthEnum = pgEnum("evidence_strength", ["weak", "moderate", "strong"]);

export const evidenceConfidenceEnum = pgEnum("evidence_confidence", ["low", "medium", "high"]);

export const evidencePolarityEnum = pgEnum("evidence_polarity", ["high", "low"]);

export const resultStageEnum = pgEnum("result_stage", ["scored", "completed"]);

export const portraitTypeEnum = pgEnum("portrait_type", PORTRAIT_TYPES);

export const portraitRatingEnum = pgEnum("portrait_rating", PORTRAIT_RATINGS);

export const depthSignalEnum = pgEnum("depth_signal", DEPTH_SIGNAL_LEVELS);

export const purchaseEventTypeEnum = pgEnum("purchase_event_type", PURCHASE_EVENT_TYPES);

const CONVERSATION_TYPES = ["assessment", "extension", "coach", "journal", "career"] as const;
export const conversationTypeEnum = pgEnum("conversation_type", CONVERSATION_TYPES);
export const dailyCheckInMoodEnum = pgEnum("daily_check_in_mood", [
	"great",
	"good",
	"okay",
	"uneasy",
	"rough",
]);
export const dailyCheckInVisibilityEnum = pgEnum("daily_check_in_visibility", [
	"private",
	"inner_circle",
	"public_pulse",
]);

// ─── Better Auth tables ───────────────────────────────────────────────────

export const user = pgTable("user", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: boolean("email_verified").default(false).notNull(),
	image: text("image"),
	firstVisitCompleted: boolean("first_visit_completed").default(false).notNull(),
	firstDailyPromptScheduledFor: timestamp("first_daily_prompt_scheduled_for"),
	subscriptionNudgeEmailSentAt: timestamp("subscription_nudge_email_sent_at"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at")
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull(),
});

export const session = pgTable(
	"session",
	{
		id: text("id").primaryKey(),
		expiresAt: timestamp("expires_at").notNull(),
		token: text("token").notNull().unique(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
		ipAddress: text("ip_address"),
		userAgent: text("user_agent"),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
	},
	(table) => [index("session_userId_idx").on(table.userId)],
);

export const account = pgTable(
	"account",
	{
		id: text("id").primaryKey(),
		accountId: text("account_id").notNull(),
		providerId: text("provider_id").notNull(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		accessToken: text("access_token"),
		refreshToken: text("refresh_token"),
		idToken: text("id_token"),
		accessTokenExpiresAt: timestamp("access_token_expires_at"),
		refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
		scope: text("scope"),
		password: text("password"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = pgTable(
	"verification",
	{
		id: text("id").primaryKey(),
		identifier: text("identifier").notNull(),
		value: text("value").notNull(),
		expiresAt: timestamp("expires_at").notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [index("verification_identifier_idx").on(table.identifier)],
);

// ─── Assessment tables (Two-tier architecture) ───────────────────────────

/**
 * Assessment Sessions
 *
 * Tracks personality assessment conversation sessions linked to authenticated users.
 */
export const conversation = pgTable(
	"conversations",
	{
		id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		status: text("status").notNull().default("active"),
		finalizationProgress: text("finalization_progress"),
		messageCount: integer("message_count").default(0).notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
		dropOffEmailSentAt: timestamp("drop_off_email_sent_at"),
		checkInEmailSentAt: timestamp("check_in_email_sent_at"),
		parentConversationId: uuid("parent_conversation_id"),
		conversationType: conversationTypeEnum("conversation_type").notNull().default("assessment"),
		metadata: jsonb("metadata"),
	},
	(table) => [
		index("conversation_user_id_idx").on(table.userId),
		uniqueIndex("conversation_original_lifetime_unique")
			.on(table.userId)
			.where(
				sql`user_id IS NOT NULL AND parent_conversation_id IS NULL AND status IN ('finalizing', 'completed')`,
			),
		index("conversation_parent_id_idx").on(table.parentConversationId),
	],
);

// ─── Assessment Exchange (Story 23-3 — per-turn pipeline state) ────────────

/**
 * Assessment Exchange
 *
 * One row per conversation turn, storing Director model pipeline state:
 * extraction tier, creative director brief, and coverage analysis targets.
 *
 * Story 43-1: Replaced ~18 pacing/scoring/governor columns with Director model columns.
 * Kept: id, conversation_id, turn_number, extraction_tier, created_at.
 * Added: director_output (text), coverage_targets (jsonb).
 */
export const exchange = pgTable(
	"exchanges",
	{
		id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
		conversationId: uuid("conversation_id")
			.notNull()
			.references(() => conversation.id, { onDelete: "cascade" }),
		turnNumber: smallint("turn_number").notNull(),

		// Extraction
		extractionTier: smallint("extraction_tier"),

		// Director model
		directorOutput: text("director_output"),
		coverageTargets: jsonb("coverage_targets"),

		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		index("exchange_conversation_id_idx").on(table.conversationId),
		uniqueIndex("exchange_conversation_turn_unique").on(table.conversationId, table.turnNumber),
	],
);

/**
 * Assessment Messages
 *
 * Stores conversation history for each assessment session.
 * exchange_id links to the pipeline exchange that produced this message.
 *
 * Story 23-3: Dropped territory_id, observed_energy_level, user_id
 * (territory/energy now live on assessment_exchange; userId derivable from session).
 */
export const message = pgTable(
	"messages",
	{
		id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
		conversationId: uuid("conversation_id")
			.notNull()
			.references(() => conversation.id, { onDelete: "cascade" }),
		exchangeId: uuid("exchange_id").references(() => exchange.id, {
			onDelete: "set null",
		}),
		role: text("role").notNull(),
		content: text("content").notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [index("message_conversation_created_idx").on(table.conversationId, table.createdAt)],
);

/**
 * Conversation Evidence (v2 — Decision D4)
 *
 * Produced by conversanalyzer (Haiku) on every user message.
 * v2: deviation/strength/confidence enums replace noisy 0-20 scores.
 * Story 18-1: Drop + recreate (Decision D7 — no migration, fresh start).
 */
export const conversationEvidence = pgTable(
	"conversation_evidence",
	{
		id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
		conversationId: uuid("conversation_id")
			.notNull()
			.references(() => conversation.id, { onDelete: "cascade" }),
		messageId: uuid("message_id")
			.notNull()
			.references(() => message.id, { onDelete: "cascade" }),
		exchangeId: uuid("exchange_id").references(() => exchange.id, {
			onDelete: "set null",
		}),
		bigfiveFacet: bigfiveFacetNameEnum("bigfive_facet").notNull(),
		strength: evidenceStrengthEnum("strength").notNull(),
		confidence: evidenceConfidenceEnum("confidence").notNull(),
		domain: evidenceDomainEnum("domain").notNull(),
		polarity: evidencePolarityEnum("polarity").notNull(),
		note: text("note").notNull(),
		createdAt: timestamp("created_at").defaultNow(),
	},
	(table) => [
		index("conversation_evidence_conversation_id_idx").on(table.conversationId),
		index("conversation_evidence_exchange_id_idx").on(table.exchangeId),
	],
);

/**
 * Assessment Results
 *
 * Final scored results from finalization pipeline.
 * JSONB for facets/traits/domainCoverage, TEXT for portrait.
 * ocean_code is NOT stored — derived from traits via generateOceanCode().
 */
export const assessmentResults = pgTable(
	"assessment_results",
	{
		id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
		conversationId: uuid("conversation_id")
			.notNull()
			.references(() => conversation.id, { onDelete: "cascade" }),
		facets: jsonb("facets").notNull(),
		traits: jsonb("traits").notNull(),
		domainCoverage: jsonb("domain_coverage").notNull(),
		portrait: text("portrait").notNull(),
		stage: resultStageEnum("stage"),
		createdAt: timestamp("created_at").defaultNow(),
	},
	(table) => [uniqueIndex("assessment_results_conversation_id_unique").on(table.conversationId)],
);

/**
 * Public Profile (Shareable Profile Links)
 *
 * Dual FK: conversation_id + assessment_result_id.
 */
export const publicProfile = pgTable(
	"public_profile",
	{
		id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
		conversationId: uuid("conversation_id")
			.notNull()
			.references(() => conversation.id, { onDelete: "cascade" }),
		assessmentResultId: uuid("assessment_result_id").references(() => assessmentResults.id, {
			onDelete: "cascade",
		}),
		userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
		isPublic: boolean("is_public").default(false).notNull(),
		viewCount: integer("view_count").default(0).notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("public_profile_conversation_id_idx").on(table.conversationId),
		uniqueIndex("public_profile_conversation_id_unique").on(table.conversationId),
		index("public_profile_user_id_idx").on(table.userId),
	],
);

/**
 * Portrait job offers (queue dedupe ledger)
 *
 * The portrait worker queue is in-memory; this table provides at-most-once enqueue semantics.
 */
export const portraitJobOffers = pgTable(
	"portrait_job_offers",
	{
		id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
		conversationId: uuid("conversation_id")
			.notNull()
			.references(() => conversation.id, { onDelete: "cascade" }),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		jobKey: text("job_key").notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		uniqueIndex("portrait_job_offers_conversation_job_key_unique").on(
			table.conversationId,
			table.jobKey,
		),
		index("portrait_job_offers_conversation_id_idx").on(table.conversationId),
	],
);

// ─── Purchase Events (Story 13.1 — append-only event log) ────────────────

/**
 * Purchase Events
 *
 * Append-only event log for all purchase/refund actions.
 * User capabilities derived from events, not mutable counters.
 * No UPDATE or DELETE — corrections via compensating events (refunds).
 */
export const purchaseEvents = pgTable(
	"purchase_events",
	{
		id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
		userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
		eventType: purchaseEventTypeEnum("event_type").notNull(),
		polarCheckoutId: text("polar_checkout_id"),
		polarSubscriptionId: text("polar_subscription_id"),
		polarProductId: text("polar_product_id"),
		amountCents: integer("amount_cents"),
		currency: text("currency"),
		metadata: jsonb("metadata"),
		assessmentResultId: uuid("assessment_result_id").references(() => assessmentResults.id, {
			onDelete: "set null",
		}),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		check(
			"purchase_events_subscription_id_required_check",
			sql`(${table.eventType} NOT IN ('subscription_started', 'subscription_renewed', 'subscription_cancelled', 'subscription_expired')) OR ${table.polarSubscriptionId} IS NOT NULL`,
		),
		index("purchase_events_user_id_idx").on(table.userId),
		index("purchase_events_assessment_result_id_idx").on(table.assessmentResultId),
		index("purchase_events_polar_subscription_id_idx").on(table.polarSubscriptionId),
		uniqueIndex("purchase_events_polar_checkout_id_unique")
			.on(table.polarCheckoutId)
			.where(sql`polar_checkout_id IS NOT NULL`),
		uniqueIndex("purchase_events_sub_started_unique")
			.on(table.polarSubscriptionId)
			.where(
				sql`${table.eventType} = 'subscription_started' AND ${table.polarSubscriptionId} IS NOT NULL`,
			),
		uniqueIndex("purchase_events_sub_cancelled_unique")
			.on(table.polarSubscriptionId)
			.where(
				sql`${table.eventType} = 'subscription_cancelled' AND ${table.polarSubscriptionId} IS NOT NULL`,
			),
		uniqueIndex("purchase_events_sub_expired_unique")
			.on(table.polarSubscriptionId)
			.where(
				sql`${table.eventType} = 'subscription_expired' AND ${table.polarSubscriptionId} IS NOT NULL`,
			),
		uniqueIndex("purchase_events_sub_renewed_period_unique")
			.on(table.polarSubscriptionId, sql`(${table.metadata}->>'renewalPeriodEnd')`)
			.where(
				sql`${table.eventType} = 'subscription_renewed' AND ${table.polarSubscriptionId} IS NOT NULL AND (${table.metadata}->>'renewalPeriodEnd') IS NOT NULL`,
			),
	],
);

// ─── Portraits (Story 13.3) ───────────────────────────────────────────────

/**
 * Portraits
 *
 * Full portrait system (teaser tier removed — Story 32-0).
 * Row inserted only on final outcome: content (success) or failedAt (failure).
 * Status derived from portrait row + purchase event, not stored column.
 */
export const portraits = pgTable(
	"portraits",
	{
		id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
		assessmentResultId: uuid("assessment_result_id")
			.notNull()
			.references(() => assessmentResults.id, { onDelete: "cascade" }),
		tier: text("tier").notNull().$type<"full">(),
		content: text("content"),
		modelUsed: text("model_used"),
		/** ADR-51 Stage A output */
		spineBrief: jsonb("spine_brief"),
		/** ADR-51 Stage B output */
		spineVerification: jsonb("spine_verification"),
		/** ADR-51 model IDs used per stage */
		portraitPipelineModels: jsonb("portrait_pipeline_models"),
		failedAt: timestamp("failed_at"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		uniqueIndex("portraits_result_tier_unique").on(table.assessmentResultId, table.tier),
		index("portraits_assessment_result_id_idx").on(table.assessmentResultId),
	],
);

// ─── Profile Access Log (Story 15.1 — audit logging for profile views) ──

/**
 * Profile Access Log
 *
 * Append-only audit log recording public profile access events.
 * Fire-and-forget — failures never block user-facing responses.
 */
export const profileAccessLog = pgTable(
	"profile_access_log",
	{
		id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
		profileId: uuid("profile_id")
			.notNull()
			.references(() => publicProfile.id, { onDelete: "cascade" }),
		accessorUserId: text("accessor_user_id"),
		accessorIp: text("accessor_ip"),
		accessorUserAgent: text("accessor_user_agent"),
		action: text("action").notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [index("profile_access_log_profile_created_idx").on(table.profileId, table.createdAt)],
);

// ─── Waitlist (Story 15.3 — circuit breaker email capture) ────────────────

/**
 * Waitlist Emails
 *
 * Simple email capture for users who hit the global assessment limit.
 * Duplicate emails silently accepted via UNIQUE constraint + ON CONFLICT DO NOTHING.
 */
export const waitlistEmails = pgTable("waitlist_emails", {
	id: uuid("id").primaryKey().defaultRandom(),
	email: text("email").notNull().unique(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── QR Token Status Enum (Story 34-1) ─────────────────────────────────────

export const qrTokenStatusEnum = pgEnum("qr_token_status", ["active", "accepted", "expired"]);

// ─── Relationship QR Tokens (Story 34-1, ADR-10) ──────────────────────────

/**
 * Relationship QR Tokens
 *
 * Ephemeral tokens for relationship analysis initiation.
 * 6h TTL, auto-regenerate hourly (client-side), derive expiry at query time.
 */
export const relationshipQrTokens = pgTable(
	"relationship_qr_tokens",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		token: text("token").notNull().unique(),
		expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
		status: qrTokenStatusEnum("status").notNull().default("active"),
		acceptedByUserId: text("accepted_by_user_id").references(() => user.id, {
			onDelete: "set null",
		}),
		createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [index("relationship_qr_tokens_user_idx").on(table.userId)],
);

// ─── Relationship Analyses (Story 14.4, updated Story 34-1 — ADR-10) ─────

/**
 * Relationship Analyses
 *
 * Stores generated pair analysis content.
 * Placeholder row pattern: content=NULL means generating (same as portraits).
 * Updated: references assessment_results instead of relationship_invitations.
 */
export const relationshipAnalyses = pgTable("relationship_analyses", {
	id: uuid("id").primaryKey().defaultRandom(),
	userAId: text("user_a_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	userBId: text("user_b_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	userAResultId: uuid("user_a_result_id")
		.notNull()
		.references(() => assessmentResults.id, { onDelete: "cascade" }),
	userBResultId: uuid("user_b_result_id")
		.notNull()
		.references(() => assessmentResults.id, { onDelete: "cascade" }),
	content: text("content"),
	contentCompletedAt: timestamp("content_completed_at", { withTimezone: true }),
	modelUsed: text("model_used"),
	retryCount: integer("retry_count").notNull().default(0),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Relationship shared notes (Story 7.3 — Section D1) ───────────────────

export const relationshipSharedNotes = pgTable(
	"relationship_shared_notes",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		relationshipAnalysisId: uuid("relationship_analysis_id")
			.notNull()
			.references(() => relationshipAnalyses.id, { onDelete: "cascade" }),
		authorUserId: text("author_user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		body: text("body").notNull(),
		createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [
		index("relationship_shared_notes_analysis_created_idx").on(
			table.relationshipAnalysisId,
			table.createdAt,
		),
	],
);

// ─── Push Notifications (Story 10-2) ─────────────────────────────────────

export const pushSubscriptions = pgTable(
	"push_subscriptions",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		endpoint: text("endpoint").notNull(),
		p256dh: text("p256dh").notNull(),
		auth: text("auth").notNull(),
		createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		index("push_subscriptions_user_id_idx").on(table.userId),
		uniqueIndex("push_subscriptions_endpoint_unique").on(table.endpoint),
	],
);

export const pushNotificationQueue = pgTable(
	"push_notification_queue",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		title: text("title").notNull(),
		body: text("body").notNull(),
		url: text("url").notNull(),
		tag: text("tag"),
		dedupeKey: text("dedupe_key").notNull(),
		createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
		expiresAt: timestamp("expires_at", { withTimezone: true })
			.notNull()
			.default(sql`now() + interval '7 days'`),
	},
	(table) => [
		index("push_notification_queue_user_id_idx").on(table.userId),
		uniqueIndex("push_notification_queue_user_dedupe_unique").on(table.userId, table.dedupeKey),
	],
);

// ─── Daily Check-ins (Story 4.1) ───────────────────────────────────────────

export const dailyCheckIns = pgTable(
	"daily_check_ins",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		localDate: date("local_date").notNull(),
		mood: dailyCheckInMoodEnum("mood").notNull(),
		note: text("note"),
		visibility: dailyCheckInVisibilityEnum("visibility").notNull().default("private"),
		createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [
		index("daily_check_ins_user_created_idx").on(table.userId, table.createdAt.desc()),
		uniqueIndex("daily_check_ins_user_local_date_unique").on(table.userId, table.localDate),
	],
);

// ─── Weekly summaries / Sunday letter (Story 5.1) ─────────────────────────

export const weeklySummaries = pgTable(
	"weekly_summaries",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		weekStartDate: date("week_start_date").notNull(),
		weekEndDate: date("week_end_date").notNull(),
		content: text("content"),
		generatedAt: timestamp("generated_at", { withTimezone: true }),
		failedAt: timestamp("failed_at", { withTimezone: true }),
		retryCount: smallint("retry_count").notNull().default(0),
		/** LLM spend for this generation (Story 11-1) — nullable for rows created before column existed */
		llmCostCents: integer("llm_cost_cents"),
		createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [
		uniqueIndex("weekly_summaries_user_week_start_unique").on(table.userId, table.weekStartDate),
		index("weekly_summaries_user_week_start_desc_idx").on(table.userId, table.weekStartDate.desc()),
	],
);

// ─── User summary versions (ADR-55) — versioned history + frozen snapshot per result ─

export const userSummaryVersions = pgTable(
	"user_summary_versions",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		assessmentResultId: uuid("assessment_result_id").references(() => assessmentResults.id, {
			onDelete: "cascade",
		}),
		version: integer("version").notNull(),
		content: jsonb("content").notNull(),
		refreshSource: text("refresh_source").notNull(),
		generatedAt: timestamp("generated_at", { withTimezone: true }).notNull().defaultNow(),
		tokenCount: integer("token_count"),
	},
	(table) => [
		uniqueIndex("user_summary_versions_user_version_unique").on(table.userId, table.version),
		uniqueIndex("user_summary_versions_assessment_result_unique")
			.on(table.assessmentResultId)
			.where(sql`${table.assessmentResultId} IS NOT NULL`),
		index("user_summary_versions_user_id_version_desc_idx").on(table.userId, table.version.desc()),
	],
);

// ─── Portrait Ratings (Story 19-2 — portrait quality telemetry) ───────────

/**
 * Portrait Ratings
 *
 * Captures user feedback on portrait quality (thumbs up/down).
 * Placeholder for future quality evaluation — no UI yet.
 */
export const portraitRatings = pgTable(
	"portrait_ratings",
	{
		id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		conversationId: uuid("conversation_id")
			.notNull()
			.references(() => conversation.id, { onDelete: "cascade" }),
		portraitType: portraitTypeEnum("portrait_type").notNull(),
		rating: portraitRatingEnum("rating").notNull(),
		depthSignal: depthSignalEnum("depth_signal").notNull(),
		evidenceCount: integer("evidence_count").notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [index("portrait_ratings_conversation_id_idx").on(table.conversationId)],
);

// ─── Relations (Drizzle v2 syntax) ───────────────────────────────────────

export const relations = defineRelations(
	{
		user,
		session,
		account,
		verification,
		conversation,
		exchange,
		message,
		conversationEvidence,
		assessmentResults,
		publicProfile,
		purchaseEvents,
		portraits,
		profileAccessLog,
		relationshipQrTokens,
		relationshipAnalyses,
		pushSubscriptions,
		pushNotificationQueue,
		dailyCheckIns,
		weeklySummaries,
		userSummaryVersions,
		portraitRatings,
	},
	(r) => ({
		user: {
			sessions: r.many.session(),
			accounts: r.many.account(),
			conversation: r.many.conversation(),
			publicProfiles: r.many.publicProfile(),
			purchaseEvents: r.many.purchaseEvents(),
			qrTokens: r.many.relationshipQrTokens({
				from: r.user.id,
				to: r.relationshipQrTokens.userId,
			}),
			pushSubscriptions: r.many.pushSubscriptions(),
			pushNotifications: r.many.pushNotificationQueue(),
			dailyCheckIns: r.many.dailyCheckIns(),
			weeklySummaries: r.many.weeklySummaries(),
			userSummaryVersions: r.many.userSummaryVersions(),
		},
		session: {
			user: r.one.user({
				from: r.session.userId,
				to: r.user.id,
			}),
		},
		account: {
			user: r.one.user({
				from: r.account.userId,
				to: r.user.id,
			}),
		},
		conversation: {
			user: r.one.user({
				from: r.conversation.userId,
				to: r.user.id,
			}),
			exchanges: r.many.exchange(),
			messages: r.many.message(),
			conversationEvidence: r.many.conversationEvidence(),
			assessmentResults: r.many.assessmentResults(),
			publicProfile: r.many.publicProfile(),
		},
		exchange: {
			session: r.one.conversation({
				from: r.exchange.conversationId,
				to: r.conversation.id,
			}),
			messages: r.many.message(),
			evidence: r.many.conversationEvidence(),
		},
		message: {
			session: r.one.conversation({
				from: r.message.conversationId,
				to: r.conversation.id,
			}),
			exchange: r.one.exchange({
				from: r.message.exchangeId,
				to: r.exchange.id,
			}),
			conversationEvidence: r.many.conversationEvidence(),
		},
		conversationEvidence: {
			session: r.one.conversation({
				from: r.conversationEvidence.conversationId,
				to: r.conversation.id,
			}),
			message: r.one.message({
				from: r.conversationEvidence.messageId,
				to: r.message.id,
			}),
			exchange: r.one.exchange({
				from: r.conversationEvidence.exchangeId,
				to: r.exchange.id,
			}),
		},
		assessmentResults: {
			session: r.one.conversation({
				from: r.assessmentResults.conversationId,
				to: r.conversation.id,
			}),
			publicProfile: r.many.publicProfile(),
			portraits: r.many.portraits(),
			userSummary: r.one.userSummaryVersions({
				from: r.assessmentResults.id,
				to: r.userSummaryVersions.assessmentResultId,
			}),
		},
		portraits: {
			result: r.one.assessmentResults({
				from: r.portraits.assessmentResultId,
				to: r.assessmentResults.id,
			}),
		},
		publicProfile: {
			session: r.one.conversation({
				from: r.publicProfile.conversationId,
				to: r.conversation.id,
			}),
			result: r.one.assessmentResults({
				from: r.publicProfile.assessmentResultId,
				to: r.assessmentResults.id,
			}),
			user: r.one.user({
				from: r.publicProfile.userId,
				to: r.user.id,
			}),
		},
		purchaseEvents: {
			user: r.one.user({
				from: r.purchaseEvents.userId,
				to: r.user.id,
			}),
		},
		profileAccessLog: {
			profile: r.one.publicProfile({
				from: r.profileAccessLog.profileId,
				to: r.publicProfile.id,
			}),
		},
		relationshipQrTokens: {
			user: r.one.user({
				from: r.relationshipQrTokens.userId,
				to: r.user.id,
			}),
			acceptedBy: r.one.user({
				from: r.relationshipQrTokens.acceptedByUserId,
				to: r.user.id,
			}),
		},
		relationshipAnalyses: {
			userA: r.one.user({
				from: r.relationshipAnalyses.userAId,
				to: r.user.id,
			}),
			userB: r.one.user({
				from: r.relationshipAnalyses.userBId,
				to: r.user.id,
			}),
			userAResult: r.one.assessmentResults({
				from: r.relationshipAnalyses.userAResultId,
				to: r.assessmentResults.id,
			}),
			userBResult: r.one.assessmentResults({
				from: r.relationshipAnalyses.userBResultId,
				to: r.assessmentResults.id,
			}),
		},
		pushSubscriptions: {
			user: r.one.user({
				from: r.pushSubscriptions.userId,
				to: r.user.id,
			}),
		},
		pushNotificationQueue: {
			user: r.one.user({
				from: r.pushNotificationQueue.userId,
				to: r.user.id,
			}),
		},
		dailyCheckIns: {
			user: r.one.user({
				from: r.dailyCheckIns.userId,
				to: r.user.id,
			}),
		},
		weeklySummaries: {
			user: r.one.user({
				from: r.weeklySummaries.userId,
				to: r.user.id,
			}),
		},
		userSummaryVersions: {
			user: r.one.user({
				from: r.userSummaryVersions.userId,
				to: r.user.id,
			}),
			assessmentResult: r.one.assessmentResults({
				from: r.userSummaryVersions.assessmentResultId,
				to: r.assessmentResults.id,
			}),
		},
		portraitRatings: {
			user: r.one.user({
				from: r.portraitRatings.userId,
				to: r.user.id,
			}),
			session: r.one.conversation({
				from: r.portraitRatings.conversationId,
				to: r.conversation.id,
			}),
		},
	}),
);
