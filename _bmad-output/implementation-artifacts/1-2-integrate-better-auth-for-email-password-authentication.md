---
status: ready-for-dev
story_id: "1.2"
epic: 1
created_date: 2026-01-30
blocks: [1-3, 2-1, 4-1]
blocked_by: [1-1]
---

# Story 1.2: Integrate Better Auth for Email/Password Authentication

## Story

As a **User**,
I want **to sign up with email and password (minimum 12 characters)**,
so that **I can create an account and save my assessment results**.

## Acceptance Criteria

### Sign-Up Modal and Validation
**Given** an unauthenticated user
**When** they click "Sign Up" after first assessment message
**Then** a modal appears with email and password fields
**And** password must be 12+ characters with complexity validation (per NIST 2025)
**And** system checks password against compromised credentials database
**And** on success, anonymous session links to new user account

### Sign-In and Session Persistence
**Given** a user is signed up
**When** they sign in with email/password
**Then** session is established with auth token
**And** previous assessments are associated with their account
**And** profile data syncs across devices

### Session Integrity
**Given** a user authenticates
**When** they close and reopen browser
**Then** session persists via HTTP-only cookie
**And** no re-login required within session window

## Business Context

**Why This Story Matters:**
- Enables users to save assessment results persistently
- Links anonymous sessions (pre-signup) to user accounts
- Establishes user identity for privacy controls and sharing
- NIST 2025 password standards ensure modern security

**Blocks Until Complete:**
- Story 1.3 (RPC Contracts) - auth RPC endpoints needed
- Story 2.1 (Session Management) - user_id required for session association
- Story 4.1 (Frontend Auth UI) - modal UI design depends on auth flow

**Depends On:**
- Story 1.1 (Railway Infrastructure) - Better Auth needs database + environment

## Technical Requirements

### Better Auth Library Setup

**Version & Dependencies:**
- `better-auth` >= 1.0.0 (latest from npm)
- `bcryptjs` for password hashing
- `drizzle-orm` adapter for PostgreSQL
- Transport: HTTP cookies with secure, httpOnly flags

**Installation:**
```bash
pnpm add better-auth bcryptjs
# Already in monorepo via pnpm-lock.yaml
```

### Backend Configuration

**File: `apps/api/src/auth.ts`**

Core Better Auth setup with NIST 2025 password validation:

```typescript
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import bcrypt from "bcryptjs";

export const auth = betterAuth({
  database: db,
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,

  emailAndPassword: {
    enabled: true,

    // NIST 2025: Length-based, not complexity-based
    minPasswordLength: 12,
    maxPasswordLength: 128,

    // Industry-standard bcrypt hashing (cost factor: 12)
    password: {
      hash: async (password: string) => {
        return await bcrypt.hash(password, 12);
      },
      verify: async (hash: string, password: string) => {
        return await bcrypt.compare(password, hash);
      },
    },
  },
});
```

### Password Validation Rules (NIST 2025 Standards)

**Minimum Requirements:**
- **Length:** 12 characters minimum (modern approach - length > complexity)
- **Character Composition:** All ASCII + Unicode allowed (no forced uppercase/numbers)
- **Compromised Credential Screening:** Check against HaveIBeenPwned
- **No Mandatory Expiration:** Only reset if breach confirmed
- **No Complexity Rules:** (No uppercase/number/symbol requirements)

**Rationale:** NIST 2025 guidelines prioritize long, memorable passwords over complexity rules that lead to weak passwords like "P@ssw0rd!"

### Compromised Credential Screening Hook

**File: `apps/api/src/auth.ts` (continuation)**

```typescript
import fetch from "node-fetch";
import { createHash } from "crypto";

// Helper: Check password against HaveIBeenPwned API
async function checkCompromisedPassword(password: string): Promise<boolean> {
  try {
    const sha1Hash = createHash("sha1").update(password).digest("hex").toUpperCase();
    const prefix = sha1Hash.slice(0, 5);
    const suffix = sha1Hash.slice(5);

    // HaveIBeenPwned API: send first 5 chars, check if suffix in response
    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);

    if (!response.ok) {
      // If API fails, allow signup (don't block user on external service failure)
      console.warn("HaveIBeenPwned API unavailable, allowing signup");
      return false;
    }

    const text = await response.text();
    return text.includes(suffix);
  } catch (error) {
    console.error("Error checking compromised password:", error);
    return false; // Fail open: allow signup on error
  }
}

// Hook: Before signup validation
auth.onBeforeSignUp(async (context) => {
  const password = context.body.password;

  // Check HaveIBeenPwned
  const isCompromised = await checkCompromisedPassword(password);

  if (isCompromised) {
    throw new Error(
      "This password has appeared in data breaches. Please choose another."
    );
  }

  return context;
});
```

