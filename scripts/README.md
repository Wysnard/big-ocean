# Development Scripts

Quick reference for development and testing scripts.

## Database Seeding

### Seed Completed Conversation

Quickly populate your database with a realistic completed conversation for manual testing of the results page.

**Prerequisites:**
- Database must be running (start with `pnpm dev` or `docker compose up -d postgres`)

```bash
# Start the dev environment (if not already running)
pnpm dev

# In another terminal, run the seed script
pnpm seed:test-conversation
```

**What it creates:**
- Test user (see credentials in `scripts/seed-completed-conversation.ts`)
- Completed conversation session with realistic personality profile
- 12-message conversation (Nerin + User)
- 30 facet scores with high confidence (85%)
- 5 trait scores derived from facets
- ~40 facet evidence records with text highlights

**Profile characteristics:**
- High Openness (intellectually curious, imaginative)
- High Conscientiousness (organized, disciplined)
- Low Extraversion (introverted, prefers deep conversations)
- Medium Agreeableness (helpful but analytical)
- Medium Neuroticism (moderate emotional stability)

**Output:**
The script prints a session ID that you can use to navigate directly to:
- Results page: `http://localhost:3000/assessment/{sessionId}/results`
- Resume chat: `http://localhost:3000/assessment/{sessionId}`

**Example output:**
```
✨ Seed completed successfully!

============================================================
SESSION DETAILS
============================================================
Session ID: 550e8400-e29b-41d4-a716-446655440000
User: (see seed script for credentials)
Status: completed
Messages: 12
Facet Scores: 30
Trait Scores: 5
Evidence Records: 42
============================================================

🔗 Quick Test URLs:
   Results Page: http://localhost:3000/assessment/550e8400.../results
   Resume Chat:  http://localhost:3000/assessment/550e8400...
```

**Use cases:**
- Manual UI testing of the results page without running full conversations
- Frontend development iteration speed
- Screenshot/demo preparation
- Testing different personality profiles (modify `FACET_SCORE_MAP`)

## Skill Validation

### Check Skill Discovery Collisions

Validate that skill discovery does not produce duplicate names across the active roots.

```bash
pnpm skills:check
```

**Default roots scanned:**
- `.agents/skills` in this repo
- `~/.agents/skills`
- `~/.codex/skills`
- `~/.codex/skills/.system`

**What it catches:**
- Exact duplicate skills exposed from multiple roots
- Same-name skills with different `SKILL.md` contents
- Symlinked skills that still appear as separate discovery entries

**Optional override:**

Use `SKILL_ROOTS` to limit the scan to a specific root set. Values are split with the OS path delimiter (`:` on macOS/Linux).

```bash
SKILL_ROOTS=".agents/skills:$HOME/.codex/skills/.system" pnpm skills:check
```

**Exit behavior:**
- Exit `0` when every discovered skill name is unique
- Exit `1` when duplicate discovery is ambiguous and should be cleaned up before relying on skill routing

## CI Helpers

### Run CI Locally

Mirror the main CI quality gates:

```bash
scripts/ci-local.sh
```

Include Playwright E2E when `.env.e2e` is configured:

```bash
RUN_E2E=true scripts/ci-local.sh
```

### Burn-In

Run the Playwright suite repeatedly to catch flakes:

```bash
scripts/burn-in.sh
```

Override the default 10 iterations:

```bash
BURN_IN_ITERATIONS=3 scripts/burn-in.sh
```

### Changed-Test Helper

Run the relevant test tier for local changes:

```bash
scripts/test-changed.sh
```

Override the comparison base:

```bash
BASE_REF=origin/master scripts/test-changed.sh
```

## Future Scripts

Add additional development scripts here as needed:
- `seed:multiple-profiles` - Generate diverse personality profiles
- `seed:production-like` - Larger dataset for performance testing
- `cleanup:test-data` - Remove all test-seeded data
