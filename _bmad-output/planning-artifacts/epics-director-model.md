---
stepsCompleted: ['step-01-validate-prerequisites', 'step-02-design-epics', 'step-03-create-stories', 'step-04-final-validation']
inputDocuments:
  - '_bmad-output/planning-artifacts/prd.md'
  - '_bmad-output/planning-artifacts/architecture-director-model.md'
  - '_bmad-output/planning-artifacts/ux-design-specification.md'
---

# big-ocean - Epic Breakdown: Director Model

## Overview

This document provides the complete epic and story breakdown for the **Director Model** initiative — replacing the territory-based pacing pipeline with a Nerin Director (LLM strategist) + Nerin Actor (voice) two-call model. Supersedes ADR-5/17-21 and architecture-conversation-pacing.md after implementation.

## Requirements Inventory

### Functional Requirements

FR1: Users can have a 25-exchange adaptive conversation with Nerin
FR2: Nerin responds using ocean/marine metaphors and dive master persona
FR3: Nerin Director steers Nerin Actor's content direction, emotional shape, and conversation strategy each turn (reframed from pacing pipeline)
FR4: Users can see a depth meter reflecting the conversation's progress
FR5: Users receive progress milestone markers at 25%, 50%, and 75% of the conversation
FR6: Nerin references patterns he is noticing about the user during the conversation to build anticipation for the portrait (≥2 specific pattern observations per assessment)
FR7: Nerin frames observations as invitations to explore — acknowledges pushback, offers alternative framing, redirects only on second rejection
FR8: Nerin includes a "this is not therapy" framing in the greeting
FR9: Nerin never uses diagnostic language or characterizes third parties the user mentions
FR10: Users can purchase a conversation extension (+25 exchanges) to continue with Nerin
FR11: Users can resume an abandoned conversation from where they left off
FR12: The conversation ends with a distinct closing exchange from Nerin before transitioning to results
FR13: Director crafts organic bridges between topics using conversation context (replaces territory transitions)
FR14: The system extracts facet evidence and energy signals from each user response via the extraction pipeline
FR15: The system computes 30 facet scores, 5 trait scores, OCEAN code, and archetype from conversation evidence (recomputed at read time)
FR16: Users can view their OCEAN code, archetype name, tribe feeling, and trait/facet scores on the results page
FR17: The system assigns one of 81 hand-curated archetypes based on the user's OCEAN code
FR18: The system presents all archetypes with positive, strength-based framing
FR19: Users can view a dashboard of their results, portrait, relationship analyses, and a link to their public profile
FR20: The system generates a narrative portrait written as a personal letter from Nerin using a high-capability LLM
FR21: Users are presented with a PWYW modal showing the founder's story and example portrait after completing the assessment
FR22: Users can view their portrait after payment
FR22a: One portrait purchase unlocks one portrait for the specific assessment result the user is viewing at checkout time
FR23: Conversation extension produces a new assessment result. Prior portrait remains attached to prior result as "previous version"
FR24: The system tracks behavioral proxies for portrait emotional impact: share rate, extension purchase rate, return visits within 48h
FR25: Conversation extension creates a new assessment session initialized from prior session's final state and evidence. New result has no portrait until purchased separately
FR26: Portrait generation is asynchronous — users are notified when ready
FR27: The system retries portrait generation on failure and informs the user if it ultimately fails
FR28: Users can initiate a relationship analysis by opening a QR drawer; the other person scans the QR code or opens the contained URL
FR29: The system generates a 2-person relationship analysis when both users have completed their assessments
FR30: The QR accept screen shows the initiator's archetype card, both users' confidence rings, and available credit balance, with Accept and Refuse buttons
FR31: Users see a ritual suggestion screen before accessing the relationship analysis
FR32: The relationship analysis describes relational dynamics without blame language and without exposing individual vulnerability data
FR33: Users receive one free relationship analysis credit upon completing their first portrait purchase (PWYW ≥€1). Additional credits cost €5 each
FR34: If one user deletes their account, the shared relationship analysis is deleted
FR35: Each relationship analysis is linked to both users' assessment results. All analyses preserved as snapshots with version detection via derive-at-read
FR36: Users receive an email notification when a relationship analysis they participated in is ready
FR37: The QR accept screen is only accessible to logged-in users with a completed assessment
FR38: The system tracks relationship analysis credits per user (1 free, additional purchased)
FR39: Users have a public profile page showing their archetype, OCEAN code, trait/facet scores, and framing line
FR40: Public profiles are default-private; users can explicitly make them public. Binary visibility only
FR41: Public profiles generate dynamic OG meta tags and archetype card images for social preview
FR42: Public profiles are accessible without authentication
FR43: Public profiles include a CTA to start the user's own assessment
FR44: Users can copy a shareable link to their public profile
FR45: When a logged-in user with a completed assessment views another user's public profile, a relationship analysis CTA is displayed
FR46: The system generates archetype card images per archetype (81 cards) — generic, not personalized
FR47: Users can pay for portraits via PWYW with embedded checkout. Default €5, minimum €1. Purchase scoped to current assessment result
FR48: Users can purchase relationship analysis credits via embedded checkout
FR49: Users can purchase conversation extensions via embedded checkout
FR50: Users can create an account with email and password. Account creation triggers a verification email. Unverified accounts cannot access authenticated features
FR50a: Verification email contains a unique link that expires after 1 week
FR50b: Users can request a new verification email from the verify-email page
FR51: Users can control the visibility of their public profile (binary: fully public or fully private)
FR52: Users are informed during onboarding that conversation data is stored
FR53: Users can delete their account, which deletes their data and any shared relationship analyses
FR54: Users are introduced to Nerin and the conversation format before the conversation begins
FR55: The system monitors per-session LLM costs against a budget threshold
FR56: The cost guard never blocks a user mid-session; budget protection applies at session boundaries
FR57: When cost guard triggers, users can retry sending their message
FR58: Users are informed when cost guard triggers and told they can retry
FR59: The homepage communicates what Big Ocean is and what the user receives within 3 seconds of landing
FR60: The homepage leads with a transformation-oriented hook — what the portrait reveals, not how the method works
FR61: The homepage has one primary CTA. No competing secondary CTAs
FR62: The homepage surfaces a concrete portrait excerpt within the first 40% of scroll depth
FR63: The homepage includes a Nerin conversation preview showing character depth and perceptiveness
FR64: The homepage addresses three visitor fears: process anxiety, time commitment, and self-exposure
FR65: The homepage surfaces the PWYW pricing model early as a trust signal
FR66: The homepage content works across multiple visitor types without assuming a specific entry motivation