### Anonymous-to-Authenticated Session Linking

**File: `apps/api/src/auth.ts` (continuation)**

```typescript
import { db } from "@workspace/database";

// Hook: Link anonymous session to user account on signup
auth.onAfterSignUp(async (context) => {
  const newUser = context.user;
  const anonymousSessionId = context.body.sessionId; // From frontend

  if (anonymousSessionId) {
    // Link anonymous session → new user account
    await db.sessions.update(
      { id: anonymousSessionId },
      { userId: newUser.id, updatedAt: new Date() }
    );

    console.info(`Linked anonymous session ${anonymousSessionId} to user ${newUser.id}`);
  }

  return context;
});
```

### Environment Variables

**Add to Railway dashboard and `.env.local`:**

```bash
# Better Auth Configuration
BETTER_AUTH_SECRET=your-random-secret-key-min-32-chars
BETTER_AUTH_URL=https://your-railway-backend-url.railway.app
BETTER_AUTH_TRUST_HOST=true

# For local development
BETTER_AUTH_URL=http://localhost:4000
```

**Generate BETTER_AUTH_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Database Tables (Auto-Created by Better Auth)

Better Auth automatically creates these tables with Drizzle adapter:

```sql
-- User accounts
CREATE TABLE "user" (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  emailVerified BOOLEAN DEFAULT false,
  name TEXT,
  image TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP
);

-- Sessions (with user foreign key)
CREATE TABLE "session" (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  expiresAt TIMESTAMP NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES "user"(id) ON DELETE CASCADE
);

-- Accounts (for future OAuth providers)
CREATE TABLE "account" (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  type TEXT NOT NULL,
  provider TEXT NOT NULL,
  FOREIGN KEY (userId) REFERENCES "user"(id) ON DELETE CASCADE
);

-- Verifications (for email verification, password resets)
CREATE TABLE "verification" (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  expiresAt TIMESTAMP NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### RPC Endpoint Integration

**File: `packages/contracts/src/index.ts`**

Define authentication RPC endpoints:

```typescript
import * as S from "@effect/schema/Schema";
import * as Rpc from "@effect/rpc/Rpc";

export const AuthService = Rpc.define({
  signUp: Rpc.rpcFunction({
    input: S.struct({
      email: S.string.pipe(S.minLength(1)),
      password: S.string.pipe(S.minLength(12)),
      anonymousSessionId: S.optional(S.string),
    }),
    output: S.struct({
      user: S.struct({
        id: S.string,
        email: S.string,
      }),
      session: S.struct({
        id: S.string,
        expiresAt: S.date,
      }),
    }),
    failure: S.union(
      S.struct({ _tag: S.literal("InvalidPassword") }),
      S.struct({ _tag: S.literal("EmailAlreadyExists") }),
      S.struct({ _tag: S.literal("PasswordCompromised") })
    ),
  }),

  signIn: Rpc.rpcFunction({
    input: S.struct({
      email: S.string,
      password: S.string,
    }),
    output: S.struct({
      user: S.struct({
        id: S.string,
        email: S.string,
      }),
      session: S.struct({
        id: S.string,
        expiresAt: S.date,
      }),
    }),
    failure: S.union(
      S.struct({ _tag: S.literal("InvalidCredentials") }),
      S.struct({ _tag: S.literal("UserNotFound") })
    ),
  }),

  signOut: Rpc.rpcFunction({
    input: S.struct({}),
    output: S.struct({ success: S.boolean }),
    failure: S.struct({ _tag: S.literal("NotAuthenticated") }),
  }),
});
```

### HTTP Route Setup

**File: `apps/api/src/index.ts`**

Mount Better Auth routes:

```typescript
import express from "express";
import { auth } from "./auth";

