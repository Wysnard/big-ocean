# API Reference

This document provides a complete reference for the Big Ocean API endpoints, including request/response schemas, authentication requirements, and error handling.

## API Overview

The Big Ocean API is built on two layers:

1. **Effect/Platform Layer** - Type-safe HTTP contracts using `@effect/platform` for assessment, profile, and evidence endpoints
2. **Better Auth Layer** - Authentication endpoints handled at the `node:http` layer using Better Auth

**Base URL:** Production API is served at `https://api-production-f7de.up.railway.app`

**Content Type:** All requests and responses use `application/json`

## Authentication

### Session-Based Authentication

The API uses session-based authentication via Better Auth. Sessions are managed through HTTP-only cookies.

**Authentication Header:** For endpoints requiring authentication, include the session cookie or pass `x-user-id` header for internal requests.

**Optional Authentication:** Some endpoints accept an optional `userId` parameter to associate actions with authenticated users while still allowing anonymous access.

### Rate Limiting

- **Authenticated users:** 1 new assessment per day (unlimited message resumption)
- **Anonymous users:** No rate limiting on assessment creation
- **Daily cost budget:** $75 per user (enforced via Redis)

---

## Endpoints by Group

### Health

Health check endpoint for service monitoring and load balancer health probes.

#### GET /health

Check API service health status.

**Authentication:** None required

**Response:**

```json
{
  "status": "ok",
  "timestamp": "2026-02-12T10:30:00Z"
}
```

**Status Codes:**

| Code | Description |
|------|-------------|
| 200  | Service healthy |

---

### Assessment

Endpoints for managing personality assessment sessions and conversations.

#### POST /api/assessment/start

Start a new assessment session.

**Authentication:** Optional (pass `userId` to associate with authenticated user)

**Request Body:**

```json
{
  "userId": "string (optional)"
}
```

**Response:**

```json
{
  "sessionId": "uuid-string",
  "createdAt": "2026-02-12T10:30:00Z"
}
```

**Status Codes:**

| Code | Description |
|------|-------------|
| 200  | Session created successfully |
| 429  | Rate limit exceeded (authenticated users only, 1/day) |
| 500  | Database error |

**Errors:**

- `RateLimitExceeded` (429): Authenticated user has already started an assessment today

---

#### POST /api/assessment/message

Send a message to the assessment conversation and receive a response from the Nerin agent.

**Authentication:** None required

**Request Body:**

```json
{
  "sessionId": "uuid-string",
  "message": "User's response text"
}
```

**Response:**

```json
{
  "response": "Nerin's conversational response",
  "confidence": {
    "openness": 0.75,
    "conscientiousness": 0.82,
    "extraversion": 0.68,
    "agreeableness": 0.71,
    "neuroticism": 0.65
  }
}
```

**Status Codes:**

| Code | Description |
|------|-------------|
| 200  | Message processed successfully |
| 404  | Session not found |
| 500  | Database error |
| 503  | Agent invocation failed |

**Errors:**

- `SessionNotFound` (404): No session exists with the provided ID
- `DatabaseError` (500): Database operation failed
- `AgentInvocationError` (503): Failed to generate response from AI agent

---

#### GET /api/assessment/:sessionId/results

Get complete assessment results including archetype, traits, and facets.

**Authentication:** None required

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| sessionId | string | Assessment session UUID |

**Response:**

```json
{
  "oceanCode5": "HHMHM",
  "oceanCode4": "3232",
  "archetypeName": "The Contemplative Explorer",
  "archetypeDescription": "A thoughtful individual who balances introspection with curiosity...",
  "archetypeColor": "#4A90D9",
  "isCurated": true,
  "traits": [
    {
      "name": "openness",
      "score": 95,
      "level": "H",
      "confidence": 85
    }
  ],
  "facets": [
    {
      "name": "imagination",
      "traitName": "openness",
      "score": 16,
      "confidence": 80
    }
  ],
  "overallConfidence": 75
}
```

**Status Codes:**

| Code | Description |
|------|-------------|
| 200  | Results retrieved successfully |
| 404  | Session not found |
| 500  | Database error |

---

#### GET /api/assessment/:sessionId/resume

Resume an existing assessment session with conversation history and current confidence scores.

**Authentication:** None required

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| sessionId | string | Assessment session UUID |

**Response:**

```json
{
  "messages": [
    {
      "role": "user",
      "content": "I enjoy exploring new ideas...",
      "timestamp": "2026-02-12T10:30:00Z"
    },
    {
      "role": "assistant",
      "content": "That's interesting! Can you tell me more...",
      "timestamp": "2026-02-12T10:30:05Z"
    }
  ],
  "confidence": {
    "openness": 0.75,
    "conscientiousness": 0.82,
    "extraversion": 0.68,
    "agreeableness": 0.71,
    "neuroticism": 0.65
  }
}
```

**Status Codes:**

