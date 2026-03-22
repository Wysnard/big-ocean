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
 * - assessmentSession: Assessment conversation sessions
 * - assessmentMessage: Conversation messages in sessions
 * - conversationEvidence: Lean evidence for steering (conversanalyzer)
 * - conversationEvidence: Evidence extracted by ConversAnalyzer on every message
 * - assessmentResults: Final scored results with portrait
 * - publicProfile: Shareable profile links
 */

import { ALL_FACETS } from "@workspace/domain/constants/big-five";
import { LIFE_DOMAINS } from "@workspace/domain/constants/life-domain";
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
	index,
	integer,
	jsonb,
	pgEnum,
	pgTable,
	real,
	smallint,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";

// ─── pgEnums (single source of truth from domain constants) ───────────────

export const evidenceDomainEnum = pgEnum("evidence_domain", LIFE_DOMAINS);

export const bigfiveFacetNameEnum = pgEnum("bigfive_facet_name", ALL_FACETS);

export const evidenceStrengthEnum = pgEnum("evidence_strength", ["weak", "moderate", "strong"]);

export const evidenceConfidenceEnum = pgEnum("evidence_confidence", ["low", "medium", "high"]);

export const resultStageEnum = pgEnum("result_stage", ["scored", "completed"]);

export const portraitTypeEnum = pgEnum("portrait_type", PORTRAIT_TYPES);

export const portraitRatingEnum = pgEnum("portrait_rating", PORTRAIT_RATINGS);

export const depthSignalEnum = pgEnum("depth_signal", DEPTH_SIGNAL_LEVELS);

export const purchaseEventTypeEnum = pgEnum("purchase_event_type", PURCHASE_EVENT_TYPES);

// ─── Better Auth tables ───────────────────────────────────────────────────

