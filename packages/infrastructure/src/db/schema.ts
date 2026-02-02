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
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const user = pgTable("user", {
	id: uuid("id")
		.primaryKey()
		.default(sql`gen_random_uuid()`),
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
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: uuid("user_id")
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
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
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
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`), // Format: session_{timestamp}_{nanoid}
    userId: uuid("user_id").references(() => user.id, { onDelete: "set null" }), // NULL for anonymous
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    status: text("status").notNull().default("active"), // 'active' | 'paused' | 'completed'
    precision: jsonb("precision").notNull(), // PrecisionScores object
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
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`), // Format: msg_{nanoid}
    sessionId: uuid("session_id")
      .notNull()
      .references(() => assessmentSession.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => user.id, { onDelete: "set null" }), // User who sent message (NULL for assistant or anonymous)
    role: text("role").notNull(), // 'user' | 'assistant'
    content: text("content").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    // CRITICAL for <1 second resume: composite index on (sessionId, createdAt)
    // Allows efficient retrieval of all messages for a session in chronological order
    index("assessment_message_session_created_idx").on(
      table.sessionId,
      table.createdAt,
    ),
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
		id: uuid("id")
			.primaryKey()
			.default(sql`gen_random_uuid()`),
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
 * Facet Scores (Aggregated from Evidence)
 *
 * Stores aggregated facet scores computed from multiple FacetEvidence records.
 * Updated every 3 messages with weighted averaging and contradiction detection.
 */
export const facetScores = pgTable(
	"facet_scores",
	{
		id: uuid("id")
			.primaryKey()
			.default(sql`gen_random_uuid()`),
		sessionId: uuid("session_id")
			.notNull()
			.references(() => assessmentSession.id, { onDelete: "cascade" }),
		facetName: text("facet_name").notNull(), // Clean name
		score: integer("score").notNull().default(0), // 0-20 aggregated from evidence (0 = no data)
		confidence: integer("confidence").notNull().default(0), // 0-100 (0 = no evidence yet)
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		// Index for retrieving all facet scores for a session
		index("facet_scores_session_id_idx").on(table.sessionId),
		// Index for querying specific facet across sessions
		index("facet_scores_facet_name_idx").on(table.facetName),
		// Unique constraint: one score per (session, facet) pair
		index("facet_scores_session_facet_unique_idx").on(
			table.sessionId,
			table.facetName,
		),
	],
);

/**
 * Trait Scores (Derived from Facet Scores)
 *
 * Stores Big Five trait scores derived from aggregated facet scores.
 * Each trait is the mean of 6 related facets.
 */
export const traitScores = pgTable(
	"trait_scores",
	{
		id: uuid("id")
			.primaryKey()
			.default(sql`gen_random_uuid()`),
		sessionId: uuid("session_id")
			.notNull()
			.references(() => assessmentSession.id, { onDelete: "cascade" }),
		traitName: text("trait_name").notNull(), // "openness", "conscientiousness", etc.
		score: integer("score").notNull().default(0), // 0-20 mean of facet scores (0 = no data)
		confidence: integer("confidence").notNull().default(0), // 0-100 (0 = no evidence yet)
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		// Index for retrieving all trait scores for a session
		index("trait_scores_session_id_idx").on(table.sessionId),
		// Index for querying specific trait across sessions
		index("trait_scores_trait_name_idx").on(table.traitName),
		// Unique constraint: one score per (session, trait) pair
		index("trait_scores_session_trait_unique_idx").on(
			table.sessionId,
			table.traitName,
		),
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
		facetScores, // Aggregated facet scores
		traitScores, // Trait scores
	},
	(r) => ({
		user: {
			sessions: r.many.session(), // Better Auth sessions
			accounts: r.many.account(),
			assessmentSession: r.many.assessmentSession(), // Assessment sessions
			assessmentMessage: r.many.assessmentMessage(), // Assessment messages
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
			facetScores: r.many.facetScores(),
			traitScores: r.many.traitScores(),
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
		facetScores: {
			session: r.one.assessmentSession({
				from: r.facetScores.sessionId,
				to: r.assessmentSession.id,
			}),
		},
		traitScores: {
			session: r.one.assessmentSession({
				from: r.traitScores.sessionId,
				to: r.assessmentSession.id,
			}),
		},
	}),
);
