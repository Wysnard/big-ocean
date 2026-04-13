# Blind Hunter Review Prompt

Use the `bmad-review-adversarial-general` skill.

## Role
You are the Blind Hunter. Review the diff adversarially with **no project context**. Work from the diff only. Surface concrete bugs, regressions, dangerous assumptions, maintainability traps, and suspicious changes. Ignore style nitpicks unless they hide a real risk.

## Output format
Return a Markdown list. Each finding must include:
- one-line title
- severity (`high`, `medium`, or `low`)
- evidence from the diff
- why it matters

Report only real findings. If nothing is wrong, say `No findings.`

## Diff

```diff
diff --git a/_bmad-output/implementation-artifacts/3-2-identity-hero-section.md b/_bmad-output/implementation-artifacts/3-2-identity-hero-section.md
new file mode 100644
index 00000000..a7e5ace9
--- /dev/null
+++ b/_bmad-output/implementation-artifacts/3-2-identity-hero-section.md
@@ -0,0 +1,235 @@
+# Story 3.2: Identity Hero Section
+
+Status: review
+
+## Story
+
+As a user on my Me page,
+I want to see my archetype, OCEAN code, radar chart, and confidence at the top,
+so that my personality identity is immediately visible and celebrated.
+
+## Acceptance Criteria
+
+1. **Given** the Me page is loaded with assessment results **When** the Identity Hero section renders **Then** it displays the user's archetype name using the existing `ArchetypeHeroSection` component.
+2. **And** the OCEAN code is rendered using the existing `OceanCodeStrand` component with interactive tooltips.
+3. **And** the `PersonalityRadarChart` renders the user's 5 trait scores.
+4. **And** the existing `ConfidenceRingCard` shows the assessment confidence level.
+5. **And** all hero subcomponents receive data from the same TanStack Query result object sourced from `useGetResults(sessionId)` — no duplicate fetches or secondary queries inside the hero composition.
+
+## Tasks / Subtasks
+
+- [x] Task 1: Build the Me-page identity composition component (AC: 1-5)
+  - [x] Create or finish `apps/front/src/components/me/IdentityHeroSection.tsx` as a pure composition component that accepts `results: GetResultsResponse`
+  - [x] Do **not** call `useGetResults()` or any other data hook inside `IdentityHeroSection`; the `/me` route owns fetching and passes the query result down
+  - [x] Derive `dominantTrait` from `results.traits` via `getDominantTrait()` from `apps/front/src/lib/trait-utils.ts`
+  - [x] Normalize `results.overallConfidence` from API scale `0-100` to component scale `0-1` before passing it into `ArchetypeHeroSection` and `ConfidenceRingCard`
+
+- [x] Task 2: Reuse existing results-surface components without reinventing them (AC: 1-4)
+  - [x] Render `ArchetypeHeroSection` first, reusing the existing hero component from `apps/front/src/components/results/ArchetypeHeroSection.tsx`
+  - [x] Render `OceanCodeStrand` below the hero using `results.oceanCode5`
+  - [x] Render `PersonalityRadarChart` and `ConfidenceRingCard` in a `grid grid-cols-1 sm:grid-cols-2 gap-5`
+  - [x] Keep the Me page section landmark owned by `MePageSection`; avoid nested landmark confusion by not introducing a second user-facing section heading for the same semantic section
+
+- [x] Task 3: Respect current Me-page layout and styling conventions (AC: 1-5)
+  - [x] Keep the composition inside the existing `MePageSection` shell in `apps/front/src/routes/me/index.tsx`
+  - [x] Make the hero visually bleed to the section edges using local wrapper spacing only if needed; do not break the `MePageSection` card rhythm used by Story 3.1
+  - [x] Preserve existing `data-testid` attributes on the Me page route and sections
+  - [x] Use existing Tailwind/data-slot conventions from `docs/FRONTEND.md`; do not replace `data-testid` with `data-slot`
+
+- [x] Task 4: Wire the section in the `/me` route without duplicate queries (AC: 5)
+  - [x] In `apps/front/src/routes/me/index.tsx`, keep `useGetResults(sessionId)` as the single source of identity data for the page
+  - [x] Render `<IdentityHeroSection results={results} />` inside the `me-section-identity-hero` section when results exist
+  - [x] Keep loading and error states in the route, not inside the hero component
+
+- [x] Task 5: Add focused test coverage for composition and route integration (AC: 1-5)
+  - [x] Add or update `apps/front/src/components/me/__tests__/IdentityHeroSection.test.tsx`
+  - [x] Verify the composition renders `ArchetypeHeroSection`, `OceanCodeStrand`, `PersonalityRadarChart`, and `ConfidenceRingCard`
+  - [x] Verify `IdentityHeroSection` remains a prop-driven component that can render without React Query providers
+  - [x] Update `apps/front/src/routes/-three-space-routes.test.tsx` so the `/me` route still proves the identity section renders from the route-level results query
+  - [x] Keep tests out of `apps/front/src/routes/me/` per TanStack Router file-routing rules
+
+## Dev Notes
+
+### Story intent
+
+This story fills the **top section only** of the `/me` page scaffold created in Story 3.1. It is a composition story, not a net-new data or domain story. The implementation should reuse the existing results components and arrange them for the Me page's “identity sanctuary” presentation.
+
+### Previous Story Intelligence
+
+From `3-1-me-page-route-and-section-layout.md`:
+- `/me` already resolves `sessionId` in `beforeLoad` using `listConversationsQueryOptions()` and redirects incomplete users back to `/chat`
+- `/me` already fetches results via `useGetResults(sessionId)`
+- `MePageSection` already owns section semantics, spacing, and test hooks
+- Loading and error states already exist at the route level and should remain there
+- The account/settings link and 7-section layout are already in place
+
+**Implication for this story:** do not add a second query path, do not introduce a new API surface, and do not bypass `MePageSection`.
+
+### Existing code to reuse
+
+| Concern | Reuse this | Notes |
+|---|---|---|
+| Me page data source | `apps/front/src/hooks/use-conversation.ts` → `useGetResults(sessionId)` | Single TanStack Query source for the whole page |
+| Hero visual shell | `apps/front/src/components/results/ArchetypeHeroSection.tsx` | Already renders archetype name, glyph code, OCEAN letters, optional confidence, description |
+| OCEAN explanation card | `apps/front/src/components/results/OceanCodeStrand.tsx` | Already has interactive tooltips and trait-level descriptions |
+| Radar chart | `apps/front/src/components/results/PersonalityRadarChart.tsx` | Accepts `traits` array directly |
+| Confidence display | `apps/front/src/components/results/ConfidenceRingCard.tsx` | Expects confidence on `0-1` scale |
+| Dominant trait derivation | `apps/front/src/lib/trait-utils.ts` | Reuse `getDominantTrait()`; do not duplicate logic |
+| Me section shell | `apps/front/src/components/me/MePageSection.tsx` | Owns the outer section heading/landmark |
+
+### Architecture compliance guardrails
+
+- **Frontend data rule:** Use the typed Effect `HttpApiClient` path already wrapped by `useGetResults`; never add raw `fetch`
+- **Single-query rule:** Identity Hero must consume the same `GetResultsResponse` object already fetched by `/me`
+- **Reuse-over-rebuild rule:** This story composes existing results components; do not fork or clone `ArchetypeHeroSection`, `OceanCodeStrand`, `PersonalityRadarChart`, or `ConfidenceRingCard`
+- **No business logic in route rendering:** Only lightweight view composition/normalization belongs here
+- **No route-file test placement:** tests must stay in `-three-space-routes.test.tsx` or a sibling `__tests__` folder
+
+### Critical implementation details
+
+#### 1. Confidence scale mismatch is the main footgun
+
+`GetResultsResponse.overallConfidence` comes back from the API on a `0-100` scale, while:
+- `ArchetypeHeroSection` does `Math.round(overallConfidence * 100)`
+- `ConfidenceRingCard` does `Math.round(confidence * 100)` and `confidence * 360`
+
+So the composition layer must convert:
+
+```ts
+const confidenceNormalised = results.overallConfidence / 100;
+```
+
+Then pass `confidenceNormalised` to both components.
+
+#### 2. Me page section semantics
+
+`MePageSection` already renders:
+- `<section aria-label={title}>`
+- the visible `h2`
+- standard card spacing and section rhythm
+
+`ArchetypeHeroSection` internally renders its own `<section>`. Avoid introducing duplicate user-facing section headings or extra route-level landmarks around it. Keep the Me page section shell as the semantic owner and treat the hero component as presentational content within it.
+
+#### 3. No duplicate fetching
+
+The `/me` route already does:
+
+```ts
+const { data: results, isLoading, error, refetch } = useGetResults(sessionId);
+```
+
+The hero component must stay prop-based:
+
+```tsx
+<IdentityHeroSection results={results} />
+```
+
+Do **not** add:
+- a second `useGetResults()` call inside `IdentityHeroSection`
+- a custom API helper just for the hero
+- per-subcomponent queries
+
+### File structure requirements
+
+**Primary files to touch**
+- `apps/front/src/components/me/IdentityHeroSection.tsx`
+- `apps/front/src/routes/me/index.tsx`
+- `apps/front/src/components/me/__tests__/IdentityHeroSection.test.tsx`
+- `apps/front/src/routes/-three-space-routes.test.tsx`
+
+**Likely reused but not modified unless required**
+- `apps/front/src/components/results/ArchetypeHeroSection.tsx`
+- `apps/front/src/components/results/OceanCodeStrand.tsx`
+- `apps/front/src/components/results/PersonalityRadarChart.tsx`
+- `apps/front/src/components/results/ConfidenceRingCard.tsx`
+- `apps/front/src/lib/trait-utils.ts`
+
+### Testing requirements
+
+- Use Vitest + Testing Library
+- Mock child components that pull in Recharts or Radix Tooltip when unit-testing `IdentityHeroSection`
+- Keep the composition test focused on prop wiring and render presence, not child internals
+- Route test should continue proving `/me` renders the identity section for a completed assessment
+- Preserve all existing `data-testid` selectors
+
+### Git intelligence summary
+
+Recent commits relevant to this story:
+- `4aa634ee feat(front): Story 3.1 — Me page route and section layout (#225)`
+- `dd18c4eb fix: update sprint-status.yaml to reflect completion of Epic 10 and associated tasks`
+- `4e6deb3a fix(e2e): update locators for renamed farewell link and portrait view`
+
+**What this implies:** the `/me` page scaffold is fresh, tests were recently updated, and this story should be implemented as an incremental continuation of Story 3.1 rather than a redesign.
+
+### Latest codebase intelligence
+
+A current `IdentityHeroSection` implementation already exists in:
+- `apps/front/src/components/me/IdentityHeroSection.tsx`
+
+If continuing work from the current branch state, review it before changing anything. It already establishes the correct composition pattern:
+- prop-driven `results`
+- `getDominantTrait([...results.traits])`
+- `results.overallConfidence / 100`
+- reuse of the four existing results components
+
+Treat that file as the likely target for completion/refinement, not proof that the story should be reimplemented from scratch.
+
+### Project context reference
+
+- No `project-context.md` file was found in the repository during artifact discovery.
+- Frontend conventions come from `docs/FRONTEND.md` and repository rules in `CLAUDE.md`.
+
+### References
+
+- [Source: _bmad-output/planning-artifacts/epics.md#Story-3.2-Identity-Hero-Section]
+- [Source: _bmad-output/planning-artifacts/epics.md#Epic-3-Me-Page--Identity-Sanctuary]
+- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#152-Me-Page-Specification-me]
+- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#OceanCodeStrand]
+- [Source: _bmad-output/planning-artifacts/architecture.md#Component-Boundaries]
+- [Source: docs/FRONTEND.md#Data-Fetching]
+- [Source: docs/FRONTEND.md#Testing-with-Data-Attributes]
+- [Source: _bmad-output/implementation-artifacts/3-1-me-page-route-and-section-layout.md]
+- [Source: apps/front/src/routes/me/index.tsx]
+- [Source: apps/front/src/components/me/MePageSection.tsx]
+- [Source: apps/front/src/components/me/IdentityHeroSection.tsx]
+- [Source: apps/front/src/components/results/ArchetypeHeroSection.tsx]
+- [Source: apps/front/src/components/results/OceanCodeStrand.tsx]
+- [Source: apps/front/src/components/results/PersonalityRadarChart.tsx]
+- [Source: apps/front/src/components/results/ConfidenceRingCard.tsx]
+- [Source: apps/front/src/hooks/use-conversation.ts]
+- [Source: apps/front/src/lib/trait-utils.ts]
+
+## Dev Agent Record
+
+### Agent Model Used
+
+GPT-5 Codex
+
+### Debug Log References
+
+- `pnpm vitest run apps/front/src/components/me/__tests__/IdentityHeroSection.test.tsx apps/front/src/routes/-three-space-routes.test.tsx`
+- `pnpm --filter front typecheck`
+- `pnpm exec biome check vitest.setup.ts apps/front/src/components/me/__tests__/IdentityHeroSection.test.tsx apps/front/src/routes/-three-space-routes.test.tsx apps/front/src/components/me/IdentityHeroSection.tsx apps/front/src/routes/me/index.tsx`
+
+### Completion Notes List
+
+- Completed the Me-page identity hero composition by wiring `IdentityHeroSection` into `/me` while keeping `useGetResults(sessionId)` as the route-owned single query source.
+- Reused `ArchetypeHeroSection`, `OceanCodeStrand`, `PersonalityRadarChart`, and `ConfidenceRingCard`, with dominant trait derived via `getDominantTrait()` and confidence normalized from `0-100` to `0-1` before prop handoff.
+- Preserved the `MePageSection` semantic shell, existing `data-testid` hooks, and the Story 3.1 card rhythm while allowing the hero content to bleed to section edges.
+- Added focused composition assertions for child-component wiring and route integration coverage for the `/me` identity section.
+- Added universal root Vitest DOM matcher setup so jsdom tests using `toBeInTheDocument()` and `toHaveAttribute()` pass consistently from the repo root.
+- Validation completed with targeted Vitest, frontend typecheck, and changed-file Biome checks. A full `pnpm --filter front check` still reports pre-existing unrelated diagnostics elsewhere in the frontend package.
+
+### File List
+
+- `_bmad-output/implementation-artifacts/3-2-identity-hero-section.md`
+- `apps/front/src/components/me/IdentityHeroSection.tsx`
+- `apps/front/src/components/me/__tests__/IdentityHeroSection.test.tsx`
+- `apps/front/src/lib/trait-utils.ts`
+- `apps/front/src/routes/-three-space-routes.test.tsx`
+- `apps/front/src/routes/me/index.tsx`
+- `vitest.setup.ts`
+
+### Change Log
+
+- 2026-04-13: Completed Story 3.2 identity hero composition, route wiring, and focused test coverage; moved story to `review`.
+
+diff --git a/apps/front/src/components/me/IdentityHeroSection.tsx b/apps/front/src/components/me/IdentityHeroSection.tsx
+new file mode 100644
+index 00000000..1ee52f25
+--- /dev/null
++++ b/apps/front/src/components/me/IdentityHeroSection.tsx
+@@ -0,0 +1,55 @@
++import type { GetResultsResponse } from "@workspace/contracts";
++import { ArchetypeHeroSection } from "@/components/results/ArchetypeHeroSection";
++import { ConfidenceRingCard } from "@/components/results/ConfidenceRingCard";
++import { OceanCodeStrand } from "@/components/results/OceanCodeStrand";
++import { PersonalityRadarChart } from "@/components/results/PersonalityRadarChart";
++import { getDominantTrait } from "@/lib/trait-utils";
++
++interface IdentityHeroSectionProps {
++	/**
++	 * Full results object from useGetResults — no duplicate fetch.
++	 * overallConfidence is on a 0-100 scale from the API; we divide by 100
++	 * before passing to ArchetypeHeroSection and ConfidenceRingCard which
++	 * both expect a 0-1 input.
++	 */
++	results: GetResultsResponse;
++}
++
++export function IdentityHeroSection({ results }: IdentityHeroSectionProps) {
++	const dominantTrait = getDominantTrait([...results.traits]);
++
++	// API returns overallConfidence on 0-100 scale (e.g. 68).
++	// ArchetypeHeroSection and ConfidenceRingCard both do `confidence * 100`
++	// internally, so we normalise to 0-1 here.
++	const confidenceNormalised = results.overallConfidence / 100;
++
++	return (
++		<div className="overflow-hidden -m-6 sm:-m-8">
++			{/* ArchetypeHeroSection renders its own <section> element.
++			    MePageSection owns the outer <section> landmark (aria-label="Identity Hero"),
++			    so we deliberately omit sectionLabel here to avoid duplicate landmarks. */}
++			<ArchetypeHeroSection
++				archetypeName={results.archetypeName}
++				oceanCode5={results.oceanCode5}
++				dominantTrait={dominantTrait}
++				description={results.archetypeDescription}
++				overallConfidence={confidenceNormalised}
++				isCurated={results.isCurated}
++				/* No displayName — this is the user's own page ("Your Personality Archetype") */
++				/* No showScrollIndicator — only for the results hero */
++				/* No sectionLabel — MePageSection owns the landmark */
++			/>
++
++			{/* OceanCodeStrand — full width */}
++			<div className="px-6 pb-6 pt-4 space-y-5 sm:px-8 sm:pb-8">
++				<OceanCodeStrand oceanCode5={results.oceanCode5} />
++
++				{/* PersonalityRadarChart + ConfidenceRingCard — side-by-side on sm+ */}
++				<div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
++					<PersonalityRadarChart traits={results.traits} />
++					<ConfidenceRingCard confidence={confidenceNormalised} messageCount={results.messageCount} />
++				</div>
++			</div>
++		</div>
++	);
++}
+
+diff --git a/apps/front/src/components/me/__tests__/IdentityHeroSection.test.tsx b/apps/front/src/components/me/__tests__/IdentityHeroSection.test.tsx
+new file mode 100644
+index 00000000..51cb3eeb
+--- /dev/null
++++ b/apps/front/src/components/me/__tests__/IdentityHeroSection.test.tsx
+@@ -0,0 +1,143 @@
++// @vitest-environment jsdom
++
++import { render, screen } from "@testing-library/react";
++import type { GetResultsResponse } from "@workspace/contracts";
++import { beforeEach, describe, expect, it, vi } from "vitest";
++
++const {
++	mockArchetypeHeroSection,
++	mockOceanCodeStrand,
++	mockPersonalityRadarChart,
++	mockConfidenceRingCard,
++} = vi.hoisted(() => ({
++	mockArchetypeHeroSection: vi.fn(),
++	mockOceanCodeStrand: vi.fn(),
++	mockPersonalityRadarChart: vi.fn(),
++	mockConfidenceRingCard: vi.fn(),
++}));
++
++// Mock all child components that contain Recharts / Radix Tooltip.
++// IdentityHeroSection is a composition component — we test that the right
++// sub-components are rendered with the right props, not their internal rendering.
++vi.mock("@/components/results/ArchetypeHeroSection", () => ({
++	ArchetypeHeroSection: (props: {
++		archetypeName: string;
++		oceanCode5: string;
++		dominantTrait: string;
++		overallConfidence: number;
++	}) => {
++		mockArchetypeHeroSection(props);
++		return (
++			<section data-testid="archetype-hero-section">
++				<h1 data-testid="archetype-name">{props.archetypeName}</h1>
++				<div data-testid="ocean-code">{props.oceanCode5}</div>
++			</section>
++		);
++	},
++}));
++
++vi.mock("@/components/results/OceanCodeStrand", () => ({
++	OceanCodeStrand: (props: { oceanCode5: string }) => {
++		mockOceanCodeStrand(props);
++		return <div data-slot="ocean-code-strand" />;
++	},
++}));
++
++vi.mock("@/components/results/PersonalityRadarChart", () => ({
++	PersonalityRadarChart: (props: { traits: GetResultsResponse["traits"] }) => {
++		mockPersonalityRadarChart(props);
++		return <div data-slot="personality-radar-chart" />;
++	},
++}));
++
++vi.mock("@/components/results/ConfidenceRingCard", () => ({
++	ConfidenceRingCard: (props: { confidence: number; messageCount: number }) => {
++		mockConfidenceRingCard(props);
++		return <div data-slot="confidence-ring-card" />;
++	},
++}));
++
++import { IdentityHeroSection } from "../IdentityHeroSection";
++
++// OCEAR = Open-minded / Conscientious / Extravert / Agreeable / Resilient — valid hieroglyph pattern
++const mockResults: GetResultsResponse = {
++	oceanCode5: "OCEAR" as GetResultsResponse["oceanCode5"],
++	oceanCode4: "OCEA" as GetResultsResponse["oceanCode4"],
++	archetypeName: "The Deep Current",
++	archetypeDescription: "A calm, observant presence with depth.",
++	archetypeColor: "#3B82F6",
++	isCurated: true,
++	traits: [
++		{ name: "openness", score: 90, level: "O", confidence: 85 },
++		{ name: "conscientiousness", score: 65, level: "S", confidence: 70 },
++		{ name: "extraversion", score: 40, level: "I", confidence: 75 },
++		{ name: "agreeableness", score: 80, level: "A", confidence: 80 },
++		{ name: "neuroticism", score: 30, level: "R", confidence: 65 },
++	],
++	facets: [],
++	overallConfidence: 75, // 0-100 scale from the API
++	messageCount: 24,
++	publicProfileId: null,
++	shareableUrl: null,
++	isPublic: false,
++	isLatestVersion: true,
++};
++
++describe("IdentityHeroSection", () => {
++	beforeEach(() => {
++		vi.clearAllMocks();
++	});
++
++	it("renders the archetype name via ArchetypeHeroSection", () => {
++		render(<IdentityHeroSection results={mockResults} />);
++		const archetypeNameEl = screen.getByTestId("archetype-name");
++		expect(archetypeNameEl).toBeInTheDocument();
++		expect(archetypeNameEl).toHaveTextContent("The Deep Current");
++	});
++
++	it("renders the ArchetypeHeroSection container (data-testid)", () => {
++		render(<IdentityHeroSection results={mockResults} />);
++		expect(screen.getByTestId("archetype-hero-section")).toBeInTheDocument();
++	});
++
++	it("renders OceanCodeStrand via data-slot", () => {
++		const { container } = render(<IdentityHeroSection results={mockResults} />);
++		expect(container.querySelector('[data-slot="ocean-code-strand"]')).toBeInTheDocument();
++	});
++
++	it("renders PersonalityRadarChart via data-slot", () => {
++		const { container } = render(<IdentityHeroSection results={mockResults} />);
++		expect(container.querySelector('[data-slot="personality-radar-chart"]')).toBeInTheDocument();
++	});
++
++	it("renders ConfidenceRingCard via data-slot", () => {
++		const { container } = render(<IdentityHeroSection results={mockResults} />);
++		expect(container.querySelector('[data-slot="confidence-ring-card"]')).toBeInTheDocument();
++	});
++
++	it("derives the dominant trait and normalises confidence before passing props down", () => {
++		render(<IdentityHeroSection results={mockResults} />);
++
++		expect(mockArchetypeHeroSection).toHaveBeenCalledWith(
++			expect.objectContaining({
++				archetypeName: "The Deep Current",
++				oceanCode5: "OCEAR",
++				dominantTrait: "openness",
++				overallConfidence: 0.75,
++			}),
++		);
++		expect(mockOceanCodeStrand).toHaveBeenCalledWith({ oceanCode5: "OCEAR" });
++		expect(mockPersonalityRadarChart).toHaveBeenCalledWith({ traits: mockResults.traits });
++		expect(mockConfidenceRingCard).toHaveBeenCalledWith({
++			confidence: 0.75,
++			messageCount: 24,
++		});
++	});
++
++	it("does not call any data-fetching hooks — accepts results as a prop only", () => {
++		// IdentityHeroSection should not call useGetResults or any other hook.
++		// Rendering without QueryClientProvider or any provider confirms this:
++		// if a hook were called, React would throw a context error before this passes.
++		expect(() => render(<IdentityHeroSection results={mockResults} />)).not.toThrow();
++	});
++});
+
+diff --git a/apps/front/src/lib/trait-utils.ts b/apps/front/src/lib/trait-utils.ts
+new file mode 100644
+index 00000000..56e269e0
+--- /dev/null
++++ b/apps/front/src/lib/trait-utils.ts
+@@ -0,0 +1,11 @@
++import type { TraitName, TraitResult } from "@workspace/domain";
++
++/**
++ * Returns the dominant (highest-scoring) trait from a list of trait results.
++ * Falls back to "openness" when the array is empty.
++ */
++export function getDominantTrait(traits: TraitResult[]): TraitName {
++	if (traits.length === 0) return "openness";
++	const sorted = [...traits].sort((a, b) => b.score - a.score);
++	return sorted[0].name;
++}
+
+diff --git a/apps/front/src/routes/-three-space-routes.test.tsx b/apps/front/src/routes/-three-space-routes.test.tsx
+index d621c708..fc95f921 100644
+--- a/apps/front/src/routes/-three-space-routes.test.tsx
++++ b/apps/front/src/routes/-three-space-routes.test.tsx
+@@ -58,6 +58,10 @@ vi.mock("@/components/BottomNav", () => ({
+ 	BottomNav: () => <div data-testid="bottom-nav-root" />,
+ }));
+ 
++vi.mock("@/components/me/IdentityHeroSection", () => ({
++	IdentityHeroSection: () => <div data-testid="mock-identity-hero-section" />,
++}));
++
+ import { Route as CircleRoute } from "./circle/index";
+ import { Route as DashboardRoute } from "./dashboard";
+ import { Route as MeRoute } from "./me/index";
+@@ -99,7 +103,7 @@ describe("three-space route guards", () => {
+ 			data: {
+ 				archetypeName: "Deep Current",
+ 				archetypeDescription: "A calm, observant presence.",
+-				oceanCode5: "HHMHM",
++				oceanCode5: "OCEAR",
+ 				overallConfidence: 82,
+ 				messageCount: 24,
+ 				isPublic: false,
+@@ -164,7 +168,7 @@ describe("Me route layout", () => {
+ 			data: {
+ 				archetypeName: "Deep Current",
+ 				archetypeDescription: "A calm, observant presence.",
+-				oceanCode5: "HHMHM",
++				oceanCode5: "OCEAR",
+ 				overallConfidence: 82,
+ 				messageCount: 24,
+ 				isPublic: false,
+
+diff --git a/apps/front/src/routes/me/index.tsx b/apps/front/src/routes/me/index.tsx
+index 9cfcda07..b2621780 100644
+--- a/apps/front/src/routes/me/index.tsx
++++ b/apps/front/src/routes/me/index.tsx
+@@ -1,8 +1,10 @@
++import type { GetResultsResponse } from "@workspace/contracts";
+ import { createFileRoute, Link, redirect } from "@tanstack/react-router";
+ import { Settings } from "lucide-react";
+ import { useEffect, useState } from "react";
+ import { BottomNav } from "@/components/BottomNav";
+ import { ErrorBanner } from "@/components/ErrorBanner";
++import { IdentityHeroSection } from "@/components/me/IdentityHeroSection";
+ import { MePageSection } from "@/components/me/MePageSection";
+ import { PageMain } from "@/components/PageMain";
+ import { completeFirstVisit } from "@/hooks/use-account";
+@@ -125,6 +127,27 @@ function MePage() {
+ 	);
+ }
+ 
++function IdentityHeroSkeleton() {
++	return (
++		<div className="animate-pulse space-y-5">
++			{/* Archetype name placeholder */}
++			<div className="h-10 w-3/4 rounded-full bg-muted" />
++			{/* OCEAN code — 5 circle placeholders */}
++			<div className="flex gap-3">
++				{Array.from({ length: 5 }).map((_, i) => (
++					// biome-ignore lint/suspicious/noArrayIndexKey: static skeleton placeholders
++					<div key={i} className="h-8 w-8 rounded-full bg-muted" />
++				))}
++			</div>
++			{/* Radar chart circle + confidence ring side-by-side */}
++			<div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
++				<div className="aspect-square max-h-[200px] w-full rounded-full bg-muted" />
++				<div className="aspect-square max-h-[200px] w-full rounded-full bg-muted" />
++			</div>
++		</div>
++	);
++}
++
+ function MePageSkeleton() {
+ 	return (
+ 		<div className="space-y-10">
+@@ -139,32 +162,23 @@ function MePageSkeleton() {
+ 					{...(section.hidden ? { "data-state": "hidden" } : {})}
+ 					aria-busy="true"
+ 				>
+-					<div className="animate-pulse space-y-3">
+-						<div className="h-4 w-28 rounded-full bg-muted" />
+-						<div className="h-5 w-3/4 rounded-full bg-muted" />
+-						<div className="h-4 w-full rounded-full bg-muted" />
+-						<div className="h-4 w-5/6 rounded-full bg-muted" />
+-					</div>
++					{section.key === "identity-hero" ? (
++						<IdentityHeroSkeleton />
++					) : (
++						<div className="animate-pulse space-y-3">
++							<div className="h-4 w-28 rounded-full bg-muted" />
++							<div className="h-5 w-3/4 rounded-full bg-muted" />
++							<div className="h-4 w-full rounded-full bg-muted" />
++							<div className="h-4 w-5/6 rounded-full bg-muted" />
++						</div>
++					)}
+ 				</MePageSection>
+ 			))}
+ 		</div>
+ 	);
+ }
+ 
+-function MePageSections({
+-	results,
+-}: {
+-	results:
+-		| {
+-				archetypeName: string;
+-				archetypeDescription: string;
+-				oceanCode5: string;
+-				overallConfidence: number;
+-				messageCount: number;
+-				isPublic: boolean | null;
+-		  }
+-		| undefined;
+-}) {
++function MePageSections({ results }: { results: GetResultsResponse | undefined }) {
+ 	return (
+ 		<div className="space-y-10">
+ 			<MePageSection
+@@ -172,28 +186,14 @@ function MePageSections({
+ 				data-slot="me-section-identity-hero"
+ 				data-testid="me-section-identity-hero"
+ 			>
+-				<p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
+-					Space Two
+-				</p>
+-				<p className="mt-3 font-heading text-3xl font-bold text-foreground">
+-					{results?.archetypeName ?? "Me is your identity sanctuary."}
+-				</p>
+-				<p className="mt-4 text-base leading-7 text-muted-foreground">
+-					{results?.archetypeDescription ??
+-						"Your portrait, archetype, and long-form identity details now live together in one place."}
+-				</p>
+-				<div className="mt-6 flex flex-wrap gap-3 text-sm text-muted-foreground">
+-					<div className="rounded-full border border-border px-4 py-2">
+-						OCEAN code: 
+-						<span className="font-medium text-foreground">{results?.oceanCode5 ?? "-----"}</span>
+-					</div>
+-					<div className="rounded-full border border-border px-4 py-2">
+-						Confidence: 
+-						<span className="font-medium text-foreground">
+-							{results ? `${Math.round(results.overallConfidence)}%` : "Pending"}
+-						</span>
+-					</div>
+-				</div>
++				{results ? (
++					<IdentityHeroSection results={results} />
++				) : (
++					<p className="text-base leading-7 text-muted-foreground">
++						Your identity — archetype, OCEAN code, and personality shape — will appear here once results load.
++					</p>
++				)}
+ 			</MePageSection>
+ 
+ 			<MePageSection
+
+diff --git a/vitest.setup.ts b/vitest.setup.ts
+index 6de8d62b..6c7276cd 100644
+--- a/vitest.setup.ts
++++ b/vitest.setup.ts
+@@ -4,10 +4,11 @@
+  * This setup file works for both frontend (jsdom) and backend (node) tests.
+  */
+ 
+-import { vi } from 'vitest'
++import "@testing-library/jest-dom/vitest";
++import { vi } from "vitest";
+ 
+ // Mock scrollIntoView for jsdom tests (not available in jsdom by default)
+ // This will only apply when Element is defined (i.e., in jsdom environment)
+-if (typeof Element !== 'undefined') {
+-  Element.prototype.scrollIntoView = vi.fn()
++if (typeof Element !== "undefined") {
++	Element.prototype.scrollIntoView = vi.fn();
+ }
+
```