| Code | Description |
|------|-------------|
| 200  | Session resumed successfully |
| 404  | Session not found |
| 500  | Database error |

---

### Profile

Endpoints for managing shareable public profiles and visibility settings.

#### POST /api/profile/share

Create a shareable public profile from a completed assessment.

**Authentication:** None required

**Request Body:**

```json
{
  "sessionId": "uuid-string"
}
```

**Response:**

```json
{
  "publicProfileId": "uuid-string",
  "shareableUrl": "https://bigocean.dev/profile/uuid-string",
  "isPublic": true
}
```

**Notes:**

- Requires assessment confidence >= 70% to create a shareable profile
- Creates a new public profile or returns existing one if already shared

**Status Codes:**

| Code | Description |
|------|-------------|
| 200  | Profile created/retrieved successfully |
| 404  | Session not found |
| 422  | Profile error (confidence too low) |
| 500  | Database error |

**Errors:**

- `SessionNotFound` (404): No session exists with the provided ID
- `ProfileError` (422): Assessment confidence is below 70% threshold
- `DatabaseError` (500): Database operation failed

---

#### GET /api/profile/:publicProfileId

View a public profile with archetype and personality scores.

**Authentication:** None required

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| publicProfileId | string | Public profile UUID |

**Response:**

```json
{
  "archetypeName": "The Contemplative Explorer",
  "oceanCode": "HHMHM",
  "description": "A thoughtful individual who balances introspection with curiosity...",
  "color": "#4A90D9",
  "traitSummary": {
    "openness": "High",
    "conscientiousness": "High",
    "extraversion": "Medium",
    "agreeableness": "High",
    "neuroticism": "Medium"
  },
  "facets": {
    "imagination": { "score": 16, "confidence": 80 },
    "artistic_interests": { "score": 14, "confidence": 75 }
  },
  "isPublic": true
}
```

**Status Codes:**

| Code | Description |
|------|-------------|
| 200  | Profile retrieved successfully |
| 403  | Profile is private |
| 404  | Profile not found |
| 500  | Database error |

**Errors:**

- `ProfileNotFound` (404): No profile exists with the provided ID
- `ProfilePrivate` (403): Profile exists but is set to private

---

#### PATCH /api/profile/:publicProfileId/visibility

Toggle profile visibility between public and private.

**Authentication:** Required (`x-user-id` header)

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| publicProfileId | string | Public profile UUID |

**Request Body:**

```json
{
  "isPublic": false
}
```

**Response:**

```json
{
  "isPublic": false
}
```

**Status Codes:**

| Code | Description |
|------|-------------|
| 200  | Visibility updated successfully |
| 401  | Unauthorized (missing or invalid user ID) |
| 404  | Profile not found |
| 500  | Database error |

**Errors:**

- `Unauthorized` (401): User is not authenticated or does not own this profile
- `ProfileNotFound` (404): No profile exists with the provided ID

---

### Evidence

Endpoints for retrieving facet evidence that links conversation quotes to personality assessments.

#### GET /api/evidence/facet

Get all evidence records for a specific facet within a session.

**Authentication:** None required

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| sessionId | string | Yes | Assessment session UUID |
| facetName | string | Yes | Facet name (e.g., "imagination", "altruism") |

**Response:**

```json
[
  {
    "id": "uuid-string",
    "assessmentMessageId": "uuid-string",
    "facetName": "imagination",
    "score": 16,
    "confidence": 80,
    "quote": "I often daydream about fantastical scenarios",
    "highlightRange": { "start": 0, "end": 45 },
    "createdAt": "2026-02-12T10:30:00Z"
  }
]
```

**Status Codes:**

| Code | Description |
|------|-------------|
| 200  | Evidence retrieved successfully |
| 404  | Session not found |
| 500  | Database error |

---

#### GET /api/evidence/message/:assessmentMessageId

Get all facet evidence detected in a specific message.

**Authentication:** None required

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| assessmentMessageId | string | Assessment message UUID |

**Response:**

```json
[
  {
    "id": "uuid-string",
    "assessmentMessageId": "uuid-string",
    "facetName": "imagination",
    "score": 16,
    "confidence": 80,
    "quote": "I often daydream about fantastical scenarios",
    "highlightRange": { "start": 0, "end": 45 },
    "createdAt": "2026-02-12T10:30:00Z"
  },
  {
    "id": "uuid-string",
    "assessmentMessageId": "uuid-string",
    "facetName": "intellectual_curiosity",
    "score": 18,
    "confidence": 85,
    "quote": "learning new concepts excites me",
    "highlightRange": { "start": 50, "end": 82 },
    "createdAt": "2026-02-12T10:30:00Z"
  }
]
```

**Status Codes:**

| Code | Description |
|------|-------------|
| 200  | Evidence retrieved successfully |
| 500  | Database error |

---

### Auth (Better Auth)

Authentication endpoints handled at the `node:http` layer using Better Auth.

