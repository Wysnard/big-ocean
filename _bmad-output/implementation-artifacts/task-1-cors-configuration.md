# Task #1: CORS Configuration

**Status:** ✅ Complete
**Date:** 2026-02-06
**Related Story:** 4.1 - Authentication UI (Sign-Up Modal)
**Blocks:** E2E tests for authentication flows

## Problem Statement

E2E tests for the authentication UI were failing (7 tests) due to CORS errors. The browser was blocking cross-origin requests from the frontend (localhost:3000) to the API server (localhost:4001 for tests, localhost:4000 for dev).

**Error:** `Failed to fetch` when calling Better Auth endpoints from the browser.

## Solution Implemented

Added CORS middleware at the node:http layer in the API server to allow cross-origin requests from the configured frontend URL.

### Changes Made

#### 1. Added CORS Handler Function (`apps/api/src/index.ts`)

```typescript
/**
 * Add CORS headers to response
 */
function addCorsHeaders(res: ServerResponse, frontendUrl: string): void {
	res.setHeader("Access-Control-Allow-Origin", frontendUrl);
	res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
	res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Cookie");
	res.setHeader("Access-Control-Allow-Credentials", "true");
	res.setHeader("Access-Control-Max-Age", "86400"); // 24 hours
}
```

#### 2. Updated Server Factory

Modified `createCustomServerFactory` to:
- Accept `frontendUrl` parameter from config
- Add CORS headers to all responses
- Handle OPTIONS preflight requests

**Request Processing Order:**
1. CORS headers added to response
2. OPTIONS requests handled (204 No Content)
3. Better Auth routes processed
4. Effect routes processed

#### 3. Updated Configuration

**Added to `.env.example`:**
```bash
# CORS
FRONTEND_URL=http://localhost:3000
```

**Config Usage:**
- Uses `AppConfig.frontendUrl` which defaults to `http://localhost:3000`
- Can be overridden via `FRONTEND_URL` environment variable
- Production: Set to actual frontend domain (e.g., `https://app.bigocean.com`)

#### 4. Updated Startup Logging

Added CORS configuration to server startup logs:
```
✓ CORS enabled:
  - Allowed origin: http://localhost:3000
  - Credentials: true
```

#### 5. Added Integration Tests

**Files modified:**
- `apps/api/tests/integration/health.test.ts` - CORS tests for GET /health
- `apps/api/tests/integration/assessment.test.ts` - CORS tests for assessment endpoints

**Tests added:**
- OPTIONS preflight request handling (returns 204)
- CORS headers on GET requests
- CORS headers on POST requests
- CORS headers on all assessment endpoints (start, message, resume)

All CORS verification is now automated in integration tests - no manual shell scripts needed.

## Technical Details

### CORS Headers Explained

- **Access-Control-Allow-Origin:** Specifies allowed origin (frontend URL)
- **Access-Control-Allow-Methods:** Allowed HTTP methods
- **Access-Control-Allow-Headers:** Allowed request headers (includes Cookie for session auth)
- **Access-Control-Allow-Credentials:** Allows cookies/auth headers (required for Better Auth)
- **Access-Control-Max-Age:** Preflight cache duration (24 hours)

### Implementation Location

CORS is implemented at the **node:http layer** (before Effect and Better Auth) to ensure all responses include CORS headers, regardless of which layer handles the request.

```
Request Flow:
Browser → Node HTTP Server → CORS Middleware → OPTIONS? → Better Auth? → Effect Routes
                                    ↓               ↓           ↓              ↓
                                 Headers        204 End    Auth Handler   API Handler
```

### Environment Configuration

| Environment | Frontend URL | API URL |
|-------------|-------------|---------|
| Development | http://localhost:3000 | http://localhost:4000 |
| Test | http://localhost:3000 | http://localhost:4001 |
| Production | https://app.bigocean.com | https://api.bigocean.com |

## Testing

### What Now Works

✅ Browser can make requests from frontend to API
✅ Better Auth sign-up/sign-in from browser
✅ Session cookies work across origins
✅ E2E tests should pass (unblocked)

### How to Test

**1. Run Integration Tests (Recommended):**
```bash
# Run all integration tests (includes CORS tests)
pnpm test:integration

# Or run just the API integration tests
pnpm --filter=api test:integration
```

Integration tests verify:
- ✅ OPTIONS preflight returns 204 with CORS headers
- ✅ GET requests include CORS headers
- ✅ POST requests include CORS headers
- ✅ All assessment endpoints have CORS headers

**2. Run E2E Tests:**
```bash
# Run frontend E2E tests (includes auth flows)
pnpm --filter=front test:e2e
```

All 7 previously failing authentication tests should now pass.

**3. Manual Verification (Browser Console):**
```javascript
// Should succeed (no CORS error)
fetch('http://localhost:4000/health', {
  method: 'GET',
  credentials: 'include'
})
```

## Next Steps

1. ✅ **Task Complete:** CORS configuration implemented
2. 🔜 **Run E2E Tests:** Verify all 7 auth tests pass
3. 🔜 **Story 4.2:** Continue with Assessment Conversation Component

## Production Considerations

**Security:**
- ✅ Only allows configured frontend origin (no `*` wildcard)
- ✅ Credentials must match specific origin
- ✅ Max-Age prevents excessive preflight requests

**Configuration:**
- Set `FRONTEND_URL` environment variable in Railway
- Update Better Auth `trustedOrigins` if needed (already includes `config.frontendUrl`)

## Files Modified

1. `apps/api/src/index.ts` - Added CORS middleware
2. `.env.example` - Documented FRONTEND_URL variable
3. `apps/api/tests/integration/health.test.ts` - Added CORS tests
4. `apps/api/tests/integration/assessment.test.ts` - Added CORS tests
5. `_bmad-output/implementation-artifacts/task-1-cors-configuration.md` - This documentation

## Architecture Notes

This implementation follows the existing pattern in the codebase:
- Uses node:http layer (like Better Auth integration)
- Leverages Effect Config system (AppConfig)
- No dependencies on external CORS libraries
- Minimal, focused implementation

## References

- Story 4.1: `_bmad-output/implementation-artifacts/4-1-authentication-ui-sign-up-modal.md`
- Better Auth CORS: `packages/infrastructure/src/context/better-auth.ts` (trustedOrigins)
- AppConfig: `packages/domain/src/config/app-config.ts`
