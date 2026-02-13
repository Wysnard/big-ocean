# Epic 6: Privacy & Data Management

**Phase:** 2 (EU Launch + GDPR Compliance)

**Goal:** Implement encryption at rest, GDPR compliance, and comprehensive audit logging.

**Dependencies:**
- Epic 1 (infrastructure in place)
- Epics 2-5 (data models + assessment/sharing flows defined)
- Phase 1 MVP completion (US launch validated)

**Enables:** EU market expansion + comprehensive privacy compliance

**Note:** Cross-cutting concern — basic privacy is covered in Phase 1 via Epics 1, 4, 5 (TLS, Better Auth, default-private profiles). Epic 6 provides comprehensive GDPR compliance (encryption at rest, data deletion/portability, audit logging) needed for EU launch in Phase 2.

**Phase 1 Privacy Coverage:**
- ✅ TLS 1.3 encryption in transit (Epic 1)
- ✅ Better Auth password security (Epic 1)
- ✅ Default-private profiles (Epic 5)
- ✅ Explicit sharing controls (Epic 5)
- ✅ PostgreSQL RLS for data access control (Epic 2)

**Phase 2 Additions (Epic 6):**
- 🔒 AES-256-GCM encryption at rest (Story 6.1)
- 🌍 GDPR data deletion/portability (Story 6.2)
- 📋 Comprehensive audit logging (Story 6.3)

**Critical:** Not required for US-only MVP (Phase 1). Must be complete before EU launch (Phase 2).

**User Value:** Users trust that their data is secure, and EU users have full GDPR rights

## Story 6.1: Server-Side Encryption at Rest and TLS in Transit (TDD)

As a **Security Engineer**,
I want **all user conversation data, facet evidence, and assessment scores encrypted at rest in the database and encrypted in transit**,
So that **users trust the platform with personal assessment data and network eavesdropping is prevented**.

**Acceptance Criteria:**

**TEST-FIRST (Red Phase):**
**Given** tests are written for encryption and transit security
**When** I run `pnpm test encryption.test.ts`
**Then** tests fail (red) because encryption implementation doesn't exist
**And** each test defines expected behavior:
  - Test: Conversation data encrypted with AES-256-GCM at rest
  - Test: Facet evidence (quotes, scores) encrypted with AES-256-GCM at rest
  - Test: Assessment scores (facet/trait) encrypted at rest
  - Test: Encryption key derived from master secret (not user password)
  - Test: Database stores only encrypted ciphertext, no plaintext
  - Test: Decryption works for authorized backend services
  - Test: TLS 1.3 enforced on all API endpoints
  - Test: Security headers present (HSTS, X-Content-Type-Options, X-Frame-Options)

**IMPLEMENTATION (Green Phase):**
**Given** user conversation and assessment data is stored
**When** it's written to database
**Then** all sensitive data is encrypted using AES-256-GCM:
  - Conversation messages (assessment_messages.content)
  - Facet evidence quotes (facet_evidence.quote)
  - User profile data
**And** encryption key is derived from master secret (stored securely in Railway environment)
**And** encrypted data stored in PostgreSQL tables (assessment_messages, facet_evidence, sessions)
**And** backend services can decrypt for authorized access
**And** encryption tests pass (green)

