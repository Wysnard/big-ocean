# Story 8.8: Complete Archetype Library

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **User who receives their personality archetype**,
I want **every 4-letter OCEAN code to map to a hand-curated archetype with a memorable name, thoughtful description, and representative color**,
So that **my archetype feels uniquely crafted and personally meaningful rather than algorithmically assembled from generic fragments**.

## Acceptance Criteria

1. **Given** a valid 4-letter OCEAN code (any of 81 combinations) **When** `lookupArchetype()` is called **Then** the returned archetype has `isCurated: true` **And** the `CURATED_ARCHETYPES` record in `packages/domain/src/constants/archetypes.ts` contains all 81 entries.

2. **Given** all 81 archetypes are hand-curated **When** the fallback generator code in `archetype-lookup.ts` is reviewed **Then** the fallback generator functions (`generateArchetypeName`, `generateDescription`, `generateColor`), the `TRAIT_ADJECTIVES`, `AGREEABLENESS_NOUNS`, `TRAIT_DESCRIPTIONS`, `TRAIT_COLORS` constants, and all supporting types/helpers used exclusively by the fallback generator are removed **And** `lookupArchetype()` returns the curated entry directly without fallback logic.

3. **Given** each curated archetype entry **When** validated **Then** it has a unique, memorable name prefixed with "The " (e.g., "The Quiet Strategist") **And** a rich second-person description between 1500 and 2500 characters **And** a valid hex color code.

4. **Given** the existing 25 curated archetypes **When** all 81 archetypes are written **Then** the existing 25 entries are rewritten with fresh names, descriptions, and colors to ensure consistent quality and voice across the entire library **And** all 81 names are unique.

5. **Given** the archetype exhaustive test suite (`archetype-lookup-exhaustive.test.ts`) **When** all tests run **Then** all 81 codes return `isCurated: true` **And** the curated test suite (`archetype-lookup-curated.test.ts`) is updated to cover all 81 entries.

6. **Given** the complete archetype library **When** the full test suite runs (`pnpm test:run`) **Then** zero regressions across all packages **And** all archetype-related tests pass.

## Tasks / Subtasks

