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

import { defineRelations } from "drizzle-orm";
import { pgTable, text, timestamp, boolean, index, integer, jsonb } from "drizzle-orm/pg-core";

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
  (table) => [index("session_userId_idx").on(table.userId)]
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
  (table) => [index("account_userId_idx").on(table.userId)]
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
  (table) => [index("verification_identifier_idx").on(table.identifier)]
);

/**
 * Assessment Sessions (plural - different from Better Auth "session")
 *
 * Tracks personality assessment conversation sessions.
 * Sessions can be anonymous (userId NULL) or linked to authenticated users.
 */
export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(), // Format: session_{timestamp}_{nanoid}
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }), // NULL for anonymous
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
    index("sessions_user_id_idx").on(table.userId),
  ]
);

/**
 * Messages in Assessment Sessions
 *
 * Stores conversation history for each assessment session.
 * Links to user if message was sent by authenticated user (NULL for anonymous or assistant messages).
 */
export const messages = pgTable(
  "messages",
  {
    id: text("id").primaryKey(), // Format: msg_{nanoid}
    sessionId: text("session_id")
      .notNull()
      .references(() => sessions.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }), // User who sent message (NULL for assistant or anonymous)
    role: text("role").notNull(), // 'user' | 'assistant'
    content: text("content").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    // CRITICAL for <1 second resume: composite index on (sessionId, createdAt)
    // Allows efficient retrieval of all messages for a session in chronological order
    index("messages_session_created_idx").on(table.sessionId, table.createdAt),
  ]
);

/**
 * Relations (Drizzle v2 syntax)
 */

// Create schema object for relations
const authSchema = {
  user,
  session,
  account,
  verification,
  sessions, // Assessment sessions
  messages, // Assessment messages
};

export const relations = defineRelations(authSchema, (r) => ({
  user: {
    sessions: r.many.session(), // Better Auth sessions
    accounts: r.many.account(),
    assessmentSessions: r.many.sessions(), // Assessment sessions
    messages: r.many.messages(), // Messages sent by user
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
  sessions: {
    user: r.one.user({
      from: r.sessions.userId,
      to: r.user.id,
    }),
    messages: r.many.messages(),
  },
  messages: {
    session: r.one.sessions({
      from: r.messages.sessionId,
      to: r.sessions.id,
    }),
    user: r.one.user({
      from: r.messages.userId,
      to: r.user.id,
    }),
  },
}));
