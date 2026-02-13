# Data Models

This document describes the database schema for the big-ocean psychological profiling platform.

## Overview

The schema is divided into two logical groups:

1. **Better Auth Tables** (4 tables) - Authentication and session management
2. **Assessment Tables** (4 tables) - Personality assessment data

**ORM:** Drizzle ORM
**Database:** PostgreSQL
**Schema Location:** `packages/infrastructure/src/db/drizzle/schema.ts`
**Migrations:** `drizzle/` directory (drizzle-kit managed)
**Config:** `drizzle.config.ts` (excludes LangGraph `checkpoint_*` tables via `tablesFilter`)

## ER Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              BETTER AUTH                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐       ┌─────────────┐       ┌─────────────────┐            │
│  │   session   │       │    user     │       │   verification  │            │
│  ├─────────────┤       ├─────────────┤       ├─────────────────┤            │
│  │ id (PK)     │  N:1  │ id (PK)     │       │ id (PK)         │            │
│  │ user_id (FK)├──────►│ name        │       │ identifier      │            │
│  │ token       │       │ email       │       │ value           │            │
│  │ expires_at  │       │ image       │       │ expires_at      │            │
│  └─────────────┘       │ created_at  │       └─────────────────┘            │
│                        │ updated_at  │                                       │
│  ┌─────────────┐       └──────┬──────┘                                       │
│  │   account   │              │                                              │
│  ├─────────────┤              │                                              │
│  │ id (PK)     │       N:1    │                                              │
│  │ user_id (FK)├──────────────┘                                              │
│  │ provider_id │                                                             │
│  │ account_id  │                                                             │
│  └─────────────┘                                                             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                              ASSESSMENT                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                        ┌─────────────┐                                       │
│                        │    user     │                                       │
│                        └──────┬──────┘                                       │
│                               │ 1:N (nullable)                               │
│                               ▼                                              │
│  ┌───────────────────────────────────────────────────────┐                   │
│  │              assessment_session                        │                   │
│  ├───────────────────────────────────────────────────────┤                   │
│  │ id (PK)        status          message_count          │                   │
│  │ user_id (FK)   created_at      updated_at             │                   │
│  └───────────────────────┬───────────────────────────────┘                   │
│                          │                                                   │
│          ┌───────────────┼───────────────┐                                   │
│          │ 1:N           │               │ 1:N                               │
│          ▼               │               ▼                                   │
│  ┌───────────────┐       │       ┌───────────────┐                           │
│  │ public_profile│       │       │assessment_msg │                           │
│  ├───────────────┤       │       ├───────────────┤                           │
│  │ id (PK)       │       │       │ id (PK)       │                           │
│  │ session_id(FK)│       │       │ session_id(FK)│                           │
│  │ ocean_code_5  │       │       │ role          │                           │
│  │ ocean_code_4  │       │       │ content       │                           │
│  │ is_public     │       │       └───────┬───────┘                           │
│  │ view_count    │       │               │ 1:N                               │
│  └───────────────┘       │               ▼                                   │
│                          │       ┌───────────────┐                           │
│                          │       │ facet_evidence│                           │
│                          │       ├───────────────┤                           │
│                          │       │ id (PK)       │                           │
│                          │       │ message_id(FK)│                           │
│                          │       │ facet_name    │                           │
│                          │       │ score         │                           │
│                          │       │ confidence    │                           │
│                          │       │ quote         │                           │
│                          │       └───────────────┘                           │
│                          │                                                   │
└──────────────────────────┴───────────────────────────────────────────────────┘
```

## Table Definitions

### Better Auth Tables

#### 1. user

Core user account table for Better Auth.

```sql
CREATE TABLE "user" (
    id              TEXT PRIMARY KEY,
    name            TEXT NOT NULL,
    email           TEXT NOT NULL UNIQUE,
    email_verified  BOOLEAN NOT NULL DEFAULT false,
    image           TEXT,
    created_at      TIMESTAMP NOT NULL DEFAULT now(),
    updated_at      TIMESTAMP NOT NULL DEFAULT now()
);
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | TEXT | PRIMARY KEY | Better Auth generated ID |
| `name` | TEXT | NOT NULL | Display name |
| `email` | TEXT | NOT NULL, UNIQUE | Email address |
| `email_verified` | BOOLEAN | NOT NULL, DEFAULT false | Email verification status |
| `image` | TEXT | nullable | Profile image URL |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT now() | Creation timestamp |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT now() | Last update timestamp (auto-updated) |

---

#### 2. session

Active authentication sessions managed by Better Auth.

