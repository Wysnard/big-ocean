# BIG OCEAN

[![CI](https://github.com/Wysnard/big-ocean/actions/workflows/ci.yml/badge.svg)](https://github.com/Wysnard/big-ocean/actions/workflows/ci.yml)

Big Ocean is a full-stack web application that conducts personality assessments through an interactive chat interface, analyzing users based on the Big Five personality traits:

1. Openness to Experience

Fantasy/Imagination
Aesthetics
Feelings
Actions/Variety
Ideas/Curiosity
Values

2. Conscientiousness

Competence
Order
Dutifulness
Achievement striving
Self-discipline
Deliberation

3. Extraversion

Warmth
Gregariousness
Assertiveness
Activity
Excitement-seeking
Positive emotions

4. Agreeableness

Trust
Straightforwardness
Altruism
Compliance
Modesty
Tender-mindedness

5. Neuroticism (or Emotional Stability)

Anxiety
Angry hostility
Depression
Self-consciousness
Impulsiveness
Vulnerability

## Features

- **AI-Powered Conversational Assessment**: Natural, empathetic personality assessment using Claude Sonnet 4.5
- **Real-Time Trait Tracking**: Live updates of personality trait scores and confidence levels during the conversation
- **Streaming Responses**: Server-sent events provide immediate feedback as the AI responds
- **Session Persistence**: Conversation history and trait assessments are preserved across the session
- **Type-Safe API**: End-to-end type safety using @effect/platform HTTP API contracts and Effect Schema
- **Comprehensive Logging**: Structured logging with Winston for debugging and monitoring
- **Modern UI**: Built with shadcn/ui components and Tailwind CSS v4
- **Production Ready**: Deployed on Railway with health checks and automatic restart policies

## Tech Stack

This is a modern monorepo built with:

- **Monorepo**: Turbo + pnpm workspaces
- **Frontend Apps**:
  - **front**: TanStack Start (full-stack SSR) with React 19, TanStack Router, TanStack Query, TanStack Form
  - **web**: Next.js 16 with shadcn/ui components
- **Backend**: Node.js with Effect-ts 3.19+ for functional programming
- **API Framework**: @effect/platform with HTTP API Groups for type-safe HTTP contracts with Effect Schema validation
- **AI/LLM**: LangChain + LangGraph with Claude (Anthropic)
- **Database**: Drizzle ORM with PostgreSQL (Railway managed)
- **Real-Time Sync**: ElectricSQL for local-first data synchronization
- **Logging**: Winston with structured logging
- **Styling**: Tailwind CSS v4
- **Code Quality**: Biome linter/formatter, Prettier
- **Deployment**: Railway with Docker containerization

## Project Structure

```
apps/
  ├── api/          # Node.js backend with Effect-ts
  │   ├── src/
  │   │   ├── llm/              # LangGraph therapist agent
  │   │   ├── handlers/         # HTTP API handler layers (@effect/platform)
  │   │   ├── use-cases/        # Business logic layer
  │   │   ├── logger.ts         # Winston logging configuration
  │   │   ├── index.ts          # Effect-ts server with health check
  │   │   └── Dockerfile        # Production container config
  │   ├── railway.json          # Railway deployment config
  │   └── package.json          # Dependencies and scripts
  ├── front/        # TanStack Start full-stack SSR (port 3001)
  │   └── src/
  │       ├── routes/           # File-based routing
  │       ├── hooks/            # React hooks (useAssessment, etc)
  │       ├── lib/              # HTTP client setup and utilities
  │       └── components/       # shadcn/ui components
  └── web/          # Next.js frontend (port 3000)

packages/
  ├── contracts/    # HTTP API contracts (@effect/platform + @effect/schema)
  │   ├── src/
  │   │   ├── groups/           # HTTP API endpoint groups
  │   │   ├── assessment.ts     # Assessment service HTTP endpoints
  │   │   ├── profile.ts        # Profile service HTTP endpoints (future)
  │   │   ├── errors.ts         # Tagged error definitions
  │   │   ├── schemas.ts        # Shared schemas
  │   │   └── index.ts          # Contract exports
  ├── infrastructure/  # Effect-ts dependency injection
  │   └── src/
  │       ├── context/
  │       │   ├── database.ts   # DatabaseRef FiberRef bridge
  │       │   ├── logger.ts     # LoggerRef FiberRef bridge
  │       │   └── cost-guard.ts # CostGuardRef FiberRef bridge
  ├── domain/        # Core business logic and types
  ├── database/      # Drizzle ORM schemas
  ├── ui/            # Shared React components (shadcn/ui based)
  ├── lint/          # Shared Biome linting and formatting configuration
  └── typescript-config/
```

## Getting Started

### Prerequisites

- Node.js >= 20
- pnpm 10.4.1+
- Anthropic API key for Claude

### Installation

1. Install dependencies:

```bash
pnpm install
```

2. Set up environment variables:

Create a `.env` file in `apps/api/`:

```env
ANTHROPIC_API_KEY=your_api_key_here
HOST=127.0.0.1
PORT=4000
LOG_LEVEL=debug
```

### Development with Docker Compose (Recommended)

For a fully containerized development environment with exact production parity:

```bash
# Start all services (PostgreSQL, Redis, Backend API, Frontend)
./scripts/dev.sh
```

This starts:
- **Frontend**: http://localhost:3000 (TanStack Start with Vite HMR)
- **Backend API**: http://localhost:4000 (@effect/platform HTTP API + health check)
- **PostgreSQL**: localhost:5432 (development database)
- **Redis**: localhost:6379 (cache and rate limiting)

**Features**:
- Hot reload on code changes (tsx watch for backend, Vite HMR for frontend)
- Full production parity (same versions, same architecture)
- No local dependencies needed (Node, pnpm, PostgreSQL all in Docker)
- Isolated development environment

For detailed Docker instructions, see [DOCKER.md](./DOCKER.md).

### Development Without Docker

Start all applications in development mode locally:

```bash
pnpm dev
```

This starts:

- **api** (Node + @effect/platform): http://127.0.0.1:4000
- **front** (Vite + React): http://127.0.0.1:3000 - Therapist chat interface
- **web** (Next.js): http://127.0.0.1:3001

The **front** app includes:
- Interactive therapist chat interface at `/chat`
- Real-time personality trait visualization
- Streaming responses from Claude
- Session management with automatic redirect

**Prerequisites for local development**:
- PostgreSQL 16+ running locally
- Redis running locally
- All node_modules installed locally

### Running Individual Apps

```bash
# Start only the API
pnpm -C apps/api dev

# Start only the front app
pnpm -C apps/front dev

# Start only the web app
pnpm -C apps/web dev
```

## API Documentation

The API is built with Effect-ts and @effect/platform, providing type-safe HTTP endpoints with Effect Schema validation.

### Production Deployment

The API is deployed on Railway at:
- **Base URL**: https://api-production-f7de.up.railway.app
- **Health Check**: GET `/health` → `{"status":"ok"}`
- **API Base Path**: `/api`

### Assessment HTTP Endpoints

Assessment services use @effect/platform with type-safe HTTP API contracts defined in `@workspace/contracts`.

#### Start Assessment Session

Creates a new personality assessment session:

```bash
curl -X POST http://127.0.0.1:4000/api/assessment/start \
  -H "Content-Type: application/json" \
  -d '{"userId": "user123"}'
```

Response:

```json
{
  "sessionId": "session_1706...",
  "createdAt": "2026-01-30T14:20:00.000Z"
}
```

#### Send Assessment Message

Send a message during assessment and receive trait updates:

```bash
curl -X POST http://127.0.0.1:4000/api/assessment/message \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "session_1706...",
    "message": "Tell me about yourself"
  }'
```

Response:

```json
{
  "response": "Thank you for sharing...",
  "precision": {
    "openness": 0.75,
    "conscientiousness": 0.82,
    "extraversion": 0.60,
    "agreeableness": 0.88,
    "neuroticism": 0.45
  }
}
```

#### Get Assessment Results

Retrieve current assessment results and OCEAN code:

```bash
curl -X GET http://127.0.0.1:4000/api/assessment/session_1706.../results \
  -H "Content-Type: application/json"
```

Response:

```json
{
  "oceanCode4Letter": "PPAM",
  "precision": 72,
  "archetypeName": "The Grounded Thinker",
  "traitScores": {
    "openness": 15,
    "conscientiousness": 12,
    "extraversion": 8,
    "agreeableness": 16,
    "neuroticism": 6
  }
}
```

### HTTP Contract Definition

API contracts are defined in `@workspace/contracts` using @effect/platform HTTP API Groups and Effect Schema:

```typescript
import { HttpApiEndpoint, HttpApiGroup } from "@effect/platform";
import { Schema as S } from "effect";

export const AssessmentGroup = HttpApiGroup.make("assessment")
  .add(
    HttpApiEndpoint.post("start", "/start")
      .addSuccess(StartAssessmentResponseSchema)
      .setPayload(StartAssessmentRequestSchema)
  )
  .add(
    HttpApiEndpoint.post("sendMessage", "/message")
      .addSuccess(SendMessageResponseSchema)
      .setPayload(SendMessageRequestSchema)
  )
  .prefix("/assessment");
```

Handlers implement these contracts using `HttpApiBuilder.group()`, providing compile-time type safety between frontend and backend.

## Development Commands

### Build

```bash
pnpm build
```

### Lint

```bash
pnpm lint
pnpm lint:fix      # Fix linting issues in web app
```

### Format

```bash
pnpm format         # Format with Prettier
```

### Testing

**Front app (Vitest)**:

```bash
pnpm -C apps/front test
pnpm -C apps/front test --watch
```

### Storybook

View component stories in the front app:

```bash
pnpm -C apps/front storybook
```

Runs on http://127.0.0.1:6006

## Architecture Notes

### Backend Stack

**Effect-ts HTTP API Architecture**:

- **@effect/platform HTTP API Groups**: Type-safe HTTP contracts with @effect/schema runtime validation
- **Hexagonal Architecture**: Clear separation between handlers (presenters), use-cases (business logic), and domain
- **FiberRef Bridges**: Request-scoped dependency injection (database, logger, Better Auth, cost tracking)
- **Layer Composition**: Clean service orchestration using Effect Layers
- **Error Handling**: Tagged error unions for discriminated error types
- **Railway Deployment**: Docker containerization with health checks

Production endpoints:
- Health: GET `/health` → `{"status":"ok"}`
- API: All routes under `/api/*` with HTTP methods (GET, POST, etc.)

### AI-Powered Personality Assessment

The therapist assessment feature uses:

- **LangGraph**: State machine for managing conversational flow
- **LangChain**: Integration with Claude (Anthropic API)
- **Claude Sonnet 4.5**: Conversational AI for conducting assessments
- **Tool Calling**: `recordAssessment` tool for tracking personality trait scores

The assessment maintains conversation state across turns, preserving:
- Full message history
- Current personality trait scores (0-20 scale per OCEAN)
- Precision/confidence scores for each trait (0-100%)

Each user message triggers a graph execution that:
1. Continues the conversation with full context
2. Updates trait assessments via tool calls
3. Returns streaming responses to the client

### Infrastructure & Dependency Injection

**Context.Tag & Effect Layers** (packages/infrastructure):

Services are defined as Effect Context.Tag instances and composed via Effect Layers:

```typescript
// Service definition (packages/infrastructure/src/context/better-auth.ts)
export class BetterAuthService extends Context.Tag("BetterAuthService")<
  BetterAuthService,
  Auth<BetterAuthOptions>
>() {}

export const BetterAuthLive = Layer.effect(
  BetterAuthService,
  Effect.gen(function* () {
    const config = yield* AppConfig;
    const database = yield* Database;
    const logger = yield* LoggerRepository;
    // ... initialize service
  })
);
```

Use-cases access services via context:

```typescript
const result = Effect.gen(function* () {
  const auth = yield* BetterAuthService;
  const db = yield* Database;
  // ... business logic
});
```

Core services:
- **BetterAuthService**: Authentication layer with session management
- **Database**: Drizzle ORM connection for PostgreSQL
- **LoggerRepository**: Winston structured logging
- **AppConfig**: Configuration management via environment variables

### Logging Infrastructure

The API uses Winston for structured logging with multiple levels:
- HTTP request/response logging via @effect/platform middleware
- Business logic logging via Effect Context-injected logger
- LLM-specific logging for assessment events
- Railway deployment health monitoring

### Type-Safe API Contracts

The `@workspace/contracts` package defines HTTP API groups with @effect/platform and Effect Schema:

```typescript
// Fully typed at compile time
export const AssessmentGroup = HttpApiGroup.make("assessment")
  .add(
    HttpApiEndpoint.post("start", "/start")
      .setPayload(StartAssessmentRequestSchema)
      .addSuccess(StartAssessmentResponseSchema)
  );
```

Backend handlers and frontend clients use the same contract definitions for end-to-end type safety.

### Data Persistence

- **Database**: PostgreSQL (Railway managed) via Drizzle ORM
- **Local-First Sync**: ElectricSQL for reactive client-side state
- **Session Storage**: Server-side in PostgreSQL with client-side caching

### UI Components & Styling

The `@workspace/ui` package provides shadcn/ui-based components used across the frontend applications:

```tsx
import { Button } from "@workspace/ui/components/button";
```

Both frontend apps use Tailwind CSS v4 with the UI package's CSS variables for consistent theming.

### Frontend Architecture

**TanStack Start** (apps/front):
- Full-stack SSR with React 19
- File-based routing with TanStack Router
- Server Actions for data mutations
- TanStack Query 5 for caching and synchronization
- TanStack Form for form state
- ElectricSQL + TanStack DB for reactive state

**Next.js** (apps/web):
- Server-side rendering
- API routes
- shadcn/ui components
- Tailwind CSS styling

## Troubleshooting

### Therapist API Errors

If you encounter errors when using the therapist chat:

1. **Check API key**: Ensure `ANTHROPIC_API_KEY` is set in `apps/api/.env`
2. **Check logs**: View `apps/api/logs/error.log` for detailed error messages
3. **Verify API is running**: The API should be accessible at http://127.0.0.1:4000

### Recursion Limit Errors

If you see "Recursion limit reached" errors:
- This has been fixed by ensuring the LangGraph properly ends each conversation turn
- If it persists, check the `shouldContinue` function in `apps/api/src/llm/therapist.ts`

### Session Issues

If the chat doesn't load or redirects constantly:
- Clear browser localStorage
- Check browser console for errors
- Verify the session is created successfully in the API logs

## Contributing

For detailed development guidance, see [CLAUDE.md](./CLAUDE.md).