const app = express();

// Health check (from Story 1.1)
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Better Auth routes (auto-handles signup, signin, signout)
app.use("/api/auth", auth.handler);

// Your RPC handlers
app.use("/api/rpc", rpcHandler);

app.listen(4000, () => console.log("Backend running on :4000"));
```

### Security Headers

**File: `apps/api/src/middleware/security.ts`**

```typescript
import express from "express";

export function securityHeaders(req: express.Request, res: express.Response, next: express.NextFunction) {
  // HSTS: Enforce HTTPS
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");

  // Prevent MIME type sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");

  // Clickjacking protection
  res.setHeader("X-Frame-Options", "DENY");

  // XSS protection
  res.setHeader("X-XSS-Protection", "1; mode=block");

  // CSP (basic)
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
  );

  next();
}

app.use(securityHeaders);
```

### Cookie Configuration

Better Auth defaults to HTTP-only cookies with secure flags:

```typescript
const auth = betterAuth({
  // ... other config

  sessionConfig: {
    // Automatically set httpOnly, secure (in production)
    // Railway + TLS 1.3 provides HTTPS transport
    cookieName: "big_ocean_session",
    expiresIn: 60 * 60 * 24 * 7, // 7 days
  },
});
```

## Architecture Compliance

**From architecture.md ADR-2 (Authentication & Authorization):**
- ✅ Better Auth for email/password authentication
- ✅ NIST 2025 password validation (12+ chars, compromised check)
- ✅ HTTP-only cookies for session storage
- ✅ TLS 1.3 enforced by Railway
- ✅ Anonymous-to-authenticated session linking
- ✅ Bcrypt (cost factor 12) for password hashing
- ✅ HaveIBeenPwned integration for compromised credentials

**Non-Functional Requirements Met:**
- **NFR3 (Privacy & Security):** All passwords hashed, TLS in transit, no plaintext storage
- **NFR7 (Session Persistence):** HTTP-only cookies survive browser refresh
- **NFR8 (Cost Optimization):** Better Auth uses sessions, no complex key management

## Files and Directory Structure

**Files to Create/Modify:**

```
big-ocean/
├── apps/
│   └── api/
│       ├── src/
│       │   ├── auth.ts                    [CREATE]
│       │   ├── middleware/
│       │   │   └── security.ts            [CREATE]
│       │   └── index.ts                   [MODIFY - add Better Auth routes]
│       └── package.json                   [VERIFY - bcryptjs added]
├── packages/
│   ├── contracts/
│   │   └── src/
│   │       └── index.ts                   [MODIFY - add AuthService RPC]
│   └── database/
│       └── src/
│           └── schema.ts                  [VERIFY - user/session tables already defined]
├── .env.example                            [UPDATE - add BETTER_AUTH_SECRET]
└── .env.local                              [CREATE for local development]
```

**Database Setup:**
- Better Auth auto-creates tables with Drizzle adapter
- Migration via `pnpm -C packages/database drizzle-kit push` (from Story 1.1)

## Dependencies

### NPM Libraries (Add to pnpm-lock.yaml)
```bash
pnpm add better-auth bcryptjs
```

- `better-auth` (>= 1.0.0) - Session/auth library
- `bcryptjs` - Password hashing (cross-platform)
- `drizzle-orm` (already installed) - Database adapter
- `node-fetch` (or use built-in fetch in Node 18+) - HaveIBeenPwned API calls

### External Services
- **HaveIBeenPwned API** - Free, public API for compromised password checking
  - No authentication required
  - Rate limit: ~150 requests/min (plenty for MVP)
  - Privacy: Only sends first 5 chars of SHA1 hash

### Environment & Configuration
- **BETTER_AUTH_SECRET** - Generate via `crypto.randomBytes(32).toString('hex')`
- **Railway PostgreSQL** - From Story 1.1
- **HTTPS/TLS** - Enforced by Railway

## Implementation Checklist

### Phase 1: Backend Auth Setup
- [ ] Install `better-auth` and `bcryptjs`
- [ ] Create `apps/api/src/auth.ts` with Better Auth config
- [ ] Configure password validation (12+ chars, NIST 2025)
- [ ] Implement `checkCompromisedPassword()` hook
- [ ] Implement `onAfterSignUp()` hook for session linking
- [ ] Test locally: POST /api/auth/signup with valid email + password

### Phase 2: Security Hardening
- [ ] Create `apps/api/src/middleware/security.ts` with headers
- [ ] Mount security middleware in Express
- [ ] Verify HTTP-only cookie flags in browser DevTools
- [ ] Test HSTS, X-Frame-Options, CSP headers present

### Phase 3: RPC Integration
- [ ] Define `AuthService` in `packages/contracts`
- [ ] Create RPC handlers for signUp, signIn, signOut
- [ ] Type-safe RPC client available in frontend
- [ ] Test RPC roundtrip: contract → handler → client

### Phase 4: Database Validation
- [ ] Run migrations: `pnpm -C packages/database drizzle-kit push`
- [ ] Verify Better Auth tables created: `psql $DATABASE_URL -c "\dt"`
- [ ] Confirm user, session, account, verification tables exist
- [ ] Test signup flow end-to-end: anonymous session → signup → link

### Phase 5: Local Testing
- [ ] Start backend: `pnpm -C apps/api dev`
- [ ] Signup with valid email + 12+ char password
- [ ] Verify user created in database
- [ ] Verify session linked to user
- [ ] Try compromised password (e.g., "password123456") - should be rejected
- [ ] Sign in with created credentials
- [ ] Verify session persists across requests

### Phase 6: Blocking Stories
- [ ] Update sprint-status.yaml: `1-2-integrate-better-auth: done`
- [ ] Unblock Story 1.3 (RPC Contracts) - auth endpoints ready
- [ ] Unblock Story 2.1 (Session Management) - user_id required for sessions
- [ ] Unblock Story 4.1 (Frontend Auth UI) - auth flow established

## Common Pitfalls to Avoid

❌ **Storing plaintext passwords** - Use bcrypt hash (cost 12+)
❌ **Hardcoding BETTER_AUTH_SECRET** - Use environment variables
❌ **Not checking compromised passwords** - NIST requires screening
❌ **Missing session linking** - Anonymous users must link on signup
❌ **HTTP-only flag disabled** - Keeps cookies from JavaScript XSS access
❌ **Forgetting HSTS header** - Prevents HTTPS downgrade attacks
❌ **Cookie sameSite not set** - Vulnerable to CSRF attacks

## Testing Strategy

### Unit Tests (TDD)

**File: `apps/api/src/auth.test.ts`**

```typescript
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { auth } from "./auth";

