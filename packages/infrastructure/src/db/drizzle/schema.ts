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
 * - finalizationEvidence: Rich evidence for portrait (finanalyzer)
 * - assessmentResults: Final scored results with portrait
 * - publicProfile: Shareable profile links
 */

import { ALL_FACETS } from "@workspace/domain/constants/big-five";
import { LIFE_DOMAINS } from "@workspace/domain/constants/life-domain";
import { PURCHASE_EVENT_TYPES } from "@workspace/domain/types/purchase.types";
import { defineRelations, sql } from "drizzle-orm";
import {
	boolean,
	check,
	index,
	integer,
	jsonb,
	numeric,
	pgEnum,
	pgTable,
	smallint,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";

// ─── pgEnums (single source of truth from domain constants) ───────────────

export const evidenceDomainEnum = pgEnum(
	"evidence_domain",
	LIFE_DOMAINS as unknown as [string, ...string[]],
);

export const bigfiveFacetNameEnum = pgEnum(
	"bigfive_facet_name",
	ALL_FACETS as unknown as [string, ...string[]],
);

export const purchaseEventTypeEnum = pgEnum(
	"purchase_event_type",
	PURCHASE_EVENT_TYPES as unknown as [string, ...string[]],
);

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
 * Tracks personality assessment conversation sessions.
 * Sessions can be anonymous (userId NULL) or linked to authenticated users.
 * Anonymous sessions use session_token for cookie-based auth.
 */
export const assessmentSession = pgTable(
	"assessment_session",
	{
		id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
		userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
		sessionToken: text("session_token"),
		status: text("status").notNull().default("active"),
		finalizationProgress: text("finalization_progress"),
		messageCount: integer("message_count").default(0).notNull(),
		personalDescription: text("personal_description"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("assessment_session_user_id_idx").on(table.userId),
		uniqueIndex("assessment_session_user_lifetime_unique")
			.on(table.userId)
			.where(sql`user_id IS NOT NULL AND status IN ('finalizing', 'completed')`),
		uniqueIndex("assessment_session_token_unique")
			.on(table.sessionToken)
			.where(sql`session_token IS NOT NULL`),
	],
);

/**
 * Assessment Messages
 *
 * Stores conversation history for each assessment session.
 * target_domain and target_bigfive_facet track what the assistant message was steering toward.
 */
export const assessmentMessage = pgTable(
	"assessment_message",
	{
		id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
		sessionId: uuid("session_id")
			.notNull()
			.references(() => assessmentSession.id, { onDelete: "cascade" }),
		userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
		role: text("role").notNull(),
		content: text("content").notNull(),
		targetDomain: evidenceDomainEnum("target_domain"),
		targetBigfiveFacet: bigfiveFacetNameEnum("target_bigfive_facet"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [index("assessment_message_session_created_idx").on(table.sessionId, table.createdAt)],
);

/**
 * Conversation Evidence (Lean, steering-only)
 *
 * Produced by conversanalyzer (Haiku) on every user message.
 * Used for formula-based steering calculations. No quotes — just scores.
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
		bigfiveFacet: bigfiveFacetNameEnum("bigfive_facet").notNull(),
		score: smallint("score").notNull(),
		confidence: numeric("confidence", { precision: 4, scale: 3 }).notNull(),
		domain: evidenceDomainEnum("domain").notNull(),
		createdAt: timestamp("created_at").defaultNow(),
	},
	(table) => [
		index("conversation_evidence_session_id_idx").on(table.assessmentSessionId),
		check("conversation_evidence_score_check", sql`score >= 0 AND score <= 20`),
		check("conversation_evidence_confidence_check", sql`confidence >= 0 AND confidence <= 1`),
	],
);

/**
 * Finalization Evidence (Rich, portrait-quality)
 *
 * Produced by finanalyzer (Sonnet) during finalization.
 * Re-analyzes ALL messages for comprehensive evidence with quotes.
 */
export const finalizationEvidence = pgTable(
	"finalization_evidence",
	{
		id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
		assessmentMessageId: uuid("assessment_message_id")
			.notNull()
			.references(() => assessmentMessage.id, { onDelete: "cascade" }),
		assessmentResultId: uuid("assessment_result_id")
			.notNull()
			.references(() => assessmentResults.id, { onDelete: "cascade" }),
		bigfiveFacet: bigfiveFacetNameEnum("bigfive_facet").notNull(),
		score: smallint("score").notNull(),
		confidence: numeric("confidence", { precision: 4, scale: 3 }).notNull(),
		domain: evidenceDomainEnum("domain").notNull(),
		rawDomain: text("raw_domain").notNull(),
		quote: text("quote").notNull(),
		highlightStart: integer("highlight_start"),
		highlightEnd: integer("highlight_end"),
		createdAt: timestamp("created_at").defaultNow(),
	},
	(table) => [
		index("finalization_evidence_result_id_idx").on(table.assessmentResultId),
		check("finalization_evidence_score_check", sql`score >= 0 AND score <= 20`),
		check("finalization_evidence_confidence_check", sql`confidence >= 0 AND confidence <= 1`),
	],
);

/**
 * Assessment Results
 *
 * Final scored results from finalization pipeline.
 * JSONB for facets/traits/domainCoverage, TEXT for portrait.
 * ocean_code is NOT stored — derived from traits via generateOceanCode().
 */
export const assessmentResults = pgTable("assessment_results", {
	id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
	assessmentSessionId: uuid("assessment_session_id")
		.notNull()
		.references(() => assessmentSession.id, { onDelete: "cascade" }),
	facets: jsonb("facets").notNull(),
	traits: jsonb("traits").notNull(),
	domainCoverage: jsonb("domain_coverage").notNull(),
	portrait: text("portrait").notNull(),
	createdAt: timestamp("created_at").defaultNow(),
});

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
		userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
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
			.references(() => user.id, { onDelete: "restrict" }),
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

// ─── Portraits (Story 13.3 — two-tier portrait system) ───────────────────

/**
 * Portraits
 *
 * Two-tier portrait system (teaser/full).
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
		tier: text("tier").notNull().$type<"teaser" | "full">(),
		content: text("content"), // nullable — NULL = generating
		lockedSectionTitles: jsonb("locked_section_titles").$type<string[]>(), // nullable — only for teaser
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

// ─── Relations (Drizzle v2 syntax) ───────────────────────────────────────

export const relations = defineRelations(
	{
		user,
		session,
		account,
		verification,
		assessmentSession,
		assessmentMessage,
		conversationEvidence,
		finalizationEvidence,
		assessmentResults,
		publicProfile,
		purchaseEvents,
		portraits,
		profileAccessLog,
	},
	(r) => ({
		user: {
			sessions: r.many.session(),
			accounts: r.many.account(),
			assessmentSession: r.many.assessmentSession(),
			assessmentMessage: r.many.assessmentMessage(),
			publicProfiles: r.many.publicProfile(),
			purchaseEvents: r.many.purchaseEvents(),
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
			assessmentMessages: r.many.assessmentMessage(),
			conversationEvidence: r.many.conversationEvidence(),
			assessmentResults: r.many.assessmentResults(),
			publicProfile: r.many.publicProfile(),
		},
		assessmentMessage: {
			session: r.one.assessmentSession({
				from: r.assessmentMessage.sessionId,
				to: r.assessmentSession.id,
			}),
			user: r.one.user({
				from: r.assessmentMessage.userId,
				to: r.user.id,
			}),
			conversationEvidence: r.many.conversationEvidence(),
			finalizationEvidence: r.many.finalizationEvidence(),
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
		},
		finalizationEvidence: {
			message: r.one.assessmentMessage({
				from: r.finalizationEvidence.assessmentMessageId,
				to: r.assessmentMessage.id,
			}),
			result: r.one.assessmentResults({
				from: r.finalizationEvidence.assessmentResultId,
				to: r.assessmentResults.id,
			}),
		},
		assessmentResults: {
			session: r.one.assessmentSession({
				from: r.assessmentResults.assessmentSessionId,
				to: r.assessmentSession.id,
			}),
			finalizationEvidence: r.many.finalizationEvidence(),
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
	}),
);