### NonFunctional Requirements

NFR1: Nerin response time <2s P95 (server-side LLM call + pipeline processing)
NFR2: Public profile page LCP <1s
NFR3: Results page LCP <1.5s
NFR4: Chat page initial load <2s, subsequent interactions <200ms
NFR5: Portrait generation completes within 60s (async)
NFR6: Per-assessment LLM cost stays within ~€0.20 budget
NFR7: Per-portrait LLM cost stays within ~€0.20 budget
NFR8: All data in transit encrypted via TLS 1.3
NFR9: Authentication requires 12+ character passwords and compromised credential checks
NFR9a: Unverified accounts cannot access any authenticated route
NFR9b: Verification email links expire after 1 week
NFR10: Row-level data access control ensures users can only access their own data
NFR11: Public profiles default to private
NFR12: Conversation transcripts stored indefinitely; retrievable within 2s
NFR13: Relationship analysis data does not expose raw conversation transcripts
NFR14: Account deletion cascades to all user data and shared relationship analyses
NFR15: Assessment completion without errors >99%
NFR16: Portrait generation completes successfully >99%
NFR17: Portrait generation retries automatically on failure
NFR18: Cost guard never terminates an active session
NFR19: Conversation sessions are resumable after browser close or connection loss
NFR20: WCAG 2.1 AA compliance for: public profile, conversation UI, results page, PWYW modal
NFR21: Chat interface keyboard-navigable with proper ARIA labels
NFR22: Score visualizations have text alternatives
NFR23: Ocean theme color palette meets AA contrast ratios
NFR24: Proper focus management in modals
NFR25: Embedded checkout integration for PWYW, credits, and extension purchases
NFR26: The system can switch LLM providers without code changes
NFR27: Transactional email delivery (3 types + relationship analysis notifications within 5 min, >95% delivery rate)
NFR28: System logs include per-session cost, completion status, and error events in structured format
NFR29: Personality scores always recomputed from current facet evidence at read time