describe("Better Auth Integration", () => {
  it("should hash passwords with bcrypt", async () => {
    const password = "ValidPassword123456";
    const hash = await auth.hashPassword(password);

    expect(hash).not.toBe(password);
    expect(hash.length).toBeGreaterThan(20); // bcrypt hash length
  });

  it("should reject passwords < 12 chars", async () => {
    const shortPassword = "Short123";
    // Better Auth should validate and reject
  });

  it("should detect compromised passwords", async () => {
    const compromisedPassword = "password123456";
    // Should throw error via HaveIBeenPwned check
  });

  it("should create user on valid signup", async () => {
    const result = await auth.signUp({
      email: "test@example.com",
      password: "SecurePassword123456",
    });

    expect(result.user).toBeDefined();
    expect(result.user.email).toBe("test@example.com");
  });

  it("should link anonymous session to user", async () => {
    const anonSessionId = "anon-123";
    const signup = await auth.signUp({
      email: "test2@example.com",
      password: "SecurePassword123456",
      anonymousSessionId: anonSessionId,
    });

    // Verify session.userId updated to new user.id
    const session = await db.sessions.findOne({ id: anonSessionId });
    expect(session.userId).toBe(signup.user.id);
  });
});
```

### Integration Tests

```typescript
import { TestContainers, GenericContainer } from "testcontainers";