export const user = pgTable("user", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: boolean("email_verified").default(false).notNull(),
	image: text("image"),
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
export const assessmentSession = pgTable(
	"assessment_session",
	{
		id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
		userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
		sessionToken: text("session_token"),
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
		recaptureEmailSentAt: timestamp("recapture_email_sent_at"),
		parentSessionId: uuid("parent_session_id"),
	},
	(table) => [
		index("assessment_session_user_id_idx").on(table.userId),
		uniqueIndex("assessment_session_original_lifetime_unique")
			.on(table.userId)
			.where(
				sql`user_id IS NOT NULL AND parent_session_id IS NULL AND status IN ('finalizing', 'completed')`,
			),
		uniqueIndex("assessment_session_token_unique")
			.on(table.sessionToken)
			.where(sql`session_token IS NOT NULL`),
		index("assessment_session_parent_session_id_idx").on(table.parentSessionId),
	],
);

// ─── Assessment Exchange (Story 23-3 — per-turn pipeline state) ────────────

/**
 * Assessment Exchange
 *
 * One row per conversation turn, storing all pipeline state:
 * extraction metrics, pacing values, scorer output, territory selection,
 * governor output/debug, and derived annotations.
 *
 * This is the single source of truth for pipeline replay / derive-at-read.
 */
export const assessmentExchange = pgTable(
	"assessment_exchange",
	{
		id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
		sessionId: uuid("session_id")
			.notNull()
			.references(() => assessmentSession.id, { onDelete: "cascade" }),
		turnNumber: smallint("turn_number").notNull(),

		// Extraction
		energy: real("energy"),
		energyBand: text("energy_band"),
		telling: real("telling"),
		tellingBand: text("telling_band"),
		withinMessageShift: boolean("within_message_shift"),
		stateNotes: jsonb("state_notes"),
		extractionTier: smallint("extraction_tier"),

		// Pacing
		smoothedEnergy: real("smoothed_energy"),
		comfort: real("comfort"),
		drain: real("drain"),
		drainCeiling: real("drain_ceiling"),
		eTarget: real("e_target"),

		// Scoring
		scorerOutput: jsonb("scorer_output"),

		// Selection
		selectedTerritory: text("selected_territory"),
		selectionRule: text("selection_rule"),

		// Governor
		governorOutput: jsonb("governor_output"),
		governorDebug: jsonb("governor_debug"),

		// Derived
		sessionPhase: text("session_phase"),
		transitionType: text("transition_type"),

		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		index("assessment_exchange_session_id_idx").on(table.sessionId),
		uniqueIndex("assessment_exchange_session_turn_unique").on(table.sessionId, table.turnNumber),
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
export const assessmentMessage = pgTable(
	"assessment_message",
	{
		id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
		sessionId: uuid("session_id")
			.notNull()
			.references(() => assessmentSession.id, { onDelete: "cascade" }),
		exchangeId: uuid("exchange_id").references(() => assessmentExchange.id, {
			onDelete: "set null",
		}),
		role: text("role").notNull(),
		content: text("content").notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [index("assessment_message_session_created_idx").on(table.sessionId, table.createdAt)],
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
		assessmentSessionId: uuid("assessment_session_id")
			.notNull()
			.references(() => assessmentSession.id, { onDelete: "cascade" }),
		assessmentMessageId: uuid("assessment_message_id")
			.notNull()
			.references(() => assessmentMessage.id, { onDelete: "cascade" }),
		exchangeId: uuid("exchange_id").references(() => assessmentExchange.id, {
			onDelete: "set null",
		}),
		bigfiveFacet: bigfiveFacetNameEnum("bigfive_facet").notNull(),
		deviation: smallint("deviation").notNull(),
		strength: evidenceStrengthEnum("strength").notNull(),
		confidence: evidenceConfidenceEnum("confidence").notNull(),
		domain: evidenceDomainEnum("domain").notNull(),
		note: text("note").notNull(),
		createdAt: timestamp("created_at").defaultNow(),
	},
	(table) => [
		index("conversation_evidence_session_id_idx").on(table.assessmentSessionId),
		check("conversation_evidence_deviation_check", sql`deviation >= -3 AND deviation <= 3`),
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
		assessmentSessionId: uuid("assessment_session_id")
			.notNull()
			.references(() => assessmentSession.id, { onDelete: "cascade" }),
		facets: jsonb("facets").notNull(),
		traits: jsonb("traits").notNull(),
		domainCoverage: jsonb("domain_coverage").notNull(),
		portrait: text("portrait").notNull(),
		stage: resultStageEnum("stage"),
		createdAt: timestamp("created_at").defaultNow(),
	},
	(table) => [uniqueIndex("assessment_results_session_id_unique").on(table.assessmentSessionId)],
);

/**
 * Public Profile (Shareable Profile Links)
 *
 * Dual FK: session_id + assessment_result_id.
 */
export const publicProfile = pgTable(
	"public_profile",
	{
		id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
		sessionId: uuid("session_id")
			.notNull()
			.references(() => assessmentSession.id, { onDelete: "cascade" }),
		assessmentResultId: uuid("assessment_result_id").references(() => assessmentResults.id, {
			onDelete: "cascade",
		}),
		userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
		oceanCode5: text("ocean_code_5").notNull(),
		oceanCode4: text("ocean_code_4").notNull(),
		isPublic: boolean("is_public").default(false).notNull(),
		viewCount: integer("view_count").default(0).notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("public_profile_session_id_idx").on(table.sessionId),
		index("public_profile_user_id_idx").on(table.userId),
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
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		eventType: purchaseEventTypeEnum("event_type").notNull(),
		polarCheckoutId: text("polar_checkout_id"),
		polarProductId: text("polar_product_id"),
		amountCents: integer("amount_cents"),
		currency: text("currency"),
		metadata: jsonb("metadata"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		index("purchase_events_user_id_idx").on(table.userId),
		uniqueIndex("purchase_events_polar_checkout_id_unique")
			.on(table.polarCheckoutId)
			.where(sql`polar_checkout_id IS NOT NULL`),
	],
);

// ─── Portraits (Story 13.3) ───────────────────────────────────────────────

/**
 * Portraits
 *
 * Full portrait system (teaser tier removed — Story 32-0).
 * Placeholder row pattern: content=NULL means generating.
 * Status derived from data, not stored column.
 */
export const portraits = pgTable(
	"portraits",
	{
		id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
		assessmentResultId: uuid("assessment_result_id")
			.notNull()
			.references(() => assessmentResults.id, { onDelete: "cascade" }),
		tier: text("tier").notNull().$type<"full">(),
		content: text("content"), // nullable — NULL = generating
		modelUsed: text("model_used").notNull(),
		retryCount: integer("retry_count").notNull().default(0),
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
		.references(() => assessmentResults.id),
	userBResultId: uuid("user_b_result_id")
		.notNull()
		.references(() => assessmentResults.id),
	content: text("content"),
	modelUsed: text("model_used"),
	retryCount: integer("retry_count").notNull().default(0),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

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
		assessmentSessionId: uuid("assessment_session_id")
			.notNull()
			.references(() => assessmentSession.id, { onDelete: "cascade" }),
		portraitType: portraitTypeEnum("portrait_type").notNull(),
		rating: portraitRatingEnum("rating").notNull(),
		depthSignal: depthSignalEnum("depth_signal").notNull(),
		evidenceCount: integer("evidence_count").notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [index("portrait_ratings_session_id_idx").on(table.assessmentSessionId)],
);

// ─── Relations (Drizzle v2 syntax) ───────────────────────────────────────

export const relations = defineRelations(
	{
		user,
		session,
		account,
		verification,
		assessmentSession,
		assessmentExchange,
		assessmentMessage,
		conversationEvidence,
		assessmentResults,
		publicProfile,
		purchaseEvents,
		portraits,
		profileAccessLog,
		relationshipQrTokens,
		relationshipAnalyses,
		portraitRatings,
	},
	(r) => ({
		user: {
			sessions: r.many.session(),
			accounts: r.many.account(),
			assessmentSession: r.many.assessmentSession(),
			publicProfiles: r.many.publicProfile(),
			purchaseEvents: r.many.purchaseEvents(),
			qrTokens: r.many.relationshipQrTokens({
				from: r.user.id,
				to: r.relationshipQrTokens.userId,
			}),
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
		assessmentSession: {
			user: r.one.user({
				from: r.assessmentSession.userId,
				to: r.user.id,
			}),
			exchanges: r.many.assessmentExchange(),
			assessmentMessages: r.many.assessmentMessage(),
			conversationEvidence: r.many.conversationEvidence(),
			assessmentResults: r.many.assessmentResults(),
			publicProfile: r.many.publicProfile(),
		},
		assessmentExchange: {
			session: r.one.assessmentSession({
				from: r.assessmentExchange.sessionId,
				to: r.assessmentSession.id,
			}),
			messages: r.many.assessmentMessage(),
			evidence: r.many.conversationEvidence(),
		},
		assessmentMessage: {
			session: r.one.assessmentSession({
				from: r.assessmentMessage.sessionId,
				to: r.assessmentSession.id,
			}),
			exchange: r.one.assessmentExchange({
				from: r.assessmentMessage.exchangeId,
				to: r.assessmentExchange.id,
			}),
			conversationEvidence: r.many.conversationEvidence(),
		},
		conversationEvidence: {
			session: r.one.assessmentSession({
				from: r.conversationEvidence.assessmentSessionId,
				to: r.assessmentSession.id,
			}),
			message: r.one.assessmentMessage({
				from: r.conversationEvidence.assessmentMessageId,
				to: r.assessmentMessage.id,
			}),
			exchange: r.one.assessmentExchange({
				from: r.conversationEvidence.exchangeId,
				to: r.assessmentExchange.id,
			}),
		},
		assessmentResults: {
			session: r.one.assessmentSession({
				from: r.assessmentResults.assessmentSessionId,
				to: r.assessmentSession.id,
			}),
			publicProfile: r.many.publicProfile(),
			portraits: r.many.portraits(),
		},
		portraits: {
			result: r.one.assessmentResults({
				from: r.portraits.assessmentResultId,
				to: r.assessmentResults.id,
			}),
		},
		publicProfile: {
			session: r.one.assessmentSession({
				from: r.publicProfile.sessionId,
				to: r.assessmentSession.id,
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
		portraitRatings: {
			user: r.one.user({
				from: r.portraitRatings.userId,
				to: r.user.id,
			}),
			session: r.one.assessmentSession({
				from: r.portraitRatings.assessmentSessionId,
				to: r.assessmentSession.id,
			}),
		},
	}),
);