### Additional Requirements

**From Architecture (Director Model):**
- Nerin Director outputs a creative director brief (prose, 3 signals: content direction, emotional shape, structural constraint) — not JSON (ADR-DM-1)
- Nerin Director must quote or paraphrase the user's specific words in the brief — Nerin Actor has no conversation history (ADR-DM-1)
- Nerin Director receives full conversation history + dynamically injected coverage targets with facet/domain definitions (ADR-DM-2)
- Three-beat brief structure: Observation beat (when warranted) → Connection beat (when needed) → Question beat (always) (ADR-DM-2)
- Coverage analyzer: pure function computing confidence-by-domain-by-facet → targets weakest 3 facets in weakest domain (ADR-DM-2)
- Nerin Actor receives persona frame + brief only — no conversation history, no strategic instincts, no facet/domain awareness (ADR-DM-3)
- Nerin Actor prompt (~650 tokens): NERIN_PERSONA (shared with portrait) + ACTOR_VOICE_RULES + ACTOR_BRIEF_FRAMING (ADR-DM-3)
- NERIN_PERSONA positioning rewrite: remove "above user" framing, reframe Nerin as guide alongside (ADR-DM-3)
- Nerin Director failure: retry once (different temperature) → throw error → user retries message. No fallback brief (ADR-DM-4)
- Pipeline: 4 sequential steps — evidence extraction → coverage analysis → Nerin Director → Nerin Actor → save (ADR-DM-5)
- Evidence idempotency on retry: skip extraction if evidence already exists for current exchange (ADR-DM-5)
- Greeting (turn 0) static, closing variant swaps Nerin Director prompt on last turn (ADR-DM-5)
- Exchange table migration: drop ~15 pacing/scoring/governor columns, add director_output (text) + coverage_targets (jsonb) (ADR-DM-6)
- Also clean up assessment_message: drop territory_id and observed_energy_level if present (ADR-DM-6)
- Code deletion: ~25 files (pipeline functions, constants, types, nerin modules, tests) (ADR-DM-7)
- Code adaptation: ~12 files (pipeline rewrite, schema, seeds, nerin renames, barrel exports) (ADR-DM-7)
- Code creation: ~8 files (coverage analyzer, prompts, nerin-director repository + mock, migration, tests) (ADR-DM-7)
- Nerin prompt module audit: current ~6,000+ tokens → Director ~400-500 + Actor ~650 = ~1,050-1,150 combined (ADR-DM-8)
- Schema validation path: Effect Schema → Standard Schema v1 → LangChain structured output (replaces current JSON Schema → tool_use path)
- LangChain migration for ConversAnalyzer (evidence extraction schemas migrate to Standard Schema v1 path)
- Seed script rewrite: exchange-builder.ts must produce Director model exchange shape
- Empty steering/ subdirectory cleanup after file deletion
- Verify ADR-27 implementation status to determine ConversAnalyzer refactoring scope

**From UX Design:**
- Assessment invisibility principle: user should forget they are being assessed — no partial results, no scoring indicators mid-conversation
- Three-act conversation narrative structure with subtle UX shifts between acts (settling in, deep exploration, convergence)
- Three-surface model: Results page (private), Public profile (opt-in), Relationship analysis (auth-gated)
- Personality card always shareable regardless of profile privacy — links to public profile or redirects to homepage if private
- Energy-responsive ambient visualization responding to conversational energy, NOT personality dimensions
- Depth progress system: depth meter + unnamed milestones + Nerin in-conversation validation
- Evidence-linked results narrative connecting insights to specific conversation moments
- Immersive conversational interface departure from standard chat-bubble UI (design direction to evaluate)
- Mobile-first for conversation, results, public profile, and homepage
- Dynamic social previews via OG meta tags — must look correct on iMessage, Instagram, WhatsApp
- Recapture flow: auth-gate before conversation, automated email reminders for interrupted sessions
- Closing ritual: Nerin acknowledges the conversation as a whole before portrait transition
- Portrait reveal: layered revelation sequence (conversation ends → pause → visualization transforms → archetype name → portrait visual → narrative)
- Ritual suggestion screen for relationship analysis (read together, discuss, single Start button, no skip)
- Relationship comparison notification: framed as new discovery, not status update
- Homepage must convert within 90 seconds of attention — mobile-first, SSR for SEO
- WCAG 2.1 AA compliance for key surfaces

