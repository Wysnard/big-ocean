# Development Scripts

Quick reference for development and testing scripts.

## Database Seeding

### Seed Completed Assessment

Quickly populate your database with a realistic completed assessment for manual testing of the results page.

**Prerequisites:**
- Database must be running (start with `pnpm dev` or `docker compose up -d postgres`)

```bash
# Start the dev environment (if not already running)
pnpm dev

# In another terminal, run the seed script
pnpm seed:test-assessment
```

**What it creates:**
- Test user (`test@bigocean.dev`)
- Completed assessment session with realistic personality profile
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
User: test@bigocean.dev
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
- Manual UI testing of results page without running full conversations
- Frontend development iteration speed
- Screenshot/demo preparation
- Testing different personality profiles (modify `FACET_SCORE_MAP`)

## Future Scripts

Add additional development scripts here as needed:
- `seed:multiple-profiles` - Generate diverse personality profiles
- `seed:production-like` - Larger dataset for performance testing
- `cleanup:test-data` - Remove all test-seeded data