- [ ] Task 1: Write all 81 curated archetype entries (AC: #1, #3, #4)
  - [ ] 1.1 In `packages/domain/src/constants/archetypes.ts`, **replace the entire `CURATED_ARCHETYPES` record** with a fresh set of all 81 entries. This includes rewriting the existing 25 entries with new names, descriptions, and colors to ensure consistent voice and quality across the full library. All combinations of `[P,G,O] × [F,B,D] × [I,A,E] × [C,N,W]` must be present.
  - [ ] 1.2 **Use the exact names and essences from the Archetype Reference Table below.** Each code has a pre-defined name and essence (personality summary). The name MUST match exactly. The essence guides the description — the description expands the essence into 1500-2500 characters.
  - [ ] 1.3 **Naming rules (already applied in reference table):** Metaphorical function names — objects, forces, or roles that describe what this personality *does in the world*. 1-2 words after "The". Open and relational (implies connection, not isolation). Quietly powerful (no aggressive metaphors). Tangible and visual. No trait words (no "Creative", "Disciplined", etc.). Draws from nature, tools, navigation, craft, elements.
  - [ ] 1.4 **Description guidelines:** Each description must be 1500-2500 characters, written in second-person voice ("you"), and explore how the 4 traits interact — not just describe each trait independently. Start from the essence in the reference table, then expand with specific behavioral examples. Conversational, insightful. Descriptions should feel like they were written by someone who genuinely understands this personality combination, not assembled from fragments.
  - [ ] 1.5 **Color guidelines:** Each color should be a unique hex code that feels representative of the archetype's energy. Avoid pure primaries or neon colors.
  - [ ] 1.6 Organize entries by Openness group (O-codes, then G-codes, then P-codes), matching the existing file's comment style (e.g., `// HHHH → ODEW`). Use the L/M/H → letter mapping from the file header for comments.

- [ ] Task 2: Remove fallback generator code (AC: #2)
  - [ ] 2.1 In `packages/domain/src/utils/archetype-lookup.ts`, remove the fallback generator branch from `lookupArchetype()`. The function should: validate code4 with regex → look up in `CURATED_ARCHETYPES` → return with `isCurated: true` → throw if not found (should never happen with complete library).
  - [ ] 2.2 Remove these now-unused private constants and functions from `archetype-lookup.ts`:
    - `TRAIT_ADJECTIVES`
    - `AGREEABLENESS_NOUNS`
    - `TRAIT_DESCRIPTIONS` (the private fallback version — NOT the separate exported `packages/domain/src/constants/trait-descriptions.ts` from Story 8.2)
    - `TRAIT_COLORS`
    - `TRAIT_ORDER`
    - `MID_LETTERS`
    - `extremeness()`
    - `generateArchetypeName()`
    - `generateDescription()`
    - `generateColor()`
    - `parseCode4()`
    - Types: `TraitKey`, `Code4Letter`, `OpennessLetter`, `ConscientiousnessLetter`, `ExtraversionLetter`, `AgreeablenessLetter`, `LevelLookup`, `Code4Tuple`
  - [ ] 2.3 Keep `lookupArchetype()`, `extract4LetterCode()`, `VALID_CODE4_REGEX`, `VALID_CODE5_REGEX`, and the import of `CURATED_ARCHETYPES`.
  - [ ] 2.4 Update the module JSDoc comment to reflect that all archetypes are now hand-curated (remove references to "fallback generator" and "component-based").
  - [ ] 2.5 Update the JSDoc comment at the top of `archetypes.ts` to say "all 81 combinations" instead of "the 25 most common/meaningful combinations".

- [ ] Task 3: Update tests (AC: #5, #6)
  - [ ] 3.1 In `archetype-lookup-curated.test.ts`: Replace all 25 existing name assertions and add the remaining 56 — all 81 entries must have individual name assertion tests.
  - [ ] 3.2 In `archetype-lookup-exhaustive.test.ts`: Update the test that checks `isCurated` — all 81 should now return `true`. Remove or update any test that specifically tested the fallback generator behavior (e.g., tests asserting `isCurated: false`).
  - [ ] 3.3 Run `pnpm test:run` — ensure zero regressions across all packages.

## Dev Notes

### Architecture: What Changes vs What Stays

**CHANGES:**
- `packages/domain/src/constants/archetypes.ts` — **REWRITTEN** from 25 to 81 entries in `CURATED_ARCHETYPES` (all entries freshly written for consistent voice)
- `packages/domain/src/utils/archetype-lookup.ts` — **SIMPLIFIED** by removing fallback generator code (~200 lines removed)
- `packages/domain/src/utils/__tests__/archetype-lookup-curated.test.ts` — **REWRITTEN** to cover all 81 entries
- `packages/domain/src/utils/__tests__/archetype-lookup-exhaustive.test.ts` — **UPDATED** to expect `isCurated: true` for all 81

**STAYS THE SAME:**
- `lookupArchetype()` function signature and return type (`Archetype`) — **UNCHANGED**
- `extract4LetterCode()` — **UNCHANGED**
- `packages/domain/src/types/archetype.ts` — **UNCHANGED** (Archetype type still has `isCurated: boolean`, just always `true` now)
- All consumers of `lookupArchetype()` — **NO CHANGES** needed (same API surface)
- `packages/domain/src/constants/trait-descriptions.ts` (Story 8.2) — **UNCHANGED** (separate exported constant for results page, NOT the private fallback fragments)
- Frontend components — **NO CHANGES**
- API handlers, use-cases — **NO CHANGES**
- DB schema, contracts — **NO CHANGES**

### Archetype Reference Table (all 81 — names and essences)

All entries are pre-defined. The dev agent MUST use these exact names. The essence is a 1-2 sentence personality summary that guides the full 1500-2500 character description.

**Trait letter key:** O=Open-minded, G=Grounded, P=Practical | D=Disciplined, B=Balanced, F=Flexible | E=Extravert, A=Ambivert, I=Introvert | W=Warm, N=Negotiator, C=Candid

#### O-Group: Open-Minded (27)

**ODE — Visionary leader (Open + Disciplined + Extravert)**

| Code | Name | Essence |
|------|------|---------|
| ODEW | The Beacon | Visionary who rallies people through warmth and shared purpose. Builds movements with heart. |
| ODEN | The Architect | Creative strategist who builds coalitions diplomatically. Ambitious but fair. |
| ODEC | The Forge | Shapes bold ideas into reality through force of conviction. Direct, won't dilute the vision. |

**ODA — Thoughtful visionary (Open + Disciplined + Ambivert)**

| Code | Name | Essence |
|------|------|---------|
| ODAW | The Tapestry | Quietly weaves creative depth with genuine care for people close to them. |
| ODAN | The Compass | Balanced creative planner. Orients projects with fair judgment and measured ambition. |
| ODAC | The Prism | Independent creative strategist. Refracts ideas into new angles, trusts own vision. |

**ODI — Quiet architect (Open + Disciplined + Introvert)**

| Code | Name | Essence |
|------|------|---------|
| ODIW | The Lantern | Quiet creative depth in service of others. Illuminates the path for those close. |
| ODIN | The Lens | Reflective innovator with fair-minded precision. Brings deep focus into quiet clarity. |
| ODIC | The Clockwork | Self-contained creative machine. Intricate, independent, meticulous inner workings. |

**OBE — Social explorer (Open + Balanced + Extravert)**

| Code | Name | Essence |
|------|------|---------|
| OBEW | The Catalyst | Curiosity is contagious and warm. Sparks change and connection everywhere they go. |
| OBEN | The Bridge | Connects ideas and people across divides. Flexible, diplomatic, socially curious. |
| OBEC | The Spark | Outgoing curiosity with independent streak. Ignites energy without needing approval. |

**OBA — Selective explorer (Open + Balanced + Ambivert)**

| Code | Name | Essence |
|------|------|---------|
| OBAW | The Garden | Cultivates growth patiently in chosen circles. Curious and nurturing on own terms. |
| OBAN | The Current | Moves quietly forward, carrying ideas and people. Balanced, curious, unhurried. |
| OBAC | The Drifter | Follows curiosity untethered, self-directed. Explores without needing a destination. |

**OBI — Deep diver (Open + Balanced + Introvert)**

| Code | Name | Essence |
|------|------|---------|
| OBIW | The Well | Deep, still, nourishing for those who approach. Rich inner world shared selectively with warmth. |
| OBIN | The Pendulum | Swings thoughtfully between perspectives in quiet contemplation. Fair-minded deep thinker. |
| OBIC | The Telescope | Sees far, prefers solitary observation. Independent mind exploring from a distance. |

**OFE — Live wire (Open + Flexible + Extravert)**

| Code | Name | Essence |
|------|------|---------|
| OFEW | The Bonfire | Warm, wild energy that draws everyone in. Spontaneous generosity meets creative chaos. |
| OFEN | The Kite | Free-flying social spirit, tugged by curiosity and balanced by diplomacy. |
| OFEC | The Lightning | Sudden brilliance, untamed. Bold creative energy that doesn't wait for permission. |

**OFA — Gentle wanderer (Open + Flexible + Ambivert)**

| Code | Name | Essence |
|------|------|---------|
| OFAW | The Meadow | Open, gentle, quietly nurturing. Creative warmth that grows slowly around them. |
| OFAN | The Breeze | Easy movement through life, touching everything lightly. Balanced and unbothered. |
| OFAC | The Comet | Bright, independent, follows own orbit. Creative trajectory that answers to no one. |

**OFI — Quiet dreamer (Open + Flexible + Introvert)**

| Code | Name | Essence |
|------|------|---------|
| OFIW | The Ember | Quiet glow of deep creative warmth within. Shares the fire only with those trusted. |
| OFIN | The Tributary | Finds its own reflective path, eventually feeds into something larger. |
| OFIC | The Lone Flame | Solitary creative fire. Self-sustaining, burns on its own fuel. |

#### G-Group: Grounded (27)

**GDE — The captain (Grounded + Disciplined + Extravert)**

| Code | Name | Essence |
|------|------|---------|
| GDEW | The Anchor | Organizes people and projects with steady warmth. The reliable center everyone trusts. |
| GDEN | The Helm | Steers groups with pragmatic diplomacy. Keeps things on course without forcing. |
| GDEC | The Mast | Direct, organized, visible authority. Gets results through clear expectations and follow-through. |

**GDA — Project lead (Grounded + Disciplined + Ambivert)**

| Code | Name | Essence |
|------|------|---------|
| GDAW | The Hearthstone | Devoted planner whose organization is an expression of care. Thinks ahead for others. |
| GDAN | The Keystone | The piece that holds everything together. Balanced, pragmatic, quietly essential. |
| GDAC | The Bulwark | Pragmatic independent organizer. Builds strong structures and defends them. |

**GDI — Craftsman (Grounded + Disciplined + Introvert)**

| Code | Name | Essence |
|------|------|---------|
| GDIW | The Root | Unseen but holds everything up. Quiet devoted care expressed through meticulous work. |
| GDIN | The Meridian | Measures twice, cuts once. Methodical, fair-minded, works with quiet precision. |
| GDIC | The Chisel | Shapes raw material with solitary precision. Independent, exacting, functional. |

**GBE — Social glue (Grounded + Balanced + Extravert)**

| Code | Name | Essence |
|------|------|---------|
| GBEW | The Loom | Weaves people together naturally. Grounded warmth that makes groups feel whole. |
| GBEN | The Harbor | Safe port in a storm. Grounded, adaptive, diplomatically welcoming. |
| GBEC | The Flint | Strikes sparks — grounded but direct social energy. Honest and present. |

**GBA — Even keel (Grounded + Balanced + Ambivert)**

| Code | Name | Essence |
|------|------|---------|
| GBAW | The Hearth | Warm center that others gather around. Steady, moderate, quietly nurturing. |
| GBAN | The Fulcrum | The balancing point. Centered, moderate in everything, holds space for all sides. |
| GBAC | The Ballast | Grounded weight that keeps things steady. Independent, practical, doesn't tip easily. |

**GBI — Quiet observer (Grounded + Balanced + Introvert)**

| Code | Name | Essence |
|------|------|---------|
| GBIW | The Spring | Quiet nourishment that rises naturally. Steady care offered without fanfare. |
| GBIN | The Still Water | Calm surface, deep processing underneath. Grounded reflection, fair-minded stillness. |
| GBIC | The Granite | Solid, self-contained, immovable by outside pressure. Quiet grounded independence. |

**GFE — Easygoing host (Grounded + Flexible + Extravert)**

| Code | Name | Essence |
|------|------|---------|
| GFEW | The Campfire | Relaxed warmth that makes everyone comfortable. The room feels better when they walk in. |
| GFEN | The Waypoint | Relaxed social navigator. Practical, diplomatic, goes where the current takes them. |
| GFEC | The Squall | Sudden practical energy. Direct, relaxed, speaks plainly and moves on. |

**GFA — Unhurried moderate (Grounded + Flexible + Ambivert)**

| Code | Name | Essence |
|------|------|---------|
| GFAW | The Brook | Gentle, practical, quietly tending to what grows. Unhurried nurturing. |
| GFAN | The Plateau | Flat, open, no drama. Sees far in every direction. Calm moderate ground. |
| GFAC | The Ridgeline | Follows own ridge, practical and independent. Unbothered by the valleys below. |

**GFI — Gentle recluse (Grounded + Flexible + Introvert)**

| Code | Name | Essence |
|------|------|---------|
| GFIW | The Moss | Grows quietly where it's planted. Soft, steady, present without demanding attention. |
| GFIN | The Inlet | Sheltered quiet water. Practical, reflective, content in a small steady world. |
| GFIC | The Cairn | Solitary marker on a quiet path. Self-built, practical, stands alone by choice. |

#### P-Group: Practical (27)

**PDE — Commander (Practical + Disciplined + Extravert)**

| Code | Name | Essence |
|------|------|---------|
| PDEW | The Pillar | Traditional authority with genuine warmth. The load-bearing column everyone leans on. |
| PDEN | The Banner | Carries the standard for the group. Reliable, visible, diplomatically principled. |
| PDEC | The Anvil | Shapes things through force of discipline and directness. Proven methods, no shortcuts. |

**PDA — Steward (Practical + Disciplined + Ambivert)**

| Code | Name | Essence |
|------|------|---------|
| PDAW | The Cornerstone | The foundation stone. Dependable care expressed through structure and quiet devotion. |
| PDAN | The Scale | Weighs everything fairly, maintains balance through discipline. Measured and reliable. |
| PDAC | The Rampart | Defends what works. Independent, disciplined, holds the line on proven methods. |

**PDI — Sentinel (Practical + Disciplined + Introvert)**

| Code | Name | Essence |
|------|------|---------|
| PDIW | The Bedrock | Immovable foundation of quiet loyalty. Supports everything above without needing to be seen. |
| PDIN | The Sundial | Tracks time and direction with solitary precision. Patient, fair, methodical. |
| PDIC | The Watchtower | Solitary lookout. Sees far, acts alone, guards from a position of disciplined independence. |

**PBE — Rally point (Practical + Balanced + Extravert)**

| Code | Name | Essence |
|------|------|---------|
| PBEW | The Bellows | Stokes practical energy in others. Warm, grounded social force that gets things moving. |
| PBEN | The Crossroads | Where paths meet. Practical social navigator, helps people find common ground. |
| PBEC | The Hammer | Direct practical force. Hits the nail, moves on. Honest, efficient, no wasted motion. |

**PBA — Steady hand (Practical + Balanced + Ambivert)**

| Code | Name | Essence |
|------|------|---------|
| PBAW | The Quilt | Wraps practical reliability in warmth. Steady comfort built from familiar patterns. |
| PBAN | The Level | Finds the true horizontal. Balanced, practical, keeps everything on an even plane. |
| PBAC | The Milestone | Marks ground covered. Independent, practical, measures progress by own standards. |

**PBI — Quiet realist (Practical + Balanced + Introvert)**

| Code | Name | Essence |
|------|------|---------|
| PBIW | The Wellspring | Deep practical care that rises to the surface when needed. Quiet source of support. |
| PBIN | The Sextant | Navigates by fixed practical stars. Reflective, fair-minded, finds direction in silence. |
| PBIC | The Monolith | Stands alone, solid, unchanging. Quiet practical authority that needs nothing from anyone. |

**PFE — Open door (Practical + Flexible + Extravert)**

| Code | Name | Essence |
|------|------|---------|
| PFEW | The Open Door | Warm and uncomplicated welcome. What you see is what you get — come on in. |
| PFEN | The Roundtable | Everyone gets a seat. Relaxed, practical, diplomatically inclusive. |
| PFEC | The Wildfire | Raw practical energy, unfiltered. Burns through pretense fast. |

**PFA — Low-key pragmatist (Practical + Flexible + Ambivert)**

| Code | Name | Essence |
|------|------|---------|
| PFAW | The Trellis | Quiet support structure for others to grow on. Practical, gentle, present. |
| PFAN | The Clearing | Open space, no obstacles. Relaxed, practical, makes room for whatever comes. |
| PFAC | The Trailhead | Marks the start of its own path. Independent, practical, unbothered. |

**PFI — Hermit (Practical + Flexible + Introvert)**

| Code | Name | Essence |
|------|------|---------|
| PFIW | The Candle | Small steady light in a quiet room. Practical warmth, offered sparingly but genuinely. |
| PFIN | The Cove | Sheltered, practical, content. A quiet harbor at the edge of the world. |
| PFIC | The Lone Star | Solitary point of light. Self-sufficient, practical, needs nothing but its own sky. |

### Writing Quality Bar

Descriptions must expand the essence from the reference table into 1500-2500 characters. Key patterns:

1. **Trait interactions, not trait lists.** Descriptions explore how traits combine and create emergent behaviors — not just describe each trait independently.
2. **Specific behavioral examples.** "Turns a casual dinner into a brainstorming session", "A coffee with a close friend, a thoughtful conversation at a dinner party."
3. **Nuanced, non-judgmental tone.** Low traits aren't weaknesses. Frame every combination positively and honestly.
4. **4-paragraph structure.** (1) O+C behavioral foundation, (2) E+A social expression, (3) cross-trait nuances, (4) motivational core.
5. **No filler or repetition.** Each sentence adds new insight. No "in conclusion" or restating what was said earlier.
6. **Start from the essence.** The essence captures the *core metaphor* of the personality. The description should embody that metaphor throughout — not just mention it once.

### Naming Uniqueness Constraint

All 81 names in the reference table are pre-verified unique. The dev agent MUST use these exact names — do not substitute or improvise alternatives.

### Why Remove the Fallback Generator

1. **Quality gap.** Generated descriptions concatenate fragments with fixed transition phrases ("In relationships, ... At the same time, ..."). They read like mad-libs, not like insights from someone who understands the personality.
2. **Name poverty.** Generated names are "{adjective} {noun}" with only 3 nouns (Collaborator/Navigator/Individualist). Many combinations produce uninspired names like "Balanced Navigator".
3. **No trait interaction.** Generated descriptions describe each trait independently. Curated descriptions explore how traits combine and create emergent qualities.
4. **Simplification.** Removing ~200 lines of generator code simplifies `archetype-lookup.ts` dramatically. The function becomes a pure lookup.
5. **All 81 codes are reachable.** Real users can get any code. Every user deserves a thoughtfully crafted archetype, not a generated one.

### Cost & Performance Impact

- **Zero runtime cost change.** Lookup was already O(1) hash lookup for curated entries. Now all lookups are curated — slightly faster (no fallback branch).
- **Bundle size.** 81 description strings (1500-2500 chars each) ≈ 120-200KB total raw text in `archetypes.ts`. This is a domain constant loaded server-side only (used in use-cases). Frontend never imports this file directly. Acceptable for the quality improvement.
- **Build/test time.** Negligible impact — these are just string constants.

### Previous Story Intelligence (Story 8.7)

From Story 8.7 (portrait prompt rework):
- Archetype name and description are passed to the portrait generator as context
- The portrait LLM uses archetype data to inform the personality portrait
- Richer, more nuanced archetype descriptions will improve portrait quality
- No changes needed in the portrait generation pipeline — it already consumes whatever `lookupArchetype()` returns

### Git Patterns from Recent Commits

Recent commits follow:
- `feat(story-X-Y): brief description (#PR)`
- Single PR per story, squash merge to master
- Branch naming: `feat/story-8-8-complete-archetype-library`

### Files to Touch

- `packages/domain/src/constants/archetypes.ts` — Rewrite with all 81 entries
- `packages/domain/src/utils/archetype-lookup.ts` — Remove fallback generator
- `packages/domain/src/utils/__tests__/archetype-lookup-curated.test.ts` — Rewrite with all 81 name assertions
- `packages/domain/src/utils/__tests__/archetype-lookup-exhaustive.test.ts` — Update isCurated expectations

### Files NOT to Touch

- `packages/domain/src/types/archetype.ts` — No type changes
- `packages/domain/src/constants/trait-descriptions.ts` — Separate constant (Story 8.2), not the fallback fragments
- `packages/domain/src/constants/facet-descriptions.ts` — Unrelated (Story 8.3)
- Any file in `apps/front/` — No frontend changes
- Any file in `apps/api/` — No API changes
- Any file in `packages/infrastructure/` — No infra changes
- Any file in `packages/contracts/` — No contract changes

### Project Structure Notes

- All changes are in `packages/domain/` — pure domain constants and utilities
- No new files created — only modifications to existing files
- No new dependencies added
- Aligns with hexagonal architecture: domain layer contains personality data

### References

- [Source: packages/domain/src/constants/archetypes.ts — Current 25 curated entries, CuratedArchetypeEntry interface]
- [Source: packages/domain/src/utils/archetype-lookup.ts — lookupArchetype(), fallback generator, extract4LetterCode()]
- [Source: packages/domain/src/utils/__tests__/archetype-lookup-curated.test.ts — 25 name assertions]
- [Source: packages/domain/src/utils/__tests__/archetype-lookup-exhaustive.test.ts — All 81 combinations test, isCurated check]
- [Source: packages/domain/src/types/archetype.ts — Archetype, OceanCode4 types]
- [Source: docs/ARCHITECTURE.md — Hexagonal architecture, domain layer]

## Anti-Patterns

Do NOT introduce any of these patterns during implementation:

1. **Error handling scope** — No broad `catchAll`/`catchTag` that swallows errors. Only allowed: fail-open `catchTag("RedisOperationError", ...)` for resilience. Errors must propagate unchanged to the HTTP contract layer.
2. **Mock accuracy** — Mocks in `__mocks__/` must match live repository interfaces exactly. Never add methods to mocks that don't exist in the real implementation. Always use `vi.mock()` + original paths, never import from `__mocks__/` directly.
3. **Import discipline** — No cross-layer imports (infrastructure must not import from use-cases, domain must not import from infrastructure). No deep imports bypassing barrel exports. Use `@workspace/*` paths.
4. **Type safety** — No unsafe `as` casts (use type guards or `unknown` instead). No `in` operator for type narrowing (use discriminated unions with `_tag`). No `as any` without a justifying comment.

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