### FR Coverage Map

| FR | Epic | Description |
|----|------|-------------|
| FR2 | Epic 1 | Nerin persona — Actor prompt delivers dive master voice |
| FR3 | Epic 1 | Director steers Actor's content direction, emotional shape, strategy |
| FR6 | Epic 1 | Director self-regulates observation pacing (≥2 per assessment) |
| FR7 | Epic 1 | Pushback two-strikes instinct in Director prompt |
| FR9 | Epic 1 | Safety guardrails in Actor prompt (no diagnostic language) |
| FR12 | Epic 1 | Closing Director variant produces bold final observation |
| FR13 | Epic 1 | Director crafts organic bridges between topics |
| FR14 | Epic 1 | Evidence extraction decoupled from user-state (ConversAnalyzer cleanup) |

**FRs not in Director Model scope:** FR1, FR4-5, FR8, FR10-11, FR15-FR66 (unchanged by this architecture — covered by other epic documents)

## Epic List

### Epic 1: Director-Steered Conversations — Intelligent, Organic Conversation Steering
Users experience conversations where Nerin naturally explores personality dimensions through organic topic bridges, with observations that are specific to what the user actually said and emotionally calibrated to the moment. The territory-based pacing pipeline is replaced by a Director (strategist) + Actor (voice) two-call model steered by coverage analysis.
**FRs covered:** FR2, FR3, FR6, FR7, FR9, FR12, FR13, FR14 (partial)
**NFRs addressed:** NFR1 (latency <2s), NFR6 (cost ~€0.20), NFR15 (reliability >99%), NFR26 (provider switchability)
**Depends on:** Nothing — this is the core replacement

### Epic 2: Director Model Codebase Cleanup & Development Tools
Developers work with a clean codebase that reflects the Director model architecture — dead pipeline code is removed, seed scripts produce realistic Director-format data, and barrel exports are updated. No more ghost imports or stale types.
**FRs covered:** None directly (developer experience + codebase health)
**NFRs addressed:** NFR28 (observability — exchange table stores director_output)
**Depends on:** Epic 1 (old code becomes dead after pipeline replacement)

---

## Epic 1: Director-Steered Conversations — Intelligent, Organic Conversation Steering

Users experience conversations where Nerin naturally explores personality dimensions through organic topic bridges, with observations that are specific to what the user actually said and emotionally calibrated to the moment. The territory-based pacing pipeline is replaced by a Director (strategist) + Actor (voice) two-call model steered by coverage analysis.

### Story 1.1: Exchange Table Migration & Schema Changes

As a **system operator**,
I want the exchange table updated to store Director model output and the old pacing columns removed,
So that the pipeline can persist Director briefs and coverage targets for each turn.

**Acceptance Criteria:**

**Given** the assessment_exchange table has ~15 pacing/scoring/governor columns (energy, energy_band, telling, telling_band, within_message_shift, state_notes, smoothed_energy, session_trust, drain, trust_cap, e_target, scorer_output, selected_territory, selection_rule, governor_output, governor_debug, session_phase, transition_type)
**When** a new Drizzle migration is applied
**Then** those columns are dropped from assessment_exchange
**And** `director_output` (text, nullable) is added to assessment_exchange
**And** `coverage_targets` (jsonb, nullable) is added to assessment_exchange
**And** the migration file is appended (existing migrations untouched)

**Given** assessment_message may have territory_id and observed_energy_level columns
**When** the migration runs
**Then** those columns are dropped from assessment_message if present