#### POST /api/auth/sign-up/email

Register a new user with email and password.

**Authentication:** None required

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "name": "User Name"
}
```

**Response:**

```json
{
  "user": {
    "id": "uuid-string",
    "email": "user@example.com",
    "name": "User Name"
  },
  "session": {
    "id": "session-uuid",
    "expiresAt": "2026-02-19T10:30:00Z"
  }
}
```

**Notes:**

- Password must be 12+ characters
- Checks against compromised credential databases
- Sets HTTP-only session cookie

---

#### POST /api/auth/sign-in/email

Sign in with email and password.

**Authentication:** None required

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response:**

```json
{
  "user": {
    "id": "uuid-string",
    "email": "user@example.com",
    "name": "User Name"
  },
  "session": {
    "id": "session-uuid",
    "expiresAt": "2026-02-19T10:30:00Z"
  }
}
```

---

#### POST /api/auth/sign-out

Sign out the current user and invalidate session.

**Authentication:** Required (session cookie)

**Request Body:** None

**Response:**

```json
{
  "success": true
}
```

---

#### GET /api/auth/get-session

Get the current user session if authenticated.

**Authentication:** Required (session cookie)

**Response:**

```json
{
  "user": {
    "id": "uuid-string",
    "email": "user@example.com",
    "name": "User Name"
  },
  "session": {
    "id": "session-uuid",
    "expiresAt": "2026-02-19T10:30:00Z"
  }
}
```

Returns `null` if not authenticated.

---

## Error Reference

All errors follow the Effect `TaggedError` pattern with a `_tag` discriminator for type-safe error handling.

### Error Types Table

| Error Type | Status | Description |
|------------|--------|-------------|
| `SessionNotFound` | 404 | Assessment session does not exist |
| `SessionExpired` | 410 | Assessment session has expired |
| `DatabaseError` | 500 | Generic database operation failure |
| `RateLimitExceeded` | 429 | Daily assessment limit reached (auth users) |
| `CostLimitExceeded` | 503 | Daily cost budget exceeded ($75) |
| `ProfileNotFound` | 404 | Public profile does not exist |
| `ProfileError` | 422 | Profile operation failed (e.g., confidence too low) |
| `ProfilePrivate` | 403 | Profile exists but is set to private |
| `InvalidCredentials` | 401 | Email/password authentication failed |
| `UserAlreadyExists` | 409 | Email already registered |
| `Unauthorized` | 401 | Authentication required or user lacks permission |
| `AgentInvocationError` | 503 | AI agent failed to generate response |
| `AnalyzerError` | 500 | Personality analysis operation failed |
| `InvalidFacetNameError` | 422 | Facet name not in the 30 Big Five facets |
| `MalformedEvidenceError` | 422 | Analyzer output parsing/validation failed |

### Error Response Format

All errors return a JSON object with the `_tag` discriminator:

```json
{
  "_tag": "SessionNotFound",
  "sessionId": "invalid-uuid",
  "message": "Session not found"
}
```

### Error-Specific Fields

**SessionNotFound:**
```json
{
  "_tag": "SessionNotFound",
  "sessionId": "string",
  "message": "string"
}
```

**SessionExpired:**
```json
{
  "_tag": "SessionExpired",
  "sessionId": "string",
  "expiredAt": "ISO-8601 datetime",
  "message": "string"
}
```

**RateLimitExceeded:**
```json
{
  "_tag": "RateLimitExceeded",
  "userId": "string",
  "resetAt": "ISO-8601 datetime",
  "message": "string"
}
```

**CostLimitExceeded:**
```json
{
  "_tag": "CostLimitExceeded",
  "dailySpend": 7500,
  "limit": 7500,
  "message": "string"
}
```

**ProfilePrivate:**
```json
{
  "_tag": "ProfilePrivate",
  "publicProfileId": "string",
  "message": "string"
}
```

**AgentInvocationError:**
```json
{
  "_tag": "AgentInvocationError",
  "agentName": "nerin",
  "sessionId": "string",
  "message": "string"
}
```

**InvalidFacetNameError:**
```json
{
  "_tag": "InvalidFacetNameError",
  "facetName": "invalid_facet",
  "validFacets": ["imagination", "artistic_interests", ...],
  "message": "string"
}
```

---

## CORS Configuration

The API enables Cross-Origin Resource Sharing (CORS) for frontend communication.

| Setting | Value |
|---------|-------|
| Allowed Origin | `FRONTEND_URL` environment variable |
| Allowed Methods | `GET, POST, PUT, DELETE, OPTIONS, PATCH` |
| Allowed Headers | `Content-Type, Authorization, Cookie` |
| Credentials | `true` |
| Max Age | `86400` (24 hours) |

**Preflight Handling:** OPTIONS requests receive a `204 No Content` response with CORS headers.

**Configuration:** Set the `FRONTEND_URL` environment variable to your frontend origin (e.g., `https://bigocean.dev`).
