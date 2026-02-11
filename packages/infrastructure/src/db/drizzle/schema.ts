/**
 * Better Auth Database Schema (Drizzle ORM - PostgreSQL)
 *
 * Core tables for Better Auth:
 * - user: User accounts
 * - session: Active sessions (Better Auth)
 * - account: OAuth/provider accounts
 * - verification: Email verification tokens
 *
 * Assessment tables:
 * - sessions: Assessment conversation sessions (note: plural, different from Better Auth "session")
 * - messages: Conversation messages in sessions
 */

import { defineRelations, sql } from "drizzle-orm";
import { boolean, index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

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

/**
 * Assessment Sessions (plural - different from Better Auth "session")
 *
 * Tracks personality assessment conversation sessions.
 * Sessions can be anonymous (userId NULL) or linked to authenticated users.
 */
export const assessmentSession = pgTable(
	"assessment_session",
	{
		id: uuid("id").primaryKey().default(sql`gen_random_uuid()`), // Format: session_{timestamp}_{nanoid}
		userId: text("user_id").references(() => user.id, { onDelete: "set null" }), // NULL for anonymous
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
		status: text("status").notNull().default("active"), // 'active' | 'paused' | 'completed'
		messageCount: integer("message_count").default(0).notNull(),
	},
	(table) => [
		// Index for quick session lookup by user
		index("assessment_session_user_id_idx").on(table.userId),
	],
);

/**
 * Messages in Assessment Sessions
 *
 * Stores conversation history for each assessment session.
 * Links to user if message was sent by authenticated user (NULL for anonymous or assistant messages).
 */
export const assessmentMessage = pgTable(
	"assessment_message",
	{
		id: uuid("id").primaryKey().default(sql`gen_random_uuid()`), // Format: msg_{nanoid}
		sessionId: uuid("session_id")
			.notNull()
			.references(() => assessmentSession.id, { onDelete: "cascade" }),
		userId: text("user_id").references(() => user.id, { onDelete: "set null" }), // User who sent message (NULL for assistant or anonymous)
		role: text("role").notNull(), // 'user' | 'assistant'
		content: text("content").notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		// CRITICAL for <1 second resume: composite index on (sessionId, createdAt)
		// Allows efficient retrieval of all messages for a session in chronological order
		index("assessment_message_session_created_idx").on(table.sessionId, table.createdAt),
	],
);

/**
 * Facet Evidence (Analyzer Output)
 *
 * Stores raw facet signals detected by the Analyzer from each message.
 * Each evidence record represents a single facet detection with confidence and quote.
 */
export const facetEvidence = pgTable(
	"facet_evidence",
	{
		id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
		assessmentMessageId: uuid("assessment_message_id")
			.notNull()
			.references(() => assessmentMessage.id, { onDelete: "cascade" }),
		facetName: text("facet_name").notNull(), // Clean name: "imagination", "altruism", etc.
		score: integer("score").notNull(), // 0-20 analyzer's suggestion for THIS message
		confidence: integer("confidence").notNull(), // 0-100 (stored as integer, divide by 100 for 0.0-1.0)
		quote: text("quote").notNull(), // Exact phrase from message
		highlightStart: integer("highlight_start").notNull(), // Character index
		highlightEnd: integer("highlight_end").notNull(), // Character index
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		// Index for retrieving evidence by assessment message
		index("facet_evidence_assessment_message_id_idx").on(table.assessmentMessageId),
		// Index for retrieving all evidence for a specific facet
		index("facet_evidence_facet_name_idx").on(table.facetName),
	],
);

/**
 * Public Profile (Shareable Profile Links)
 *
 * Stores public-facing personality profiles that can be shared via link.
 * Each profile is generated from a completed assessment session.
 * Private by default — users must explicitly toggle to public.
 */
export const publicProfile = pgTable(
	"public_profile",
	{
		id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
		sessionId: uuid("session_id")
			.notNull()
			.references(() => assessmentSession.id, { onDelete: "cascade" }),
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

/**
 * Relations (Drizzle v2 syntax)
 */

export const relations = defineRelations(
	{
		user,
		session,
		account,
		verification,
		assessmentSession, // Assessment sessions
		assessmentMessage, // Assessment messages
		facetEvidence, // Facet evidence
		publicProfile, // Shareable profile links
	},
	(r) => ({
		user: {
			sessions: r.many.session(), // Better Auth sessions
			accounts: r.many.account(),
			assessmentSession: r.many.assessmentSession(), // Assessment sessions
			assessmentMessage: r.many.assessmentMessage(), // Assessment messages
			publicProfiles: r.many.publicProfile(), // Public profiles
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
			facetEvidence: r.many.facetEvidence(),
		},
		facetEvidence: {
			message: r.one.assessmentMessage({
				from: r.facetEvidence.assessmentMessageId,
				to: r.assessmentMessage.id,
			}),
		},
		publicProfile: {
			session: r.one.assessmentSession({
				from: r.publicProfile.sessionId,
				to: r.assessmentSession.id,
			}),
			user: r.one.user({
				from: r.publicProfile.userId,
				to: r.user.id,
			}),
		},
	}),
);