**Given** the schema.ts file in infrastructure
**When** the Drizzle schema is updated
**Then** it reflects the new column structure (director_output, coverage_targets added; pacing columns removed)
**And** TypeScript compilation succeeds with no type errors in schema references

**Given** existing exchange data in the database
**When** the migration runs
**Then** existing rows are preserved (new columns are nullable — no data loss)

### Story 1.2: Coverage Analyzer — Evidence-to-Target Pure Function

As a **system operator**,
I want a pure function that analyzes conversation evidence and identifies the weakest personality facets in the weakest life domain,
So that the Director receives one coherent direction per turn for what to explore next.

**Acceptance Criteria:**

**Given** a set of conversation evidence records for a session
**When** the coverage analyzer runs
**Then** it builds a confidence matrix: `Map<LifeDomain, Map<FacetName, confidence>>`
**And** for each domain, it identifies the 3 lowest-confidence facets
**And** it selects the target domain as the domain with the lowest bottom-3 average confidence
**And** tiebreak uses the full domain average (all facets), selecting the weakest
**And** it returns `{ targetFacets: FacetName[], targetDomain: LifeDomain }`

**Given** the coverage analyzer returns target facets
**When** definitions are paired
**Then** each target facet includes its behavioral definition from existing domain constants
**And** the target domain includes its definition
**And** total injected definition text is ~100-150 tokens

**Given** a session with zero evidence (first turn)
**When** the coverage analyzer runs
**Then** all confidences are zero
**And** it returns any valid domain and its 3 weakest facets (deterministic tiebreak)

**Given** the coverage analyzer implementation
**When** it computes facet confidence
**Then** it reuses the existing `computeFacetConfidence()` formula: C_max × (1 - e^{-kW})
**And** no new scoring math is introduced

**Given** the function file at `domain/src/utils/coverage-analyzer.ts`
**When** unit tests run
**Then** all edge cases pass: zero evidence, uniform evidence, single-domain-heavy evidence, tiebreak scenarios

### Story 1.3: Nerin Director — Repository, Prompt, and LangChain Implementation

As a **system operator**,
I want a Nerin Director LLM call that reads the full conversation and produces a creative director brief steering Nerin Actor,
So that each turn has intelligent, context-aware steering based on what the user actually said.

**Acceptance Criteria:**

**Given** the Nerin Director repository interface at `domain/src/repositories/nerin-director.repository.ts`
**When** the interface is created
**Then** it follows the Context.Tag pattern (same as existing ConversAnalyzer, PortraitGenerator)
**And** it accepts: system prompt, full conversation history, coverage targets (facets + domain with definitions)
**And** it returns: creative director brief (plain text string)

**Given** the Nerin Director system prompt at `domain/src/constants/nerin-director-prompt.ts`
**When** the prompt is written
**Then** it includes the Director role and strategic instincts
**And** it includes brief output format guidance with the three-signal quality bar (content direction, emotional shape, structural constraint)
**And** it includes the three-beat brief structure: Observation (when warranted) → Connection (when needed) → Question (always)
**And** it includes 3 surviving instincts: story-over-abstraction, pushback-two-strikes, don't-fully-reveal
**And** it includes anti-patterns: never write dialogue, never suggest specific phrases, describe the beat not the line
**And** it includes the critical requirement: "Quote or paraphrase the user's specific words, images, and phrases in your brief"
**And** it includes domain/facet steering guidance: "Domains are where the conversation goes. Facets are what you're listening for"

**Given** the closing Director prompt at `domain/src/constants/nerin-director-closing-prompt.ts`
**When** the prompt is created
**Then** it instructs: "This is the final exchange. Make your boldest observation — name the core tension or pattern you've been watching build. Don't hold back. End with something that leaves them wanting more."

**Given** the Anthropic/LangChain implementation at `infrastructure/src/repositories/nerin-director.anthropic.repository.ts`
**When** it calls the LLM
**Then** it uses the Standard Schema v1 path (Effect Schema → Schema.standardSchemaV1() → LangChain structured output) where applicable
**And** it defaults to Sonnet model (configurable — Haiku as latency fallback)
**And** it implements retry once on failure with different temperature (ADR-DM-4)
**And** on second failure, it throws an error (no fallback brief)

