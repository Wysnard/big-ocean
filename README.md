# BIG OCEAN

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
- **Type-Safe API**: End-to-end type safety using oRPC and Zod contracts
- **Comprehensive Logging**: Structured logging with Winston for debugging and monitoring
- **Modern UI**: Built with shadcn/ui components and Tailwind CSS v4

## Tech Stack

This is a modern monorepo built with:

- **Monorepo**: Turbo + pnpm workspaces
- **Frontend Apps**:
  - **front**: Vite + React 19 with TanStack Router, React Query, React Form, and React Table
  - **web**: Next.js 16 with shadcn/ui components
- **Backend**: Node.js with oRPC
- **AI/LLM**: LangChain + LangGraph with Claude (Anthropic)
- **API**: oRPC with type-safe contracts using Zod, streaming support
- **Logging**: Winston with structured logging
- **Styling**: Tailwind CSS v4
- **Code Quality**: Biome (front), ESLint, Prettier

## Project Structure

```
apps/
  ├── api/          # oRPC backend API
  │   ├── src/
  │   │   ├── llm/            # LangGraph therapist agent
  │   │   ├── procedures/     # oRPC procedure implementations
  │   │   ├── logger.ts       # Winston logging configuration
  │   │   ├── router.ts       # oRPC router
  │   │   └── index.ts        # Server with logging middleware
  │   └── logs/      # Log files (all.log, error.log)
  ├── front/        # Vite + React frontend (port 3000)
  │   └── src/
  │       ├── routes/chat/    # Therapist chat interface
  │       ├── hooks/          # React hooks (useTherapistChat)
  │       └── components/     # TherapistChat component
  └── web/          # Next.js frontend (port 3001)

packages/
  ├── contracts/    # oRPC contract definitions (chat, therapist)
  ├── ui/           # Shared React components (shadcn/ui based)
  ├── eslint-config/
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

### Development

Start all applications in development mode:

```bash
pnpm dev
```

This starts:

- **api** (Node + oRPC): http://127.0.0.1:4000
- **front** (Vite + React): http://127.0.0.1:3000 - Therapist chat interface
- **web** (Next.js): http://127.0.0.1:3001

The **front** app includes:
- Interactive therapist chat interface at `/chat`
- Real-time personality trait visualization
- Streaming responses from Claude
- Session management with automatic redirect

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

The API is built with oRPC and provides REST-style endpoints:

### Available Endpoints

#### List Planets

```bash
curl -X GET http://127.0.0.1:4000/planets
```

Query parameters:

- `limit` (optional): Max results (1-100)
- `cursor` (optional): Pagination cursor (default: 0)

#### Get Planet

```bash
curl -X GET http://127.0.0.1:4000/planets/{id}
```

#### Create Planet

```bash
curl -X POST http://127.0.0.1:4000/planets \
  -H "Content-Type: application/json" \
  -d '{"name":"Earth","description":"A planet"}'
```

### Therapist Assessment Endpoints

The API provides AI-powered personality assessment using Claude via LangGraph.

#### Start Therapist Assessment

Creates a new therapist assessment session:

```bash
curl -X POST http://127.0.0.1:4000/chat.startTherapistAssessment \
  -H "Content-Type: application/json" \
  -d '{"userId":"user123"}'
```

Response:

```json
{
  "id": "uuid",
  "userId": "user123",
  "createdAt": "2025-01-25T00:00:00.000Z",
  "updatedAt": "2025-01-25T00:00:00.000Z",
  "completed": false,
  "agentState": {
    "messages": [],
    "assessmentComplete": false,
    "opennessPrecision": 0,
    "conscientiousnessPrecision": 0,
    "extraversionPrecision": 0,
    "agreeablenessPrecision": 0,
    "neuroticismPrecision": 0
  }
}
```

#### Send Therapist Message (Streaming)

Send a message and receive a streaming response with personality trait updates:

```bash
curl -X POST http://127.0.0.1:4000/chat.sendTherapistMessage \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"<session-id>","message":"Hello"}'
```

Streams back events:
- `type: "response"` - AI therapist response text chunks
- `type: "traits"` - Updated personality trait scores and precision levels

#### Get Therapist Results

Retrieve current assessment results:

```bash
curl -X POST http://127.0.0.1:4000/chat.getTherapistResults \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"<session-id>"}'
```

Response:

```json
{
  "traits": {
    "openness": 75,
    "conscientiousness": 82,
    "extraversion": 60,
    "agreeableness": 88,
    "neuroticism": 45,
    "opennessPrecision": 0.85,
    "conscientiousnessPrecision": 0.92,
    "extraversionPrecision": 0.78,
    "agreeablenessPrecision": 0.95,
    "neuroticismPrecision": 0.81
  },
  "completed": false
}
```

### Legacy Chat Endpoints

#### Create Chat Session

```bash
curl -X POST http://127.0.0.1:4000/chat.createSession \
  -H "Content-Type: application/json" \
  -d '{"userId":"user123"}'
```

#### Send Message

```bash
curl -X POST http://127.0.0.1:4000/chat.sendMessage \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"<session-id>","message":"Tell me about yourself"}'
```

#### Get Chat Messages

```bash
curl -X POST http://127.0.0.1:4000/chat.getMessages \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"<session-id>","limit":50}'
```

#### Get Chat Session

```bash
curl -X POST http://127.0.0.1:4000/chat.getSession \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"<session-id>"}'
```

### API Contracts

API contracts are defined in `@workspace/contracts` using oRPC and Zod for type safety. Both frontend applications can import these contracts for end-to-end type safety.

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

### AI-Powered Personality Assessment

The therapist assessment feature uses:

- **LangGraph**: State machine for managing conversational flow
- **LangChain**: Integration with Claude (Anthropic API)
- **Claude Sonnet 4.5**: Conversational AI for conducting assessments
- **Tool Calling**: `recordAssessment` tool for tracking personality trait scores

The assessment maintains conversation state across turns, preserving:
- Full message history
- Current personality trait scores (0-100 scale)
- Precision/confidence scores for each trait (0-1 scale)

Each user message triggers a graph execution that:
1. Continues the conversation with full context
2. Updates trait assessments via tool calls
3. Returns streaming responses to the client

### Logging Infrastructure

The API uses Winston for structured logging with multiple levels:
- HTTP request/response logging
- RPC procedure call logging via interceptors
- Business logic logging via context-injected logger
- LLM-specific logging for assessment events

Logs are written to:
- Console (colorized output)
- `logs/all.log` (all log levels)
- `logs/error.log` (errors only)

### Type-Safe API Contracts

The `@workspace/contracts` package defines oRPC procedures with Zod validation. Both frontend and backend use the same contract definitions for end-to-end type safety.

### UI Components

The `@workspace/ui` package provides shadcn/ui-based components used across the frontend applications. Components are exported from individual files:

```tsx
import { Button } from "@workspace/ui/components/button";
```

### Styling

Both frontend apps use Tailwind CSS v4 with the UI package's CSS variables for consistent theming.

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
