# Public profile row: provisioned at Assessment Finalization only

The **Public profile row (shareable)** (`public_profile`) must exist before any read or share path returns stable identifiers. **Assessment Finalization** (`generate-results` → `ensurePublicProfileForSession`) is the **only** writer that creates that row for a completed **Authenticated Conversation**. `createShareableProfile` (POST share) does **not** create the row: if it is missing after the session is owned, the API fails with `PublicProfileNotProvisioned` (same invariant family as **Completed Assessment Session Read (Me)**). This matches `CONTEXT.md` and avoids two writers (finalization vs share) drifting in production.

**Status:** accepted (2026-04-30)

**Considered options:** (a) finalization-only — chosen; (b) share as repair path for legacy rows — rejected to keep a single seam for provisioning; (c) lazy creation on first share — rejected as it contradicts the read-path contract and `CONTEXT.md`.

**Consequences:** E2E and tests that call share must mirror finalization (e.g. insert `public_profile` or run the full finalization pipeline) before expecting `POST /api/public-profile/share` to succeed.