**Given** the in-memory mock at `infrastructure/src/repositories/__mocks__/nerin-director.anthropic.repository.ts`
**When** used in unit tests via `vi.mock()`
**Then** it returns a deterministic test brief following the three-beat structure
**And** it follows the `Layer.succeed(Tag, implementation)` pattern

### Story 1.4: Nerin Actor — Persona Rewrite, Prompt, and Repository Adaptation

As a **system operator**,
I want Nerin Actor to voice Director briefs as Nerin's character — warm, specific, ocean-flavored — without access to conversation history or assessment strategy,
So that Nerin's responses sound authentically human while being precisely steered by the Director.

**Acceptance Criteria:**

**Given** the existing NERIN_PERSONA constant
**When** the positioning is rewritten (ADR-DM-3)
**Then** "Your edge" becomes "your comfort in the deep"
**And** "You see patterns other people miss" becomes "you've been paying attention long enough to notice things"
**And** the "most interesting person in the room" framing is reframed: the user IS fascinating to Nerin, not because Nerin performs attention, but because Nerin is genuinely fascinated
**And** any framing where Nerin is the performer or expert dispensing insight is removed
**And** "at Big Ocean — Vincent's dive shop" is added to the first sentence (absorbs ORIGIN_STORY grounding)
**And** the portrait prompt composition no longer imports ORIGIN_STORY (persona carries the identity)

**Given** the Nerin Actor prompt at `domain/src/constants/nerin-actor-prompt.ts`
**When** the prompt is composed
**Then** it composes NERIN_PERSONA (shared with portrait, ~650 tokens) + ACTOR_VOICE_RULES + ACTOR_BRIEF_FRAMING
**And** ACTOR_VOICE_RULES includes: emoji as hand signals (sparse, deliberate, ocean-themed), dry observation humor only, never undercut vulnerability, marine biology mirrors must be real
**And** ACTOR_BRIEF_FRAMING includes: "You will receive a brief from your creative director. Transform the direction into your words, your rhythm, your metaphors. Never repeat the brief's language directly."
**And** Nerin Actor knows nothing about: the assessment, facets, domains, conversation history, strategy

**Given** `nerin-agent.repository.ts` is renamed to `nerin-actor.repository.ts`
**When** the interface is adapted
**Then** conversation history is stripped from the interface — Actor receives only the actor prompt + director brief
**And** the repository returns `Stream<string>` for streaming responses (unchanged pattern)

**Given** `nerin-agent.anthropic.repository.ts` is renamed to `nerin-actor.anthropic.repository.ts`
**When** the implementation is adapted
**Then** prompt composition logic is stripped — it receives the pre-composed actor prompt + brief as input
**And** it defaults to Haiku model (Sonnet as quality fallback)
**And** streaming behavior is preserved

**Given** the mock is renamed to `nerin-actor.anthropic.repository.ts`
**When** used in unit tests
**Then** it returns a deterministic Nerin-voiced response
**And** it follows the `Layer.succeed(Tag, implementation)` pattern

### Story 1.5: Pipeline Orchestrator Rewrite — 4-Step Sequential Pipeline

As a **system operator**,
I want the conversation pipeline rewritten from the 6-layer pacing system to a 4-step Director model pipeline,
So that each user message produces an intelligently steered, character-voiced response through evidence → coverage → Director → Actor.

**Acceptance Criteria:**

**Given** a user sends a message during their conversation
**When** the pipeline processes it
**Then** the following steps execute sequentially:
1. Evidence extraction (existing Haiku call, three-tier fail-open unchanged)
2. Coverage analysis (pure function — reads all session evidence, returns targets)
3. Nerin Director (Sonnet/Haiku — receives system prompt + full history + coverage targets, returns brief)
4. Nerin Actor (Haiku — receives actor prompt + brief, streams response)
**And** the exchange is saved with director_output, coverage_targets, and extraction_tier
**And** user + assistant messages are saved

