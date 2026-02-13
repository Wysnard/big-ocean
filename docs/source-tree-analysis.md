# Source Tree Analysis

This document provides a comprehensive annotated directory tree for the big-ocean monorepo, a psychological profiling platform built on the Big Five personality framework.

## Table of Contents

1. [Annotated Source Tree](#annotated-source-tree)
2. [Critical Folders Explained](#critical-folders-explained)
3. [Entry Points](#entry-points)
4. [Integration Points](#integration-points)

---

## Annotated Source Tree

```
big-ocean/
├── apps/
│   ├── api/                              # Backend API (Effect-ts + LangGraph)
│   │   ├── src/
│   │   │   ├── handlers/                 # HTTP adapters (thin controllers, no business logic)
│   │   │   │   ├── assessment.ts         # Assessment CRUD + message sending endpoints
│   │   │   │   ├── profile.ts            # Public profile sharing + visibility toggle
│   │   │   │   ├── evidence.ts           # Facet evidence retrieval endpoints
│   │   │   │   └── health.ts             # Health check endpoint (/health)
│   │   │   ├── use-cases/                # Pure business logic (main unit test target)
│   │   │   │   ├── __tests__/            # Use-case unit tests with mock layers
│   │   │   │   │   ├── start-assessment.use-case.test.ts
│   │   │   │   │   ├── send-message.use-case.test.ts
│   │   │   │   │   ├── get-results.use-case.test.ts
│   │   │   │   │   ├── shareable-profile.use-case.test.ts
│   │   │   │   │   ├── evidence.use-case.test.ts
│   │   │   │   │   └── ...               # Additional integration tests
│   │   │   │   ├── start-assessment.use-case.ts      # Create new assessment session
│   │   │   │   ├── send-message.use-case.ts          # Process user message through orchestrator
│   │   │   │   ├── get-results.use-case.ts           # Retrieve assessment results with scores
│   │   │   │   ├── resume-session.use-case.ts        # Resume existing session
│   │   │   │   ├── calculate-confidence.use-case.ts  # Calculate assessment confidence
│   │   │   │   ├── update-facet-scores.use-case.ts   # Update facet scores from evidence
│   │   │   │   ├── save-facet-evidence.use-case.ts   # Persist analyzer evidence
│   │   │   │   ├── create-shareable-profile.use-case.ts  # Generate shareable profile link
│   │   │   │   ├── get-public-profile.use-case.ts    # Fetch public profile data
│   │   │   │   ├── toggle-profile-visibility.use-case.ts # Toggle profile public/private
│   │   │   │   ├── get-facet-evidence.use-case.ts    # Get evidence for a facet
│   │   │   │   ├── get-message-evidence.use-case.ts  # Get evidence for a message
│   │   │   │   └── index.ts              # Use-case exports
│   │   │   ├── middleware/               # HTTP middleware
│   │   │   │   └── better-auth.ts        # Better Auth HTTP middleware integration
│   │   │   ├── llm/                      # LLM integration utilities
│   │   │   │   ├── llm.ts                # LLM client configuration
│   │   │   │   └── therapist.ts          # Therapist prompt templates
│   │   │   ├── __tests__/                # Smoke tests
│   │   │   │   └── smoke.test.ts
│   │   │   └── index.ts                  # Server entry point (port 4000)
│   │   ├── tests/integration/            # Tier 2 Docker-based integration tests
│   │   │   ├── health.test.ts            # Health endpoint integration test
│   │   │   ├── assessment.test.ts        # Assessment flow integration test
│   │   │   └── README.md                 # Integration testing documentation
│   │   ├── scripts/                      # API-specific scripts
│   │   │   ├── integration-setup.ts      # Integration test setup
│   │   │   └── integration-teardown.ts   # Integration test teardown
│   │   ├── Dockerfile                    # Multi-stage (builder -> dev -> deploy -> production)
│   │   ├── docker-entrypoint.sh          # Migrations + binary rebuild on startup
│   │   ├── package.json
│   │   ├── railway.json                  # Railway deployment config
│   │   ├── vitest.config.ts              # Unit test configuration
│   │   └── vitest.config.integration.ts  # Integration test configuration
│   │
│   └── front/                            # Frontend Web App (React 19 + TanStack Start)
│       ├── src/
│       │   ├── routes/                   # TanStack Router pages (file-based routing)
│       │   │   ├── __root.tsx            # Root layout (Header, ThemeProvider, QueryProvider)
│       │   │   ├── index.tsx             # Home page (hero, value props, traits sections)
│       │   │   ├── chat/
│       │   │   │   └── index.tsx         # Assessment chat interface
│       │   │   ├── results.tsx           # Results display with trait scores
│       │   │   ├── results/
│       │   │   │   └── $sessionId.tsx    # Results by session ID (dynamic route)
│       │   │   ├── dashboard.tsx         # Protected user dashboard
│       │   │   ├── login.tsx             # Login page
│       │   │   ├── signup.tsx            # Signup page
│       │   │   └── profile.$publicProfileId.tsx  # Public profile view (dynamic route)
│       │   ├── components/               # React components
│       │   │   ├── auth/                 # Authentication components
│       │   │   │   ├── login-form.tsx    # Login form with validation
│       │   │   │   ├── signup-form.tsx   # Signup form with validation
│       │   │   │   ├── SignUpModal.tsx   # Modal signup flow
│       │   │   │   ├── user-menu.tsx     # User dropdown menu
│       │   │   │   ├── *.stories.tsx     # Storybook stories
│       │   │   │   ├── *.test.tsx        # Component tests
│       │   │   │   └── index.ts          # Auth component exports
│       │   │   ├── home/                 # Home page sections
│       │   │   │   ├── HeroSection.tsx   # Hero with CTA
│       │   │   │   ├── ValuePropsSection.tsx   # Value propositions
│       │   │   │   ├── ChatPreviewSection.tsx  # Chat demo preview
│       │   │   │   ├── TraitsSection.tsx       # Big Five traits display
│       │   │   │   ├── TraitCard.tsx           # Individual trait card
│       │   │   │   ├── ArchetypeTeaserSection.tsx  # Archetype preview
│       │   │   │   ├── DiscoverSection.tsx     # Discovery CTA
│       │   │   │   ├── FinalCTASection.tsx     # Final call-to-action
│       │   │   │   ├── ChatBubble.tsx          # Chat bubble component
│       │   │   │   ├── ScrollIndicator.tsx     # Scroll indicator
│       │   │   │   └── WaveDivider.tsx         # Wave section divider
│       │   │   ├── results/              # Results page components
│       │   │   │   ├── ArchetypeCard.tsx       # Archetype display card
│       │   │   │   ├── TraitBar.tsx            # Trait score visualization
│       │   │   │   ├── FacetBreakdown.tsx      # Facet detail breakdown
│       │   │   │   ├── *.stories.tsx           # Storybook stories
│       │   │   │   └── *.test.tsx              # Component tests
│       │   │   ├── Header.tsx            # Sticky header with logo, auth, theme
│       │   │   ├── Logo.tsx              # Big Ocean logo component
│       │   │   ├── UserNav.tsx           # User navigation component
│       │   │   ├── MobileNav.tsx         # Mobile navigation drawer
│       │   │   ├── TherapistChat.tsx     # Main chat interface component
│       │   │   ├── FacetSidePanel.tsx    # Message facet evidence panel
│       │   │   ├── EvidencePanel.tsx     # Evidence display panel
│       │   │   ├── ProgressBar.tsx       # Assessment confidence progress
│       │   │   ├── ErrorBanner.tsx       # Error display banner
│       │   │   ├── ThemeProvider.tsx     # Dark/light theme context
│       │   │   ├── ThemeToggle.tsx       # Theme cycle button (light/dark/system)
│       │   │   ├── *.stories.tsx         # Storybook stories
│       │   │   └── *.test.tsx            # Component tests
│       │   ├── hooks/                    # Custom React hooks
│       │   │   ├── use-auth.ts           # Auth state + useRequireAuth
│       │   │   ├── use-assessment.ts     # Assessment queries/mutations (TanStack Query)
│       │   │   ├── useTherapistChat.ts   # Chat state management
│       │   │   ├── use-evidence.ts       # Evidence queries
│       │   │   ├── use-profile.ts        # Profile mutations
│       │   │   └── __mocks__/            # Hook mocks for testing
│       │   │       └── use-auth.ts
│       │   ├── integrations/             # External integrations
│       │   │   └── tanstack-query/
│       │   │       ├── root-provider.tsx # TanStack Query provider
│       │   │       └── devtools.tsx      # Query devtools
│       │   ├── lib/                      # Utilities
│       │   │   └── auth-client.ts        # Better Auth client configuration
│       │   ├── data/                     # Static data
│       │   │   ├── demo-table-data.ts
│       │   │   └── demo.punk-songs.ts
│       │   ├── db-collections/           # Database collections (ElectricSQL)
│       │   │   └── index.ts
│       │   ├── router.tsx                # Router configuration
│       │   ├── routeTree.gen.ts          # Generated route tree (auto-generated)
│       │   ├── styles.css                # Global styles
│       │   └── polyfill.ts               # Browser polyfills
│       ├── e2e/                          # Playwright E2E tests
│       │   ├── auth-flow.spec.ts         # Authentication flow tests
│       │   ├── auth-signup-modal.spec.ts # Signup modal tests
│       │   ├── home.spec.ts              # Home page tests
│       │   ├── chat-assessment.spec.ts   # Chat assessment tests
│       │   ├── assessment-results.spec.ts # Results page tests
│       │   ├── profile-sharing.spec.ts   # Profile sharing tests
│       │   ├── evidence-highlighting.spec.ts # Evidence highlighting tests
│       │   ├── global-setup.ts           # E2E setup
│       │   ├── global-teardown.ts        # E2E teardown
│       │   ├── README.md                 # E2E documentation
│       │   ├── QUICKSTART.md             # E2E quickstart guide
│       │   ├── ARCHITECTURE.md           # E2E architecture
│       │   └── IMPLEMENTATION-SUMMARY.md # Implementation details
│       ├── public/                       # Static assets
│       │   ├── favicon.ico
│       │   ├── logo192.png
│       │   ├── logo512.png
│       │   ├── manifest.json
│       │   └── robots.txt
│       ├── .storybook/                   # Storybook configuration
│       ├── storybook-static/             # Built Storybook (gitignored in prod)
│       ├── Dockerfile                    # Multi-stage (builder -> dev -> production)
│       ├── docker-entrypoint.sh          # Frontend container entrypoint
│       ├── playwright.config.ts          # E2E test configuration
│       ├── vite.config.ts                # Vite bundler configuration
│       ├── vitest.config.ts              # Unit test configuration
│       ├── vitest.setup.ts               # Test setup
│       ├── package.json
│       └── railway.json                  # Railway deployment config
│
├── packages/
│   ├── domain/                           # Core Domain (pure abstractions, no deps)
│   │   └── src/
│   │       ├── repositories/             # Context.Tag interfaces (ports)
│   │       │   ├── __tests__/            # Repository interface tests
│   │       │   │   └── analyzer.repository.test.ts
│   │       │   ├── analyzer.repository.ts         # Analyzer agent interface
│   │       │   ├── assessment-message.repository.ts  # Message persistence
│   │       │   ├── assessment-session.repository.ts  # Session persistence
│   │       │   ├── checkpointer.repository.ts     # LangGraph checkpointer
│   │       │   ├── cost-guard.repository.ts       # Cost tracking + rate limiting
│   │       │   ├── facet-evidence.repository.ts   # Evidence persistence
│   │       │   ├── logger.repository.ts           # Logging interface
│   │       │   ├── nerin-agent.repository.ts      # Nerin conversational agent
│   │       │   ├── orchestrator.repository.ts     # Main orchestrator
│   │       │   ├── orchestrator-graph.repository.ts  # LangGraph integration
│   │       │   ├── public-profile.repository.ts   # Public profile persistence
│   │       │   └── redis.repository.ts            # Redis interface
│   │       ├── entities/                 # Domain entities
│   │       │   ├── message.entity.ts     # Message entity definition
│   │       │   └── session.entity.ts     # Session entity definition
│   │       ├── types/                    # Branded types and type definitions
│   │       │   ├── trait.ts              # TraitName, TraitScore types
│   │       │   ├── facet.ts              # FacetName, FacetScore types
│   │       │   ├── facet-evidence.ts     # FacetEvidence types
│   │       │   ├── session.ts            # Session types
│   │       │   └── archetype.ts          # Archetype, OceanCode types
│   │       ├── schemas/                  # Effect Schema definitions
│   │       │   ├── __tests__/
│   │       │   │   └── agent-schemas.test.ts
│   │       │   └── agent-schemas.ts      # Agent input/output schemas
│   │       ├── errors/                   # Domain error types
│   │       │   └── evidence.errors.ts    # Evidence-related errors
│   │       ├── constants/                # Domain constants
│   │       │   ├── big-five.ts           # BIG_FIVE_TRAITS, ALL_FACETS (5 traits x 6 facets)
│   │       │   └── archetypes.ts         # ARCHETYPES (243 personality archetypes)
│   │       ├── utils/                    # Pure domain functions
│   │       │   ├── __tests__/            # Utility tests
│   │       │   │   ├── ocean-code-generator.test.ts
│   │       │   │   ├── archetype-lookup.test.ts
│   │       │   │   ├── trait-colors.test.ts
│   │       │   │   └── scoring.test.ts
│   │       │   ├── ocean-code-generator.ts  # Generate 5-letter OCEAN code from facets
│   │       │   ├── archetype-lookup.ts      # Lookup archetype from OCEAN code
│   │       │   ├── scoring.ts               # Aggregate facets -> traits
│   │       │   ├── confidence.ts            # Confidence calculation
│   │       │   ├── derive-trait-summary.ts  # Derive trait summaries
│   │       │   ├── trait-colors.ts          # Trait visualization colors
│   │       │   ├── date.utils.ts            # UTC date utilities
│   │       │   └── index.ts                 # Utility exports
│   │       ├── services/                 # Domain services
│   │       │   ├── __tests__/
│   │       │   │   ├── cost-calculator.service.test.ts
│   │       │   │   └── confidence-calculator.service.test.ts
│   │       │   ├── cost-calculator.service.ts      # Token cost calculation
│   │       │   └── confidence-calculator.service.ts  # Assessment confidence
│   │       ├── config/                   # Configuration interfaces
│   │       │   ├── __mocks__/
│   │       │   │   └── app-config.ts     # Test configuration
│   │       │   ├── app-config.ts         # AppConfig Context.Tag
│   │       │   └── index.ts              # Config exports
│   │       ├── test-utils/               # Domain test utilities
│   │       │   └── index.ts
│   │       ├── __tests__/                # Domain-level tests
│   │       │   ├── effect-patterns.test.ts
│   │       │   ├── placeholder.test.ts
│   │       │   └── schema-validation.test.ts
│   │       └── index.ts                  # Main domain exports
│   │
│   ├── contracts/                        # HTTP API Contracts (shared frontend <-> backend)
│   │   └── src/
│   │       ├── http/                     # HTTP-specific contracts
│   │       │   ├── groups/               # HttpApiGroup definitions
│   │       │   │   ├── assessment.ts     # Assessment API group
│   │       │   │   ├── health.ts         # Health API group
│   │       │   │   ├── profile.ts        # Profile API group
│   │       │   │   └── evidence.ts       # Evidence API group
│   │       │   └── api.ts                # Combined API definition
│   │       ├── groups/                   # Legacy contract groups
│   │       │   ├── assessment.ts
│   │       │   └── health.ts
│   │       ├── schemas/                  # Request/response schemas
│   │       │   └── evidence.ts           # Evidence schemas
│   │       ├── __tests__/
│   │       │   └── http-contracts.test.ts
│   │       ├── errors.ts                 # HTTP-facing error definitions (TaggedError)
│   │       ├── schemas.ts                # Shared schema definitions
│   │       ├── api.ts                    # API route definitions
│   │       └── index.ts                  # Contract exports
│   │
│   ├── infrastructure/                   # Repository Implementations (adapters)
│   │   └── src/
│   │       ├── repositories/             # Repository implementations
│   │       │   ├── __mocks__/            # Mock implementations for testing (vi.mock pattern)
│   │       │   │   ├── analyzer.claude.repository.ts
│   │       │   │   ├── assessment-message.drizzle.repository.ts
│   │       │   │   ├── assessment-session.drizzle.repository.ts
│   │       │   │   ├── cost-guard.redis.repository.ts
│   │       │   │   ├── facet-evidence.drizzle.repository.ts
│   │       │   │   ├── logger.pino.repository.ts
│   │       │   │   ├── nerin-agent.langgraph.repository.ts
│   │       │   │   ├── orchestrator.langgraph.repository.ts
│   │       │   │   ├── orchestrator-graph.langgraph.repository.ts
│   │       │   │   ├── public-profile.drizzle.repository.ts
│   │       │   │   └── redis.ioredis.repository.ts
│   │       │   ├── __tests__/            # Repository implementation tests
│   │       │   │   ├── analyzer.claude.repository.test.ts
│   │       │   │   ├── cost-guard.redis.repository.test.ts
│   │       │   │   ├── cost-guard-rate-limiting.test.ts
│   │       │   │   ├── orchestrator.langgraph.repository.test.ts
│   │       │   │   ├── orchestrator.nodes.test.ts
│   │       │   │   └── orchestrator.state.test.ts
│   │       │   ├── analyzer.claude.repository.ts         # Claude-based analyzer
│   │       │   ├── assessment-message.drizzle.repository.ts  # Drizzle message repo
│   │       │   ├── assessment-session.drizzle.repository.ts  # Drizzle session repo
│   │       │   ├── checkpointer.memory.repository.ts     # In-memory checkpointer
│   │       │   ├── checkpointer.postgres.repository.ts   # Postgres checkpointer
│   │       │   ├── cost-guard.redis.repository.ts        # Redis cost tracking
│   │       │   ├── facet-evidence.drizzle.repository.ts  # Drizzle evidence repo
│   │       │   ├── facet-steering.ts                     # Facet steering logic
│   │       │   ├── logger.pino.repository.ts             # Pino logger implementation
│   │       │   ├── nerin-agent.langgraph.repository.ts   # LangGraph Nerin agent
│   │       │   ├── nerin-agent.mock.repository.ts        # Mock Nerin for testing
│   │       │   ├── orchestrator.langgraph.repository.ts  # Main orchestrator impl
│   │       │   ├── orchestrator-graph.langgraph.repository.ts  # Graph construction
│   │       │   ├── orchestrator.nodes.ts                 # Orchestrator graph nodes
│   │       │   ├── orchestrator.state.ts                 # Orchestrator state definition
│   │       │   ├── public-profile.drizzle.repository.ts  # Drizzle profile repo
│   │       │   └── redis.ioredis.repository.ts           # IORedis implementation
│   │       ├── db/                       # Database layer
│   │       │   ├── drizzle/
│   │       │   │   └── schema.ts         # Drizzle schema (8 tables)
│   │       │   │       # Tables: user, session, account, verification,
│   │       │   │       #         assessment_session, assessment_message,
│   │       │   │       #         facet_evidence, public_profile
│   │       │   └── __tests__/
│   │       │       └── schema.test.ts
│   │       ├── context/                  # Effect contexts
│   │       │   ├── database.ts           # Database connection context
│   │       │   ├── better-auth.ts        # Better Auth context
│   │       │   └── cost-guard.ts         # Cost guard context
│   │       ├── config/                   # Infrastructure configuration
│   │       │   ├── __tests__/
│   │       │   │   ├── app-config.test.ts
│   │       │   │   └── app-config.live.test.ts
│   │       │   ├── app-config.live.ts    # Production AppConfig implementation
│   │       │   └── index.ts              # Config exports
│   │       ├── agents/                   # LangGraph agent configurations
│   │       ├── utils/                    # Infrastructure utilities
│   │       │   └── test/
│   │       │       └── app-config.testing.ts
│   │       └── index.ts                  # Infrastructure exports
│   │
│   ├── ui/                               # Shared Component Library (shadcn/ui based)
│   │   └── src/
│   │       ├── components/               # UI components
│   │       │   ├── button.tsx            # Button component
│   │       │   ├── button.stories.tsx    # Button stories
│   │       │   ├── card.tsx              # Card component
│   │       │   ├── card.stories.tsx      # Card stories
│   │       │   ├── dialog.tsx            # Dialog component
│   │       │   ├── dialog.stories.tsx    # Dialog stories
│   │       │   ├── dropdown-menu.tsx     # Dropdown menu component
│   │       │   ├── sheet.tsx             # Sheet (drawer) component
│   │       │   └── color-palette.stories.tsx  # Color palette documentation
│   │       ├── hooks/                    # Shared hooks
│   │       │   └── use-theme.ts          # Theme hook (dark/light/system)
│   │       ├── lib/
│   │       │   └── utils.ts              # Utility functions (cn, etc.)
│   │       └── styles/
│   │           └── globals.css           # Tailwind v4 + OKLCH color tokens
│   │
│   ├── lint/                             # Biome Configuration
│   │   ├── biome.json                    # Shared lint rules (single source of truth)
│   │   └── package.json
│   │
│   └── typescript-config/                # TypeScript Configuration
│       ├── base.json                     # Shared compiler options
│       ├── nextjs.json                   # Next.js specific config
│       ├── react-library.json            # React library config
│       └── package.json
│
├── drizzle/                              # Database migrations (4 migrations)
│   ├── 20260207225751_initial-schema/    # Initial schema migration
│   │   ├── migration.sql
│   │   └── snapshot.json
│   ├── 20260209144243_heavy_molecule_man/  # Second migration
│   │   ├── migration.sql
│   │   └── snapshot.json
│   ├── 20260209153226_blushing_mister_fear/  # Third migration
│   │   ├── migration.sql
│   │   └── snapshot.json
│   └── 20260210230152_lame_kate_bishop/   # Fourth migration
│       ├── migration.sql
│       └── snapshot.json
│
├── scripts/                              # Development and utility scripts
│   ├── dev.sh                            # Development startup script
│   ├── dev-reset.sh                      # Reset development environment
│   ├── dev-stop.sh                       # Stop development services
│   ├── seed-completed-assessment.ts      # Seed test assessment data
│   └── README.md                         # Scripts documentation
│
├── docs/                                 # Documentation
│   ├── ARCHITECTURE.md                   # System architecture documentation
│   ├── COMMANDS.md                       # Available commands reference
│   ├── DEPLOYMENT.md                     # Production deployment guide
│   ├── NAMING-CONVENTIONS.md             # Naming conventions
│   ├── COMPLETED-STORIES.md              # Completed story documentation
│   ├── API-CONTRACT-SPECIFICATION.md     # API contract specification
│   ├── FRONTEND.md                       # Frontend patterns and conventions
│   └── project-scan-report.json          # Project analysis report
│
├── .github/workflows/                    # GitHub Actions
│   └── ci.yml                            # CI pipeline (lint -> build -> test -> validate)
│
├── docker/                               # Docker utilities
│
├── compose.yaml                          # Docker Compose (dev environment)
├── compose.test.yaml                     # Docker Compose (integration tests)
├── pnpm-workspace.yaml                   # Workspace + catalog dependencies
├── turbo.json                            # Turbo build orchestration
├── drizzle.config.ts                     # Drizzle migration config
├── biome.json                            # Root Biome config (extends @workspace/lint)
├── tsconfig.json                         # Root TypeScript config
├── vitest.config.ts                      # Root Vitest config
├── vitest.setup.ts                       # Vitest setup
├── vitest.workspace.ts                   # Vitest workspace config
├── package.json                          # Root package.json with workspace scripts
├── pnpm-lock.yaml                        # Dependency lockfile
├── CLAUDE.md                             # AI assistant guidance
└── README.md                             # Project README
```

---

## Critical Folders Explained

| Path | Purpose | When to Look Here |
|------|---------|-------------------|
| `apps/api/src/handlers/` | HTTP request adapters (thin controllers) | Adding new API endpoints, modifying HTTP responses |
| `apps/api/src/use-cases/` | Pure business logic (Effect programs) | Implementing features, writing business rules, debugging logic |
| `apps/api/src/use-cases/__tests__/` | Use-case unit tests with mock layers | Writing tests, understanding expected behavior |
| `apps/front/src/routes/` | Frontend pages (file-based routing) | Adding pages, modifying page components |
| `apps/front/src/components/` | React components | Building UI, modifying component behavior |
| `apps/front/src/hooks/` | Custom React hooks | State management, API integration |
| `apps/front/e2e/` | Playwright E2E tests | End-to-end testing, integration verification |
| `packages/domain/src/repositories/` | Port interfaces (Context.Tag) | Defining new dependencies, understanding contracts |
| `packages/domain/src/types/` | Branded types, type definitions | Type safety, understanding domain model |
| `packages/domain/src/constants/` | Big Five traits, facets, archetypes | Personality framework reference |
| `packages/domain/src/utils/` | Pure domain functions | OCEAN code generation, scoring, lookups |
| `packages/contracts/src/http/groups/` | HTTP API contract definitions | API design, type-safe endpoints |
| `packages/contracts/src/errors.ts` | HTTP-facing error types | Error handling, API error responses |
| `packages/infrastructure/src/repositories/` | Repository implementations | Database access, external integrations |
| `packages/infrastructure/src/repositories/__mocks__/` | Mock implementations for testing | Unit testing setup, mock behavior |
| `packages/infrastructure/src/db/drizzle/schema.ts` | Database schema (8 tables) | Schema changes, understanding data model |
| `packages/ui/src/components/` | Shared UI components (shadcn/ui) | Reusable components, design system |
| `packages/ui/src/styles/globals.css` | Global styles, color tokens | Theming, design tokens |
| `drizzle/` | Database migrations | Migration history, schema evolution |
| `scripts/` | Development scripts | Dev workflow, seeding data |
| `docs/` | Documentation | Architecture, conventions, deployment |

---

## Entry Points

### Backend API Server

**File:** `apps/api/src/index.ts`

**Purpose:** Effect-ts HTTP server entry point running on port 4000

**Key Responsibilities:**
- Initialize Effect-ts HTTP server with @effect/platform
- Register all HttpApiGroup handlers (assessment, profile, evidence, health)
- Configure middleware (CORS, Better Auth)
- Provide repository implementations via Effect layers

**Startup:** `pnpm dev --filter=api` or `pnpm build && node apps/api/dist/index.js`

### Frontend Application

**File:** `apps/front/src/routes/__root.tsx`

**Purpose:** TanStack Start root layout component

**Key Responsibilities:**
- Provide theme context (ThemeProvider)
- Provide TanStack Query context
- Render global Header component
- Define root layout structure

**Page Entry Points:**
- `/` - `apps/front/src/routes/index.tsx` (Home page)
- `/chat` - `apps/front/src/routes/chat/index.tsx` (Assessment chat)
- `/results` - `apps/front/src/routes/results.tsx` (Results display)
- `/results/:sessionId` - `apps/front/src/routes/results/$sessionId.tsx` (Session results)
- `/login` - `apps/front/src/routes/login.tsx` (Login)
- `/signup` - `apps/front/src/routes/signup.tsx` (Signup)
- `/dashboard` - `apps/front/src/routes/dashboard.tsx` (Dashboard)
- `/profile/:publicProfileId` - `apps/front/src/routes/profile.$publicProfileId.tsx` (Public profile)

**Startup:** `pnpm dev --filter=front`

### CLI Commands

**Development:**
```bash
pnpm dev                    # Start all services (API + Frontend)
pnpm dev --filter=api       # Start API only (port 4000)
pnpm dev --filter=front     # Start frontend only (port 3000)
```

**Database:**
```bash
pnpm db:migrate             # Apply Drizzle migrations
pnpm db:generate            # Generate migration from schema changes
pnpm db:studio              # Open Drizzle Studio
pnpm seed:test-assessment   # Seed test assessment data
```

**Testing:**
```bash
pnpm test:run               # Run all tests
pnpm test:watch             # Watch mode
pnpm test:coverage          # With coverage
pnpm test:integration       # Docker-based integration tests
```

**Build & Lint:**
```bash
pnpm build                  # Build all packages
pnpm lint                   # Lint all packages
pnpm format                 # Format all code
```

---

## Integration Points

### 1. API Uses Contracts

**Flow:** `packages/contracts` -> `apps/api/src/handlers`

The API handlers implement the contracts defined in the contracts package.

```
packages/contracts/src/http/groups/assessment.ts
    │
    │ Defines HttpApiGroup with endpoints:
    │   - POST /assessment (start assessment)
    │   - POST /assessment/:sessionId/message (send message)
    │   - GET /assessment/:sessionId/results (get results)
    │
    ▼
apps/api/src/handlers/assessment.ts
    │
    │ Implements handlers using HttpApiBuilder.group()
    │ Each handler calls corresponding use-case
    │
    ▼
apps/api/src/use-cases/*.ts
    │
    │ Pure business logic (Effect programs)
    │ Accesses repositories via Context.Tag
```

### 2. Frontend Uses Contracts (Type Safety)

**Flow:** `packages/contracts` -> `apps/front/src/hooks`

The frontend hooks use contract types for type-safe API calls.

```
packages/contracts/src/http/groups/assessment.ts
    │
    │ Exports request/response schema types
    │
    ▼
apps/front/src/hooks/use-assessment.ts
    │
    │ Uses contract types for TanStack Query
    │ Ensures request/response type safety
    │
    ▼
apps/front/src/components/TherapistChat.tsx
    │
    │ Uses hook with typed data
```

### 3. API Uses Domain (Dependency Inversion)

**Flow:** `packages/domain` -> `apps/api/src/use-cases` <- `packages/infrastructure`

Use-cases depend on domain interfaces, infrastructure provides implementations.

```
packages/domain/src/repositories/
    │
    │ Defines Context.Tag interfaces:
    │   - AssessmentSessionRepository
    │   - AssessmentMessageRepository
    │   - OrchestratorRepository
    │   - etc.
    │
    ├──────────────────────────────────────┐
    ▼                                      │
apps/api/src/use-cases/*.ts                │
    │                                      │
    │ Yields from Context.Tag:             │
    │   yield* AssessmentSessionRepository │
    │   yield* OrchestratorRepository      │
    │                                      │
    │                                      ▼
    │              packages/infrastructure/src/repositories/
    │                  │
    │                  │ Provides Layer implementations:
    │                  │   - AssessmentSessionDrizzleRepositoryLive
    │                  │   - OrchestratorLangGraphRepositoryLive
    │                  │   - etc.
    │                  │
    └──────────────────┘
            (Effect.provide() at runtime)
```

### 4. Frontend Uses Domain (Shared Types)

**Flow:** `packages/domain` -> `apps/front`

The frontend imports domain types for consistency.

```
packages/domain/src/
    │
    ├── constants/big-five.ts     # BIG_FIVE_TRAITS, ALL_FACETS
    ├── constants/archetypes.ts   # ARCHETYPES lookup
    ├── types/trait.ts            # TraitName, TraitScore
    ├── types/archetype.ts        # OceanCode, Archetype
    │
    ▼
apps/front/src/components/results/
    │
    │ Uses domain types for:
    │   - Trait visualization (TraitBar)
    │   - Archetype display (ArchetypeCard)
    │   - Facet breakdown (FacetBreakdown)
```

### 5. Infrastructure Uses Domain (Implements Interfaces)

**Flow:** `packages/domain` -> `packages/infrastructure`

Infrastructure implements the repository interfaces defined in domain.

```
packages/domain/src/repositories/assessment-session.repository.ts
    │
    │ export const AssessmentSessionRepository =
    │   Context.Tag<AssessmentSessionRepository>()
    │
    │ interface AssessmentSessionRepository {
    │   findById(id: SessionId): Effect<...>
    │   create(data: ...): Effect<...>
    │   updateStatus(...): Effect<...>
    │ }
    │
    ▼
packages/infrastructure/src/repositories/assessment-session.drizzle.repository.ts
    │
    │ export const AssessmentSessionDrizzleRepositoryLive =
    │   Layer.succeed(AssessmentSessionRepository, {
    │     findById: (id) => Effect.gen(function* () { ... }),
    │     create: (data) => Effect.gen(function* () { ... }),
    │     ...
    │   })
```

### 6. UI Package Integration

**Flow:** `packages/ui` -> `apps/front`

Frontend imports UI components from the shared library.

```
packages/ui/src/components/button.tsx
    │
    │ export function Button({ ... })
    │
    ▼
apps/front/src/components/Header.tsx
    │
    │ import { Button } from "@workspace/ui/components/button"
```

### 7. Database Schema Integration

**Flow:** `packages/infrastructure/src/db/drizzle/schema.ts` -> All database operations

All repository implementations use the centralized Drizzle schema.

```
packages/infrastructure/src/db/drizzle/schema.ts
    │
    │ Defines 8 tables:
    │   - user, session, account, verification (Better Auth)
    │   - assessment_session, assessment_message (Assessment)
    │   - facet_evidence, public_profile (Results)
    │
    ├── packages/infrastructure/src/repositories/*.drizzle.repository.ts
    │       (Repository implementations query these tables)
    │
    ├── drizzle/
    │       (Migrations generated from schema changes)
    │
    └── drizzle.config.ts
            (Configuration pointing to schema)
```

### 8. Test Layer Integration

**Flow:** `packages/infrastructure/src/repositories/__mocks__/` -> Test files

Tests use mock implementations via Vitest's vi.mock pattern.

```
packages/infrastructure/src/repositories/__mocks__/
    │
    │ Contains mock Layer exports matching real module names:
    │   - AssessmentSessionDrizzleRepositoryLive (mock)
    │   - OrchestratorLangGraphRepositoryLive (mock)
    │
    ▼
apps/api/src/use-cases/__tests__/*.test.ts
    │
    │ vi.mock("@workspace/infrastructure/repositories/...")
    │
    │ import { AssessmentSessionDrizzleRepositoryLive }
    │   from "@workspace/infrastructure/repositories/..."
    │
    │ // Vitest auto-resolves to __mocks__ sibling
    │
    │ const TestLayer = Layer.mergeAll(
    │   AssessmentSessionDrizzleRepositoryLive,
    │   ...
    │ )
    │
    │ it.effect('test', () => Effect.gen(...).pipe(
    │   Effect.provide(TestLayer)
    │ ))
```

---

## Summary

The big-ocean monorepo follows a clean hexagonal architecture with clear separation of concerns:

- **apps/api**: HTTP adapters and business logic orchestration
- **apps/front**: React-based UI with TanStack ecosystem
- **packages/domain**: Pure domain model with no external dependencies
- **packages/contracts**: Type-safe API contracts shared between frontend and backend
- **packages/infrastructure**: Concrete implementations of domain interfaces
- **packages/ui**: Reusable UI component library

The Effect-ts Context.Tag pattern enables clean dependency injection, making the codebase highly testable and maintainable. All business logic lives in use-cases, which depend only on abstract interfaces, allowing infrastructure details to be swapped or mocked easily.