**Given** data is in transit
**When** API requests sent between frontend and backend
**Then** all requests use TLS 1.3 (enforced by Railway + backend config)
**And** HTTP headers include:
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains`
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `X-XSS-Protection: 1; mode=block`
**And** TLS/header tests pass

**Technical Details:**

- **TDD Workflow**: Tests written first (verify encryption properties), implementation follows
- Database encryption: AES-256-GCM via `node:crypto` or `libsodium`
- Key derivation: Master secret from environment variable (Railway secure config)
- No per-user keys (would require key management complexity)
- Encryption happens on server before database write
- Decryption happens on server when data retrieved
- TLS 1.3: Enforced by Railway + backend middleware
- Security headers: Middleware adds to all responses
- No encryption on frontend (complexity not needed)
- No ElectricSQL (avoided key management nightmare)

**Acceptance Checklist:**
- [ ] Failing tests written first covering encryption/TLS scenarios (red phase)
- [ ] Tests verify AES-256-GCM encryption
- [ ] Tests verify facet evidence encryption (quotes)
- [ ] Tests verify assessment score encryption
- [ ] Tests verify master key management
- [ ] Tests verify encrypted storage in database
- [ ] Tests verify TLS 1.3 enforcement
- [ ] Tests verify all security headers present
- [ ] Implementation passes all tests (green phase)
- [ ] Conversation data encrypted before database storage
- [ ] Facet evidence quotes encrypted in facet_evidence table
- [ ] Assessment scores encrypted in facet_scores/trait_scores tables
- [ ] Master key stored securely in Railway env vars
- [ ] TLS 1.3 enforced on all API endpoints
- [ ] All security headers configured
- [ ] Decryption works for authorized backend services
- [ ] No plaintext conversation or evidence data stored
- [ ] 100% unit test coverage for encryption module

---

## Story 6.2: GDPR Compliance (Data Deletion & Portability, TDD)

As a **User**,
I want **to request my data be deleted or downloaded in a standard format**,
So that **I have control over my personal information** (GDPR Article 17, 20).

**Acceptance Criteria:**

**TEST-FIRST (Red Phase):**
**Given** tests are written for GDPR data operations
**When** I run `pnpm test gdpr-compliance.test.ts`
**Then** tests fail (red) because GDPR endpoints don't exist
**And** each test defines expected behavior:
  - Test: Data export returns valid JSON with all user data
  - Test: Export includes all assessments, conversations, archetypes, facet evidence
  - Test: Export includes all facet/trait scores with timestamps
  - Test: Account deletion removes all data including evidence (30-day soft delete)
  - Test: Deleted data is unrecoverable after 30 days
  - Test: Audit log records all deletion events

**IMPLEMENTATION (Green Phase):**
**Given** I want to delete my account
**When** I go to Settings → Delete Account
**Then** I see warning: "This will permanently delete your profile and conversation data"
**And** after confirmation, all data is erased (30-day retention for backups)
**And** deletion tests pass (green)

**Given** I want to download my data
**When** I click "Download My Data"
**Then** a JSON file is generated with:
  - Profile info (email, signup date)
  - All assessments (results, OCEAN codes, facet/trait scores)
  - Full conversation transcripts with timestamps
  - Facet evidence (all quotes, scores, confidence ratings)
  - Archetype history
**And** file is downloadable immediately
**And** export tests pass

**Technical Details:**

- **TDD Workflow**: Tests written first (define GDPR contracts), implementation follows
- Delete endpoint: `DELETE /api/user/me` (authenticated)
- Data export endpoint: `GET /api/user/me/export` (returns JSON)
- 30-day soft delete before permanent erasure
- Audit log: record all deletions
- Unit test coverage: 100% of GDPR operations

**Acceptance Checklist:**
- [ ] Failing tests written first covering delete & export scenarios (red phase)
- [ ] Tests verify export JSON structure and completeness
- [ ] Tests verify facet evidence included in export
- [ ] Tests verify soft-delete removes evidence data
- [ ] Tests verify audit logging on deletion
- [ ] Implementation passes all tests (green phase)
- [ ] Delete account removes all user data (messages, evidence, scores)
- [ ] Data export includes all assessments with facet evidence
- [ ] Export includes conversation transcripts with evidence quotes
- [ ] Export includes facet/trait scores with timestamps
- [ ] Export is valid JSON
- [ ] 30-day retention enforced
- [ ] Audit log records deletions
- [ ] 100% unit test coverage for GDPR compliance

---

## Story 6.3: Audit Logging and Access Control (TDD)

As a **Security Team**,
I want **to log all access to user profiles and data**,
So that **we can audit who accessed what data and when**.

**Acceptance Criteria:**

**TEST-FIRST (Red Phase):**
**Given** tests are written for audit logging
**When** I run `pnpm test audit-logger.test.ts`
**Then** tests fail (red) because audit logging doesn't exist
**And** each test defines expected behavior:
  - Test: Profile access creates audit log entry
  - Test: Log includes user ID, viewer ID, action, timestamp, IP
  - Test: Anonymous access logged as "anonymous" viewer
  - Test: Admin audit query returns all events for user
  - Test: Audit logs retained for 1 year

**IMPLEMENTATION (Green Phase):**
**Given** a user's profile is viewed
**When** someone accesses it (user viewing their own, or shared link viewed)
**Then** an audit log entry is created with:
  - User ID being accessed
  - Viewer ID (if authenticated, or "anonymous" if shared link)
  - Timestamp
  - IP address
  - Action (view, download, delete)
**And** audit logging tests pass (green)

**Given** I query the audit logs
**When** I run `GET /api/admin/audit-logs?userId={userId}`
**Then** all access events are returned with full details
**And** query tests pass

**Technical Details:**

- **TDD Workflow**: Tests written first (define audit contracts), implementation follows
- Audit table: `id, userId, viewerId, action, timestamp, ipAddress, userAgent`
- Middleware: Log all profile access
- Sensitive: Don't expose audit logs to non-admin users
- Retention: 1 year minimum (GDPR compliance)
- Pino logger: Output to structured logs for cloud monitoring
- Unit test coverage: 100% of audit logging logic

**Acceptance Checklist:**
- [ ] Failing tests written first covering all audit scenarios (red phase)
- [ ] Tests verify log entry creation on access
- [ ] Tests verify data completeness (IP, user agent, timestamp)
- [ ] Tests verify admin query access control
- [ ] Tests verify retention enforcement
- [ ] Implementation passes all tests (green phase)
- [ ] Audit log table created
- [ ] All access logged (view, download, delete)
- [ ] Audit log queryable by admin
- [ ] IP + user agent logged
- [ ] 1-year retention enforced
- [ ] 100% unit test coverage for audit logging

---