**Given** a user retries after a Nerin Director failure (ADR-DM-4)
**When** the pipeline processes the retry
**Then** evidence extraction is skipped if evidence already exists for this exchange (idempotency)
**And** the exchange row created before the Director call serves as the idempotency anchor
**And** coverage analysis re-runs (cheap — pure function)
**And** Director + Actor execute normally

**Given** it is turn 0 (greeting)
**When** the conversation starts
**Then** the greeting is a pre-generated static message (unchanged behavior)
**And** the Director/Actor pipeline does NOT run on turn 0

**Given** it is the last turn (turn 25 or configured limit)
**When** the pipeline processes the message
**Then** it swaps the Director system prompt to the closing variant (`nerin-director-closing-prompt.ts`)
**And** Nerin Actor voices the brief normally (it doesn't know it's the last turn)
**And** after Actor's streamed response, a static farewell message is appended (from existing `nerin-farewell.ts`)

**Given** evidence extraction defaults to neutral (Tier 3, empty evidence)
**When** the coverage analyzer runs
**Then** it uses prior evidence only (current turn contributes nothing)
**And** the Director gets slightly stale targets
**And** the conversation continues normally (fail-open preserved)

**Given** the advisory lock mechanism
**When** a message is processed
**Then** `pg_try_advisory_lock` per session prevents duplicate processing (unchanged)

**Given** the full pipeline runs end-to-end
**When** integration tests execute
**Then** the complete flow (message → evidence → coverage → Director → Actor → save → stream) works correctly
**And** exchange rows contain valid director_output and coverage_targets
**And** Nerin Actor's response streams to the frontend

### Story 1.6: ConversAnalyzer Cleanup — Strip User-State Extraction

As a **system operator**,
I want the ConversAnalyzer's user-state extraction removed since the Director reads energy and telling natively from conversation history,
So that the evidence extraction pipeline is simpler and the eliminated LLM call reduces cost and latency.

**Acceptance Criteria:**

**Given** the current ConversAnalyzer implementation
**When** ADR-27 implementation status is verified
**Then** one of two paths is taken:
- **If ADR-27 split is already implemented** (separate user-state and evidence calls): delete the user-state call entirely, keep evidence-only call
- **If ADR-27 split is NOT implemented** (single dual-purpose call): strip user-state extraction from the existing single call, keep evidence extraction only

**Given** the user-state extraction is removed
**When** the ConversAnalyzer repository interface is updated
**Then** any `analyzeUserState` method (or user-state portion of `analyze`) is removed
**And** the repository only exposes evidence extraction methods
**And** the pipeline no longer calls user-state extraction

**Given** the evidence extraction schemas
**When** they are migrated to Standard Schema v1 path
**Then** strict and lenient evidence schemas use `Schema.standardSchemaV1()` for LangChain integration
**And** the existing Effect Schema → JSON Schema → tool_use path is replaced
**And** three-tier fail-open behavior (strict ×3 → lenient ×1 → neutral defaults) is preserved

**Given** user-state extraction mocks exist in `__mocks__/`
**When** cleanup is applied
**Then** user-state mock implementations are deleted
**And** evidence extraction mocks are preserved and updated if needed
**And** all unit tests referencing user-state extraction are updated or removed

---

## Epic 2: Director Model Codebase Cleanup & Development Tools

Developers work with a clean codebase that reflects the Director model architecture — dead pipeline code is removed, seed scripts produce realistic Director-format data, and barrel exports are updated. No more ghost imports or stale types.

### Story 2.1: Delete Old Pipeline Code — Functions, Constants, and Types

As a **developer**,
I want all dead pipeline code removed from the codebase after the Director model replacement,
So that the codebase reflects the current architecture with no ghost imports, stale types, or misleading code paths.

**Acceptance Criteria:**

**Given** the Director model pipeline is operational (Epic 1 complete)
**When** old pipeline function files are deleted
**Then** the following files are removed from `domain/src/utils/`:
- `e-target.ts`
- `steering/territory-scorer.ts`
- `steering/territory-selector.ts`
- `steering/move-governor.ts`
- `steering/prompt-builder.ts`
**And** the `steering/` subdirectory is removed (empty after deletions)