describe("Better Auth Integration (Real Database)", () => {
  let db;

  beforeAll(async () => {
    // Spin up PostgreSQL container
    const container = await new GenericContainer("postgres:16")
      .withEnvironment("POSTGRES_PASSWORD", "test")
      .start();

    db = await initializeTestDatabase(container);
  });

  it("should persist user after signup", async () => {
    // Test against real PostgreSQL
    const user = await auth.signUp({...});
    const persisted = await db.users.findOne({ id: user.id });
    expect(persisted).toBeDefined();
  });

  afterAll(async () => {
    await container.stop();
  });
});
```

## Dev Notes

### Why NIST 2025 Over Complexity?
Modern NIST guidance (2025) recommends:
- **Length over complexity** - "Correct Horse Battery Staple" > "P@ssw0rd!"
- **No mandatory expiration** - Users create weaker passwords if forced to change
- **No composition rules** - Leads to predictable patterns (uppercase first, number last)
- **Compromised credential check** - More effective than complexity rules

### Why HaveIBeenPwned Over Local Dictionary?
- Covers billions of compromised passwords across breaches
- Updated in real-time as new breaches discovered
- No need to maintain local password dictionary
- API is free, public, and privacy-respecting (only sends hash prefix)

### Why HTTP-Only Cookies?
- JavaScript can't access cookies (protects from XSS theft)
- Browser automatically includes in requests (no manual token handling)
- Session continuation survives page refresh
- Railway + TLS handles transport security

### Why Better Auth Over Custom Solution?
- Production-tested, widely used library
- Drizzle adapter auto-creates & manages schema
- Hooks system for custom validation (compromised passwords)
- Extensible to OAuth (Phase 2)

## Dependencies: Story 1.1 → Story 1.2 → Story 1.3

**Workflow:**
```
Story 1.1: Deploy Infrastructure ✅ (complete)
    ↓
Story 1.2: Better Auth Integration (THIS STORY)
    ↓
Story 1.3: RPC Contracts
    ↓
Story 2.1: Session Management (can start in parallel)
```

## Reference Docs

**Source Documents:**
- [Architecture Decision: Authentication & Authorization](../planning-artifacts/architecture.md#decision-1-authentication--authorization)
- [Better Auth Docs: Basic Usage](https://www.better-auth.com/docs/basic-usage)
- [Better Auth: Email & Password](https://www.better-auth.com/docs/authentication/email-password)
- [Better Auth: Hooks](https://www.better-auth.com/docs/concepts/hooks)
- [NIST 2025 Password Guidelines](https://www.strongdm.com/blog/nist-password-guidelines)
- [HaveIBeenPwned API](https://haveibeenpwned.com/API/v3)

**Related Stories:**
- [Story 1.1: Deploy Infrastructure to Railway](./1-1-deploy-infrastructure-to-railway.md)
- [Story 1.3: Configure Effect-ts RPC Contracts](./1-3-configure-effect-ts-rpc-contracts-and-infrastructure-layer.md)
- [Story 4.1: Authentication UI Sign-Up Modal](./4-1-authentication-ui-sign-up-modal.md)

## Dev Agent Record

### Agent Model Used
Claude Haiku 4.5

### Completion Notes
- Better Auth handles all session lifecycle (create, validate, expire)
- Anonymous session linking is critical for seamless signup UX
- HaveIBeenPwned check prevents most common password breaches
- All passwords hashed with bcrypt cost factor 12 (industry standard)

### Known Issues / Follow-ups
- OAuth (Facebook, Google) deferred to Phase 2
- Email verification deferred to Phase 2
- Two-factor authentication deferred to Phase 2

---

## Next Steps After Completion

1. ✅ **Story Complete** → Update sprint-status.yaml: `1-2-integrate-better-auth: done`
2. ✅ **Unblock Dependencies** → Story 1.3 (RPC Contracts) and Story 2.1 (Session Management)
3. ✅ **Start Story 1.3** → `/bmad-bmm-create-story 1-3` for RPC contract definitions
4. ✅ **Or Parallel Work** → Story 7.1 (Unit Testing) already underway

---

**Status:** ready-for-dev
**Epic:** 1 (Infrastructure & Auth Setup)
**Dependencies:** Story 1.1 (Railway Infrastructure)
**Blocks:** Story 1.3 (RPC Contracts), Story 2.1 (Session Management), Story 4.1 (Frontend Auth)
**Ready for:** Dev Story workflow → `/bmad-bmm-dev-story 1-2-integrate-better-auth-for-email-password-authentication`