```sql
CREATE TABLE "session" (
    id          TEXT PRIMARY KEY,
    expires_at  TIMESTAMP NOT NULL,
    token       TEXT NOT NULL UNIQUE,
    created_at  TIMESTAMP NOT NULL DEFAULT now(),
    updated_at  TIMESTAMP NOT NULL DEFAULT now(),
    ip_address  TEXT,
    user_agent  TEXT,
    user_id     TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
);

CREATE INDEX session_userId_idx ON "session" (user_id);
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | TEXT | PRIMARY KEY | Session identifier |
| `expires_at` | TIMESTAMP | NOT NULL | Session expiration time |
| `token` | TEXT | NOT NULL, UNIQUE | Session token for authentication |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT now() | Creation timestamp |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT now() | Last update timestamp |
| `ip_address` | TEXT | nullable | Client IP address |
| `user_agent` | TEXT | nullable | Client user agent string |
| `user_id` | TEXT | NOT NULL, FK | References `user(id)` with CASCADE delete |

**Indexes:**
- `session_userId_idx` on `user_id` - Quick session lookup by user

---

#### 3. account

OAuth and provider accounts linked to users.

```sql
CREATE TABLE "account" (
    id                          TEXT PRIMARY KEY,
    account_id                  TEXT NOT NULL,
    provider_id                 TEXT NOT NULL,
    user_id                     TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    access_token                TEXT,
    refresh_token               TEXT,
    id_token                    TEXT,
    access_token_expires_at     TIMESTAMP,
    refresh_token_expires_at    TIMESTAMP,
    scope                       TEXT,
    password                    TEXT,
    created_at                  TIMESTAMP NOT NULL DEFAULT now(),
    updated_at                  TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX account_userId_idx ON "account" (user_id);
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | TEXT | PRIMARY KEY | Account identifier |
| `account_id` | TEXT | NOT NULL | Provider-specific account ID |
| `provider_id` | TEXT | NOT NULL | OAuth provider identifier |
| `user_id` | TEXT | NOT NULL, FK | References `user(id)` with CASCADE delete |
| `access_token` | TEXT | nullable | OAuth access token |
| `refresh_token` | TEXT | nullable | OAuth refresh token |
| `id_token` | TEXT | nullable | OAuth ID token |
| `access_token_expires_at` | TIMESTAMP | nullable | Access token expiration |
| `refresh_token_expires_at` | TIMESTAMP | nullable | Refresh token expiration |
| `scope` | TEXT | nullable | OAuth scopes |
| `password` | TEXT | nullable | Hashed password for credential auth |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT now() | Creation timestamp |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT now() | Last update timestamp |

**Indexes:**
- `account_userId_idx` on `user_id` - Quick account lookup by user

---

#### 4. verification

Email verification and password reset tokens.

```sql
CREATE TABLE "verification" (
    id          TEXT PRIMARY KEY,
    identifier  TEXT NOT NULL,
    value       TEXT NOT NULL,
    expires_at  TIMESTAMP NOT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT now(),
    updated_at  TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX verification_identifier_idx ON "verification" (identifier);
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | TEXT | PRIMARY KEY | Verification record identifier |
| `identifier` | TEXT | NOT NULL | Email or other identifier |
| `value` | TEXT | NOT NULL | Verification token value |
| `expires_at` | TIMESTAMP | NOT NULL | Token expiration time |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT now() | Creation timestamp |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT now() | Last update timestamp |

**Indexes:**
- `verification_identifier_idx` on `identifier` - Quick lookup by email/identifier

---

### Assessment Tables

#### 5. assessment_session

Tracks personality assessment conversation sessions.

```sql
CREATE TABLE "assessment_session" (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         TEXT REFERENCES "user"(id) ON DELETE SET NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT now(),
    updated_at      TIMESTAMP NOT NULL DEFAULT now(),
    status          TEXT NOT NULL DEFAULT 'active',
    message_count   INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX assessment_session_user_id_idx ON "assessment_session" (user_id);
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Session identifier |
| `user_id` | TEXT | FK, nullable | References `user(id)` with SET NULL delete (allows anonymous) |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT now() | Creation timestamp |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT now() | Last update timestamp |
| `status` | TEXT | NOT NULL, DEFAULT 'active' | Session status: `'active'`, `'paused'`, `'completed'` |
| `message_count` | INTEGER | NOT NULL, DEFAULT 0 | Total messages in session |

**Indexes:**
- `assessment_session_user_id_idx` on `user_id` - Quick session lookup by user

**Notes:**
- `user_id` is nullable to support anonymous assessments
- Sessions can be linked to a user after authentication

---

#### 6. assessment_message

Stores conversation history for each assessment session.

```sql
CREATE TABLE "assessment_message" (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id  UUID NOT NULL REFERENCES "assessment_session"(id) ON DELETE CASCADE,
    user_id     TEXT REFERENCES "user"(id) ON DELETE SET NULL,
    role        TEXT NOT NULL,
    content     TEXT NOT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX assessment_message_session_created_idx
    ON "assessment_message" (session_id, created_at);
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Message identifier |
| `session_id` | UUID | NOT NULL, FK | References `assessment_session(id)` with CASCADE delete |
| `user_id` | TEXT | FK, nullable | References `user(id)` with SET NULL delete |
| `role` | TEXT | NOT NULL | Message role: `'user'` or `'assistant'` |
| `content` | TEXT | NOT NULL | Message text content |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT now() | Creation timestamp |

**Indexes:**
- `assessment_message_session_created_idx` on `(session_id, created_at)` - **CRITICAL** composite index for sub-second session resume

**Performance Note:**
The composite index on `(session_id, created_at)` is essential for achieving <1 second resume times. It enables efficient retrieval of all messages for a session in chronological order.

---

#### 7. facet_evidence

Stores raw facet signals detected by the Analyzer from each message.

```sql
CREATE TABLE "facet_evidence" (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_message_id   UUID NOT NULL REFERENCES "assessment_message"(id) ON DELETE CASCADE,
    facet_name              TEXT NOT NULL,
    score                   INTEGER NOT NULL,
    confidence              INTEGER NOT NULL,
    quote                   TEXT NOT NULL,
    highlight_start         INTEGER NOT NULL,
    highlight_end           INTEGER NOT NULL,
    created_at              TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX facet_evidence_assessment_message_id_idx
    ON "facet_evidence" (assessment_message_id);
CREATE INDEX facet_evidence_facet_name_idx
    ON "facet_evidence" (facet_name);
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Evidence identifier |
| `assessment_message_id` | UUID | NOT NULL, FK | References `assessment_message(id)` with CASCADE delete |
| `facet_name` | TEXT | NOT NULL | Facet identifier (e.g., `"imagination"`, `"altruism"`) |
| `score` | INTEGER | NOT NULL | Analyzer's score for this message (0-20) |
| `confidence` | INTEGER | NOT NULL | Confidence level (0-100, stored as integer) |
| `quote` | TEXT | NOT NULL | Exact phrase from message supporting the score |
| `highlight_start` | INTEGER | NOT NULL | Character index where quote starts |
| `highlight_end` | INTEGER | NOT NULL | Character index where quote ends |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT now() | Creation timestamp |

**Indexes:**
- `facet_evidence_assessment_message_id_idx` on `assessment_message_id` - Retrieve evidence by message
- `facet_evidence_facet_name_idx` on `facet_name` - Retrieve all evidence for a specific facet

**Scoring Notes:**
- The 30 Big Five facets are scored 0-20 per evidence record
- Confidence is stored as integer 0-100 (divide by 100 for decimal)
- Final scores are computed on-demand from evidence using recency-weighted averaging

---

#### 8. public_profile

Shareable personality profile links generated from completed assessments.

```sql
CREATE TABLE "public_profile" (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id      UUID NOT NULL REFERENCES "assessment_session"(id) ON DELETE CASCADE,
    user_id         TEXT REFERENCES "user"(id) ON DELETE SET NULL,
    ocean_code_5    TEXT NOT NULL,
    ocean_code_4    TEXT NOT NULL,
    is_public       BOOLEAN NOT NULL DEFAULT false,
    view_count      INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMP NOT NULL DEFAULT now(),
    updated_at      TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX public_profile_session_id_idx ON "public_profile" (session_id);
CREATE INDEX public_profile_user_id_idx ON "public_profile" (user_id);
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Profile identifier (used in share URLs) |
| `session_id` | UUID | NOT NULL, FK | References `assessment_session(id)` with CASCADE delete |
| `user_id` | TEXT | FK, nullable | References `user(id)` with SET NULL delete |
| `ocean_code_5` | TEXT | NOT NULL | 5-letter OCEAN code (e.g., `"HHMHM"`) |
| `ocean_code_4` | TEXT | NOT NULL | 4-level OCEAN code variant |
| `is_public` | BOOLEAN | NOT NULL, DEFAULT false | Whether profile is publicly discoverable |
| `view_count` | INTEGER | NOT NULL, DEFAULT 0 | Number of times profile has been viewed |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT now() | Creation timestamp |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT now() | Last update timestamp |

**Indexes:**
- `public_profile_session_id_idx` on `session_id` - Quick lookup by assessment session
- `public_profile_user_id_idx` on `user_id` - Quick lookup by user

**Privacy Notes:**
- Profiles are **private by default** (`is_public = false`)
- Users must explicitly toggle `is_public` to enable discovery
- Profile `id` can be shared as a direct link regardless of `is_public` status

---

## Relationships Summary

### One-to-Many Relationships

| Parent Table | Child Table | Foreign Key | On Delete |
|--------------|-------------|-------------|-----------|
| `user` | `session` | `user_id` | CASCADE |
| `user` | `account` | `user_id` | CASCADE |
| `user` | `assessment_session` | `user_id` | SET NULL |
| `user` | `assessment_message` | `user_id` | SET NULL |
| `user` | `public_profile` | `user_id` | SET NULL |
| `assessment_session` | `assessment_message` | `session_id` | CASCADE |
| `assessment_session` | `public_profile` | `session_id` | CASCADE |
| `assessment_message` | `facet_evidence` | `assessment_message_id` | CASCADE |

### Cascade Delete Behavior

- Deleting a `user` cascades to their `session` and `account` records
- Deleting a `user` sets `user_id` to NULL in assessment tables (preserves anonymous data)
- Deleting an `assessment_session` cascades to all messages, evidence, and profiles
- Deleting an `assessment_message` cascades to all associated facet evidence

---

## Index Summary

| Table | Index Name | Columns | Purpose |
|-------|------------|---------|---------|
| `session` | `session_userId_idx` | `user_id` | User session lookup |
| `account` | `account_userId_idx` | `user_id` | User account lookup |
| `verification` | `verification_identifier_idx` | `identifier` | Token lookup by email |
| `assessment_session` | `assessment_session_user_id_idx` | `user_id` | User's assessments |
| `assessment_message` | `assessment_message_session_created_idx` | `session_id, created_at` | **Critical for <1s resume** |
| `facet_evidence` | `facet_evidence_assessment_message_id_idx` | `assessment_message_id` | Evidence by message |
| `facet_evidence` | `facet_evidence_facet_name_idx` | `facet_name` | Evidence by facet type |
| `public_profile` | `public_profile_session_id_idx` | `session_id` | Profile by assessment |
| `public_profile` | `public_profile_user_id_idx` | `user_id` | Profile by user |

---

## Redis Key Patterns

Redis is used for ephemeral rate limiting and cost tracking data.

### Cost Tracking

```
Key:     cost:{userId}:{YYYY-MM-DD}
Value:   Integer (cents)
TTL:     48 hours
Example: cost:user_abc123:2026-02-12 → 4523
```

Tracks daily LLM API costs per user. Resets automatically via TTL expiration at midnight UTC.

### Rate Limiting

```
Key:     assessments:{userId}:{YYYY-MM-DD}
Value:   Integer (count)
TTL:     48 hours
Example: assessments:user_abc123:2026-02-12 → 1
```

Tracks daily assessment starts per user. Users are limited to 1 new assessment per day (unlimited message resumption).

### Key Design Rationale

- **48-hour TTL**: Ensures keys persist across timezone edge cases while eventually expiring
- **Date-based keys**: Natural daily reset without scheduled jobs
- **User-scoped**: Supports per-user budget and rate limiting
- **Cents as integers**: Avoids floating-point precision issues

---

## Migration Strategy

### Migration Files

Migrations are managed by `drizzle-kit` and stored in the `drizzle/` directory:

```
drizzle/
  20260207225751_initial-schema/     # Initial tables
  20260209144243_heavy_molecule_man/ # Schema updates
  20260209153226_blushing_mister_fear/
  20260210230152_lame_kate_bishop/   # Latest migration
```

### Commands

```bash
# Generate migration from schema changes
pnpm db:generate

# Apply pending migrations
pnpm db:migrate

# Push schema directly (development only)
pnpm db:push
```

### Docker Startup

Migrations run automatically on backend startup via `docker-entrypoint.sh`:

```bash
# In apps/api/docker-entrypoint.sh
pnpm db:migrate
exec node dist/index.js
```

### Configuration

The `drizzle.config.ts` at repository root configures migration behavior:

```typescript
export default defineConfig({
  schema: "./packages/infrastructure/src/db/drizzle/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  tablesFilter: ["!checkpoint_*"], // Exclude LangGraph tables
});
```

**Note:** The `tablesFilter` excludes LangGraph's `checkpoint_*` tables, which are managed separately by the LangGraph PostgresSaver.

---

## Big Five Framework Reference

The `facet_evidence.facet_name` column stores one of 30 facet identifiers organized under 5 traits:

| Trait | Facets |
|-------|--------|
| **Openness** | imagination, artistic_interests, emotionality, adventurousness, intellect, liberalism |
| **Conscientiousness** | self_efficacy, orderliness, dutifulness, achievement_striving, self_discipline, cautiousness |
| **Extraversion** | friendliness, gregariousness, assertiveness, activity_level, excitement_seeking, cheerfulness |
| **Agreeableness** | trust, morality, altruism, cooperation, modesty, sympathy |
| **Neuroticism** | anxiety, anger, depression, self_consciousness, immoderation, vulnerability |

These constants are defined in `packages/domain/src/constants/big-five.ts`.