**Given** old pipeline constants are no longer referenced
**When** constant files are deleted
**Then** the following files are removed from `domain/src/constants/`:
- `territory-catalog.ts`
- `band-mappings.ts`
- `scorer-defaults.ts`
- `pacing-defaults.ts`

**Given** old pipeline types are no longer referenced
**When** type files are deleted
**Then** the following files are removed from `domain/src/types/`:
- `prompt-builder-input.ts`
- `scorer-output.ts`
- `selector-output.ts`
- `governor-debug.ts`
- `user-state.ts`
- `territory.ts`

**Given** old Nerin prompt modules are distributed or deleted per ADR-DM-8
**When** module files are deleted
**Then** the following are removed from `domain/src/constants/nerin/`:
- `steering-templates.ts`
- `pressure-modifiers.ts`
- `contextual-mirrors.ts` (mirror-lookup.ts)
- `nerin-chat-context.ts`
- `reflect.ts`
- `observation-quality-common.ts`
- `threading-common.ts`
- `conversation-mode.ts`
- `origin-story.ts`

**Given** all associated test files exist in `__tests__/` directories
**When** the source files are deleted
**Then** all corresponding test files are deleted
**And** TypeScript compilation succeeds with no import errors
**And** `pnpm typecheck` passes across all packages

### Story 2.2: Seed Script & Exchange Builder Rewrite for Director Model

As a **developer**,
I want the seed scripts updated to produce realistic Director-model exchange data,
So that local development and testing use data that matches the current pipeline architecture.

**Acceptance Criteria:**

**Given** `scripts/seed-completed-assessment.ts` uses `exchange-builder.ts` that calls old pipeline functions (scorer, governor)
**When** the exchange builder is rewritten
**Then** it produces exchange rows with:
- `director_output`: realistic sample creative director briefs following the three-beat structure
- `coverage_targets`: valid `{ targetFacets: string[], targetDomain: string }` jsonb
- `extraction_tier`: preserved (evidence extraction unchanged)
**And** it no longer calls old pipeline functions (scorer, governor, selector, prompt-builder)
**And** it no longer produces old pacing columns (energy, e_target, scorer_output, governor_output, etc.)

**Given** the seed script creates a test user with a completed assessment
**When** `pnpm seed:test-assessment` runs
**Then** it produces a complete assessment with 12 messages, 30 facet scores, 5 trait scores, ~40 evidence records (unchanged)
**And** exchange rows contain valid director_output and coverage_targets
**And** the seeded data is consistent with the Director model schema

**Given** `pnpm dev` auto-seeds the database
**When** a developer starts local development
**Then** the auto-seed produces Director-model-compatible data
**And** no errors related to missing pacing columns occur

### Story 2.3: Barrel Export Cleanup & ConversAnalyzer Mock Removal

As a **developer**,
I want barrel exports updated and dead mocks removed so that imports resolve cleanly and the test infrastructure matches the current architecture.

**Acceptance Criteria:**

**Given** `domain/src/constants/nerin/index.ts` exports deleted modules
**When** the barrel is updated
**Then** all exports for deleted modules are removed (steering-templates, pressure-modifiers, contextual-mirrors, nerin-chat-context, reflect, observation-quality-common, threading-common, conversation-mode, origin-story)
**And** new exports are added for nerin-actor-prompt.ts and nerin-director-prompt.ts (if not already exported)

**Given** `domain/src/index.ts` exports deleted types and constants
**When** the barrel is updated
**Then** all exports for deleted types are removed (PromptBuilderInput, ScorerOutput, SelectorOutput, GovernorDebug, UserState, Territory, TerritoryId, etc.)
**And** all exports for deleted constants are removed (territory-catalog, band-mappings, scorer-defaults, pacing-defaults)
**And** new exports are added for coverage-analyzer, nerin-director.repository

**Given** ConversAnalyzer user-state extraction mocks exist in `__mocks__/`
**When** dead mocks are removed
**Then** user-state-specific mock implementations are deleted
**And** evidence extraction mocks remain functional

**Given** all cleanup is complete
**When** the full test suite runs
**Then** `pnpm typecheck` passes
**And** `pnpm test:run` passes
**And** `pnpm lint` passes
**And** no import errors or unresolved references remain
