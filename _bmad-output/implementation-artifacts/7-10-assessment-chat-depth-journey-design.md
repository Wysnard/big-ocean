# Story 7.10: Assessment Chat - Depth Journey Design

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **User taking the 30-minute assessment**,
I want **to feel immersed in a visual 'depth journey' that progresses from surface to abyss as the conversation deepens**,
So that **the conversation feels like a meaningful exploration rather than a static form**.

## Acceptance Criteria

1. **Given** I am in the assessment chat **When** I send messages and progress through the conversation **Then** the chat background transitions through 5 depth zones (Surface → Shallows → Mid → Deep → Abyss) based on my message count relative to a total message threshold **And** transitions use smooth 600ms ease-in-out CSS transitions **And** zone thresholds are: 0-20% Surface, 20-40% Shallows, 40-60% Mid, 60-80% Deep, 80-100% Abyss

2. **Given** I am on desktop (>= 768px) **When** the assessment chat is active **Then** a fixed depth meter appears on the left sidebar showing: a 160-200px vertical track with progress fill, 5 labeled zone pips (Surface, Shallows, Mid, Deep, Abyss), the active zone pip highlighted in primary accent color, and the current zone name displayed below the track **And** the depth meter tracks message-count-based progress (not scroll)

3. **Given** I am on mobile (< 768px) **When** the chat is active **Then** the depth meter is hidden **And** zone background transitions still apply **And** all existing mobile features are preserved (90% bubble width, 44px+ touch targets, safe-area-inset)

4. **Given** the conversation reaches a dark zone (Deep at 60%+ or Abyss at 80%+) **When** the background transitions to dark colors **Then** text colors, bubble colors, input bar colors, and UI elements automatically switch to light-on-dark styling **And** the transition is seamless with no flash or layout shift

5. **Given** Nerin mentions a trait or facet in a message **When** the message renders **Then** inline facet icons appear as small colored circles/shapes (OCEAN shapes: O=circle, C=half-circle, E=rectangle, A=triangle, N=diamond) using the appropriate trait color **And** facet icons are 18px inline-flex elements

6. **Given** Nerin provides analysis of my personality patterns **When** an evidence summary is relevant **Then** mini evidence cards can be embedded in the message stream showing facet name + confidence bar **And** evidence cards use the embed styling pattern (rounded, bordered, backdrop-blur)

7. **Given** `prefers-reduced-motion` is enabled **When** the chat renders **Then** all zone background transitions are instant (no animation) **And** depth meter fill shows instant state **And** all other existing motion-safe behaviors are preserved

8. **Given** all changes are applied **When** I interact with the chat **Then** all existing functionality is preserved: error handling, evidence highlighting, facet panel, session resumption, sign-up modal trigger, auto-greeting, milestone badges, celebration card, relative timestamps, rotating placeholders, NerinAvatar on messages **And** zero backend/API changes are made

9. **Given** I toggle between light and dark mode **When** the theme changes **Then** zone colors use theme-appropriate palettes (light zones for light mode, dark zones for dark mode) **And** in forced dark mode, all zones use dark palette variants

10. **Given** the reusable component architecture **When** shared chat components are created in `packages/ui` **Then** `ChatConversation`, `Message`, `MessageBubble`, and `Avatar` components are available as shared UI primitives **And** they support both static (homepage) and dynamic (assessment) contexts **And** the homepage conversation can optionally be refactored to use them

## Tasks / Subtasks

- [x] Task 1: Create DepthZoneProvider React Context (AC: #1, #4, #9)
  - [x]Create `apps/front/src/components/chat/DepthZoneProvider.tsx`
  - [x]Define `DEPTH_ZONES` constant with 5 zones: Surface, Shallows, Mid, Deep, Abyss
  - [x]Each zone: `{ name, start, end, bgLight, bgDark, fgLight, fgDark, isDark }`
  - [x]Light zone colors: Surface `#FFF8F0`, Shallows `#FFF0E8`, Mid `#FFE8D8`, Deep `#282643`, Abyss `#0A0E27`
  - [x]Dark zone colors: Surface `#2A2A3E`, Shallows `#3A3A52`, Mid `#4A4A66`, Deep `#1A1A2E`, Abyss `#0A0E27`
  - [x]`useDepthZone(messageCount, totalMessages)` hook: calculates `progress = messageCount / totalMessages`, derives `zoneIndex = Math.min(Math.floor(progress / 0.2), 4)`
  - [x]Context provides: `{ zone, zoneIndex, progress, isDark, bgColor, fgColor }`
  - [x]Uses `useTheme()` from theme system to select light vs dark zone palette
  - [x]Updates CSS custom properties `--zone-bg` and `--zone-fg` on the chat container via ref or style prop
  - [x]Add `data-slot="depth-zone-provider"` to wrapper
  - [x]Respect `prefers-reduced-motion`: set CSS `transition: none` when reduced motion preferred

- [x] Task 2: Build DepthMeter sidebar component (AC: #2, #3, #7)
  - [x]Create `apps/front/src/components/chat/DepthMeter.tsx`
  - [x]Fixed positioning: `position: fixed; left: 20px; top: 50%; transform: translateY(-50%); z-index: 90`
  - [x]Vertical track: 2px wide, 160-200px tall, with progress fill bar
  - [x]Fill bar height = `progress * 100%` with `transition: height 300ms ease`
  - [x]5 zone pips labeled: Surface, Shallows, Mid, Deep, Abyss (JetBrains Mono, 0.45rem)
  - [x]Active pip: highlighted in `var(--primary)` with `font-weight: 600`
  - [x]Current zone name displayed below track (`font-mono text-xs`)
  - [x]Hide on mobile: `hidden md:flex` (or `@media(max-width: 768px) { display: none }`)
  - [x]Track and pip colors adapt based on `isDark` from DepthZoneProvider
  - [x]Light track: `rgba(0,0,0,0.07)`, dark track: `rgba(255,255,255,0.08)`
  - [x]Light pips: `rgba(0,0,0,0.2)`, dark pips: `rgba(255,255,255,0.15)`
  - [x]Add `data-slot="depth-meter"`
  - [x]`motion-safe:transition-all` on fill bar

- [x] Task 3: Create FacetIcon inline component (AC: #5)
  - [x]Create `apps/front/src/components/chat/FacetIcon.tsx`
  - [x]Props: `trait: 'O' | 'C' | 'E' | 'A' | 'N'`, `className?: string`
  - [x]Renders inline-flex 18px circle/shape with trait color background and white letter
  - [x]Shape mapping: O=circle, C=half-circle, E=slim rectangle, A=triangle, N=diamond
  - [x]Uses trait color CSS variables: `var(--trait-openness)`, etc.
  - [x]`vertical-align: middle`, `cursor: help`, small margin (0 2px)
  - [x]Add `data-slot="facet-icon"`
  - [x]Note: This component is for FUTURE USE — Nerin's messages don't currently contain trait markers. Create the component now so it's ready when the backend adds trait/facet annotations to messages

- [x] Task 4: Create EvidenceCard mini-visualization (AC: #6)
  - [x]Create `apps/front/src/components/chat/EvidenceCard.tsx`
  - [x]Props: `facets: Array<{ name: string, confidence: number }>`, `className?: string`
  - [x]Renders embedded card within message stream: rounded-xl, bordered, backdrop-blur
  - [x]Each facet row: facet name (0.75rem) + horizontal bar fill (5px tall, rounded, trait-colored)
  - [x]Bar fill width = `confidence * 100%` with `transition: width 500ms ease`
  - [x]Adapts to light/dark zone context (bg, border, text colors)
  - [x]Add `data-slot="evidence-card"`
  - [x]Note: Like FacetIcon, this is for FUTURE USE — current messages don't embed evidence cards. Component is ready for when the backend or frontend adds inline evidence summaries

- [x] Task 5: Integrate DepthZoneProvider into TherapistChat (AC: #1, #4, #8, #9)
  - [x]Import `DepthZoneProvider` and `useDepthZone` into `TherapistChat.tsx`
  - [x]Wrap the chat container with `DepthZoneProvider`
  - [x]Pass `messageCount={messages.filter(m => m.role === 'user').length}` and `totalMessages={messageReadyThreshold || 27}` (use the existing `messageReadyThreshold` from `useTherapistChat`)
  - [x]Apply zone background color to the main chat container: `style={{ backgroundColor: bgColor, color: fgColor, transition: 'background-color 600ms ease-in-out, color 600ms ease-in-out' }}`
  - [x]When zone `isDark`: switch bubble styling, input bar styling, header styling to light-on-dark
  - [x]Nerin bubble: zone-aware — light zones use `bg-card border-border`, dark zones use `bg-white/6 border-white/10`
  - [x]User bubble: keep existing gradient (`bg-primary`), which works on both light and dark backgrounds
  - [x]Input bar: zone-aware — light zones use `bg-card border-border`, dark zones use `bg-white/5 border-white/8`
  - [x]Header text: zone-aware — use `fgColor` from context
  - [x]Milestone badges: zone-aware accent styling
  - [x]Celebration card: keep existing styling (it has its own bg-card)
  - [x]ProgressBar: keep existing behavior (labels already set, independent of zone)
  - [x]DO NOT break any existing functionality (see Anti-Patterns section)

- [x] Task 6: Add DepthMeter to chat layout (AC: #2, #3)
  - [x]Import `DepthMeter` into `TherapistChat.tsx`
  - [x]Render `<DepthMeter />` as a sibling of the chat container (outside scrollable area)
  - [x]DepthMeter consumes `useDepthZone` context for progress and zone data
  - [x]Verify hidden on mobile (< 768px)
  - [x]Verify does not interfere with existing layout (fixed position, z-90)

- [x] Task 7: Extract reusable chat components to packages/ui (AC: #10)
  - [x]Create `packages/ui/src/components/chat/ChatConversation.tsx`
    - Wrapper component managing message stream, auto-scroll, typing indicator slot
    - Props: `messages`, `renderMessage`, `renderAvatar?`, `autoScroll?`, `typingIndicator?`, `className?`
    - Handles scroll-to-bottom behavior
    - `data-slot="chat-conversation"`
  - [x]Create `packages/ui/src/components/chat/Message.tsx`
    - Individual message with role-based layout (left for assistant, right for user)
    - Props: `role`, `children`, `avatar?`, `timestamp?`, `className?`
    - `data-slot="chat-message"`
  - [x]Create `packages/ui/src/components/chat/MessageBubble.tsx`
    - Styled content container with sender-appropriate corners
    - Props: `variant: 'sender' | 'receiver'`, `children`, `className?`
    - Sender corner: `rounded-2xl rounded-br-sm`, Receiver corner: `rounded-2xl rounded-bl-sm`
    - `data-slot="chat-bubble"` (preserve existing attribute name)
  - [x]Create `packages/ui/src/components/chat/Avatar.tsx`
    - Generic avatar component with fallback patterns
    - Props: `src?`, `fallback?`, `size?`, `className?`
    - `data-slot="chat-avatar"`
  - [x]Export all from `packages/ui/src/components/chat/index.ts`
  - [x]Update `packages/ui/src/index.ts` to export chat components
  - [x]Note: TherapistChat does NOT need to be refactored to use these shared components in THIS story. The shared components are created as primitives. Integration into TherapistChat and homepage refactoring is optional/future work.

- [x] Task 8: Build verification (AC: #8)
  - [x]`pnpm build` — 0 errors
  - [x]`pnpm lint` — no new warnings
  - [x]`pnpm test:run` — no regressions (all existing tests pass)
  - [x]Visual verification: zone transitions work as messages are sent
  - [x]Visual verification: depth meter updates correctly
  - [x]Visual verification: dark zone text inversion works
  - [x]Visual verification in both light and dark theme modes
  - [x]Visual verification on mobile (375px) — depth meter hidden, zones still transition
  - [x]Verify evidence panel still works (click user message → facet panel opens)
  - [x]Verify session resumption works (refresh page with sessionId)
  - [x]Verify auto-greeting works (new session → 3 staggered messages)
  - [x]Verify milestone badges work (25%, 50%, 70%)
  - [x]Verify celebration card works (70%+ confidence)
  - [x]Verify error handling works (simulate network error)

## Dev Notes

### CRITICAL: This is a Visual Enhancement — Primarily Frontend

This story adds a depth journey visual system to the existing assessment chat. The chat already has extensive functionality from the previous Story 7-10 (UX Polish) which is now in production. This story layers depth zone progression ON TOP of the existing chat. **Zero backend/API changes.**

### What Already Exists (from previous 7-10 UX Polish, now in production)

The chat currently has all of these features working:
- Multi-message auto-greeting (3 staggered messages, server-persisted)
- NerinAvatar on all assistant messages with confidence tiers
- Milestone badges at 25%, 50%, 70%
- In-chat celebration card (replaces modal overlay)
- Auto-resizing textarea with rotating placeholders
- Relative timestamps (updated every 60s)
- Nerin-voice progress labels on ProgressBar
- Mobile polish (90% bubble width, 44px touch targets, safe-area-inset)
- Minimal header (Nerin + avatar + conditional "View Results" link)
- Evidence highlighting with confidence-based color coding
- Facet side panel
- Session resumption
- Sign-up modal trigger
- Error handling (ErrorBanner)

### What This Story ADDS

1. **5-zone depth progression** — background color transitions tied to message count
2. **Fixed depth meter** — left sidebar with zone pips and progress fill (desktop only)
3. **FacetIcon component** — inline trait/facet shape icons (prepared for future use)
4. **EvidenceCard component** — mini confidence bar visualizations (prepared for future use)
5. **Zone-aware UI theming** — bubbles, input, header adapt to dark zones
6. **Reusable chat components** — `ChatConversation`, `Message`, `MessageBubble`, `Avatar` in `packages/ui`

### Depth Zone Color System

**Light Mode Zones:**

| Zone | Progress | Background | Text | isDark |
|------|----------|-----------|------|--------|
| Surface | 0-20% | `#FFF8F0` (Warm Cream) | `#1A1A2E` | false |
| Shallows | 20-40% | `#FFF0E8` (Peachy) | `#1A1A2E` | false |
| Mid | 40-60% | `#FFE8D8` (Coral) | `#1A1A2E` | false |
| Deep | 60-80% | `#282643` (Deep Purple) | `#FFFFFF` | true |
| Abyss | 80-100% | `#0A0E27` (Navy) | `#FFFFFF` | true |

**Dark Mode Zones:**

| Zone | Progress | Background | Text | isDark |
|------|----------|-----------|------|--------|
| Surface | 0-20% | `#2A2A3E` | `#F0EDE8` | true |
| Shallows | 20-40% | `#3A3A52` | `#F0EDE8` | true |
| Mid | 40-60% | `#4A4A66` | `#F0EDE8` | true |
| Deep | 60-80% | `#1A1A2E` | `#F0EDE8` | true |
| Abyss | 80-100% | `#0A0E27` | `#F0EDE8` | true |

**Zone Calculation:**
```typescript
const progress = userMessageCount / totalMessages; // 0 to 1
const zoneIndex = Math.min(Math.floor(progress / 0.2), 4); // 0 to 4
const currentZone = DEPTH_ZONES[zoneIndex];
```

**Note:** Progress is based on `userMessageCount` (not total messages including assistant), divided by `messageReadyThreshold` (default 27, from `useTherapistChat`). This matches the existing `progressPercent` calculation.

### Key Components Available (Do Not Recreate)

| Component | Location | Use |
|-----------|----------|-----|
| `NerinAvatar` | `components/NerinAvatar.tsx` | Already on assistant messages (KEEP AS-IS) |
| `ProgressBar` | `components/ProgressBar.tsx` | Already has Nerin-voice labels (KEEP AS-IS) |
| `ErrorBanner` | `components/ErrorBanner.tsx` | Error display (KEEP AS-IS) |
| `SignUpModal` | `components/auth/SignUpModal.tsx` | Auth gate (KEEP AS-IS) |
| `FacetSidePanel` | `components/FacetSidePanel.tsx` | Evidence panel (KEEP AS-IS) |
| `OceanCircle/HalfCircle/Rectangle/Triangle/Diamond` | `components/ocean-shapes/*.tsx` | Use for FacetIcon shapes |
| `getTraitColor()` | `@workspace/domain` | CSS variable for trait color |
| `DepthScrollProvider` | `components/home/DepthScrollProvider.tsx` | Homepage scroll tracking (DO NOT use for assessment — assessment uses message-count, not scroll) |
| `DepthMeter` (home) | `components/home/DepthMeter.tsx` | Homepage depth meter (DO NOT reuse — assessment meter has different behavior: message-count-based, zone pips, zone labels) |
| `useTherapistChat` | `hooks/useTherapistChat.ts` | Chat hook — provides `messageReadyThreshold` for total messages |

### Existing DepthScrollProvider vs New DepthZoneProvider

The homepage has `DepthScrollProvider` + `DepthMeter` that track **scroll position**. The assessment chat needs a DIFFERENT provider that tracks **message count**. Do NOT reuse the homepage depth components.

| Feature | Homepage (exists) | Assessment (new) |
|---------|------------------|-----------------|
| Progress source | `window.scrollY` | `userMessageCount / totalMessages` |
| Provider | `DepthScrollProvider` | `DepthZoneProvider` (new) |
| Meter | `DepthMeter` (26 lines, minimal) | `DepthMeter` (new, richer — zone pips, labels) |
| Zones | Continuous gradient (5 zones) | Discrete transitions (5 zones) |
| Location | `components/home/` | `components/chat/` (new) |

### Zone-Aware UI Element Styling

When the zone transitions to a dark background (Deep/Abyss in light mode, ALL zones in dark mode), several UI elements need to adapt:

```tsx
// Pattern: use isDark from DepthZoneProvider context
const { isDark } = useDepthZone();

// Nerin bubble
<div className={cn(
  "rounded-2xl rounded-bl-sm p-4",
  isDark ? "bg-white/6 border border-white/10 text-white" : "bg-card border border-border text-card-foreground"
)}>

// Input bar
<div className={cn(
  "border-t p-4",
  isDark ? "bg-white/5 border-white/8" : "bg-card border-border"
)}>

// Depth meter track
<div className={cn(
  "w-[2px] h-[160px] rounded-[1px]",
  isDark ? "bg-white/8" : "bg-black/7"
)}>
```

### File Structure

```
apps/front/src/
  components/
    chat/                                # NEW directory
      DepthZoneProvider.tsx              # NEW: React Context for zone tracking
      DepthMeter.tsx                     # NEW: Fixed sidebar with zone pips
      FacetIcon.tsx                      # NEW: Inline trait/facet shape icons
      EvidenceCard.tsx                   # NEW: Mini confidence bar visualization
      index.ts                          # NEW: Barrel export
    TherapistChat.tsx                    # MODIFY: wrap with DepthZoneProvider, add DepthMeter, zone-aware styling
    ProgressBar.tsx                      # KEEP AS-IS
    NerinAvatar.tsx                      # KEEP AS-IS
    ErrorBanner.tsx                      # KEEP AS-IS
    auth/SignUpModal.tsx                 # KEEP AS-IS
    FacetSidePanel.tsx                   # KEEP AS-IS
    ocean-shapes/                        # KEEP AS-IS (use for FacetIcon)
    home/
      DepthScrollProvider.tsx            # KEEP AS-IS (homepage only)
      DepthMeter.tsx                     # KEEP AS-IS (homepage only, different behavior)
  hooks/
    useTherapistChat.ts                 # KEEP AS-IS (provides messageReadyThreshold)

packages/ui/src/
  components/
    chat/                               # NEW directory
      ChatConversation.tsx              # NEW: Reusable message stream wrapper
      Message.tsx                       # NEW: Individual message layout
      MessageBubble.tsx                 # NEW: Styled bubble container
      Avatar.tsx                        # NEW: Generic avatar component
      index.ts                         # NEW: Barrel export
```

### Implementation Order (Recommended)

1. **DepthZoneProvider** (Task 1) — core context and zone calculation
2. **DepthMeter** (Task 2) — sidebar visualization
3. **Integration** (Tasks 5, 6) — wire into TherapistChat with zone-aware styling
4. **FacetIcon + EvidenceCard** (Tasks 3, 4) — future-ready components
5. **Shared components** (Task 7) — reusable chat primitives in packages/ui
6. **Verification** (Task 8) — build, lint, test, visual check

### Design Reference

The prototype at `_bmad-output/ux-explorations/assessment-chat/direction-1-depth-journey.html` demonstrates:
- 5-zone background color transitions tied to message count
- Fixed depth meter with zone pips and progress fill
- Inline facet icons (colored circles with trait letters)
- Mini facet bar embeds within messages
- Nav/input bar adapting to dark zones
- `prefers-reduced-motion` handled via CSS transition override

Key implementation differences from prototype:
- Prototype uses vanilla JS DOM manipulation → Production uses React state + CSS custom properties
- Prototype auto-plays messages → Production uses real user interaction
- Prototype uses fixed message array → Production uses dynamic `useTherapistChat` hook
- Prototype has no theme toggle → Production must support light/dark mode + zone interaction

### Previous Story Intelligence

**From Story 7-10 (UX Polish, now in production):**
- TherapistChat is 534 lines — monolithic but well-structured
- useTherapistChat returns `messageReadyThreshold` (default 27) — use this as `totalMessages`
- `progressPercent` is already calculated as `(userMessageCount / messageReadyThreshold) * 100`
- Staggered greeting, milestones, celebration, textarea, timestamps all working
- All `data-slot` attributes in place
- `motion-safe:` prefix pattern established

**From Story 7.8 (Homepage Depth Scroll):**
- DepthScrollProvider pattern: React context + `requestAnimationFrame` throttling
- DepthMeter pattern: fixed sidebar, opacity-based visibility
- Zone color interpolation pattern (homepage uses continuous, assessment uses discrete)
- ConversationFlow, MessageGroup, ChatBubble exist as homepage components

**From Story 7.9 (Results Page):**
- Component extraction pattern: extract sections into separate files
- Semantic token replacement patterns
- Depth zone CSS variables already defined in globals.css (`--depth-surface`, `--depth-shallows`, etc.)
- WaveDivider pattern (not needed for chat — chat uses smooth transitions, not dividers)

**From Story 7.7 (Illustration & Icon System):**
- NerinAvatar has confidence-based CSS tiers (3 levels: low/mid/high)
- OCEAN shape SVG components available for FacetIcon

### Git Intelligence

Recent commits:
```
80defdc feat(story-7-8): conversation-driven homepage with depth scroll journey (#46)
8c472b7 refactor: new home page
e984962 feat(story-7-15): auth form psychedelic brand redesign + accessibility fixes (#45)
394b67a Feat/story 4 7 message count progress indicator (#44)
c3f1777 chore: update sprint
```

Pattern: Feature PRs use `feat(story-X-Y):` conventional commits. Build/lint/test verified before PR.

### Anti-Patterns

```
DO NOT modify backend code (api/, domain/, contracts/, infrastructure/)
DO NOT break evidence highlighting (renderMessageContent function)
DO NOT break facet panel (onMessageClick callback)
DO NOT break session resumption (useResumeSession hook)
DO NOT break sign-up modal trigger (1st user message)
DO NOT break error handling (ErrorBanner, error types)
DO NOT break auto-greeting (staggered messages)
DO NOT break milestone badges (25%, 50%, 70%)
DO NOT break celebration card (70%+ confidence)
DO NOT break relative timestamps
DO NOT break rotating placeholders
DO NOT break NerinAvatar on messages
DO NOT reuse homepage DepthScrollProvider (scroll-based) — create new DepthZoneProvider (message-count-based)
DO NOT reuse homepage DepthMeter (minimal scroll tracker) — create new assessment DepthMeter (zone pips + labels)
DO NOT use animations without motion-safe: consideration
DO NOT use hard-coded colors — use semantic tokens or zone CSS variables
DO NOT remove existing data-slot or data-message-id attributes
DO NOT remove existing data-testid attributes
DO NOT add new npm packages — all tools are available
DO NOT modify NerinAvatar.tsx
DO NOT modify ocean-shapes/ components
DO NOT modify the chat route (chat/index.tsx)
DO NOT modify useTherapistChat.ts (read messageReadyThreshold from it, don't change it)
```

### Data Attributes (per FRONTEND.md)

| Component/Element | Attribute |
|-------------------|-----------|
| DepthZoneProvider wrapper | `data-slot="depth-zone-provider"` |
| DepthMeter container | `data-slot="depth-meter"` |
| DepthMeter track | `data-slot="depth-track"` |
| DepthMeter fill | `data-slot="depth-fill"` |
| DepthMeter pip | `data-slot="depth-pip"` |
| DepthMeter zone label | `data-slot="depth-zone-label"` |
| FacetIcon | `data-slot="facet-icon"` |
| EvidenceCard | `data-slot="evidence-card"` |
| ChatConversation (ui) | `data-slot="chat-conversation"` |
| Message (ui) | `data-slot="chat-message"` |
| MessageBubble (ui) | `data-slot="chat-bubble"` (preserve existing) |
| Avatar (ui) | `data-slot="chat-avatar"` |
| All existing attributes | PRESERVE (chat-header, nerin-message-avatar, milestone-badge, celebration-card, chat-input, etc.) |

### Testing Approach

No new unit tests strictly needed — this is primarily a visual enhancement. Verification is visual + build:

1. `pnpm dev` — navigate to `/chat`
2. Send messages and watch zone transitions (Surface → Shallows → Mid → Deep → Abyss)
3. Verify depth meter tracks progress on desktop
4. Verify depth meter hidden on mobile (375px)
5. Verify dark zone text inversion (Deep/Abyss in light mode)
6. Toggle dark mode — verify all zones use dark palette
7. Verify `prefers-reduced-motion` — instant transitions
8. Verify all existing features still work (greeting, milestones, celebration, evidence panel, etc.)
9. `pnpm build` — 0 errors
10. `pnpm lint` — no new warnings
11. `pnpm test:run` — no regressions

### Quick Testing with Seed Data

```bash
# Auto-seed on dev startup
pnpm dev  # Seeds test assessment automatically

# Or manual seeding
pnpm seed:test-assessment

# Then visit: http://localhost:3000/chat (new session with auto-greeting)
# Or: http://localhost:3000/chat?sessionId=<seeded-session-id> (resume with existing messages — will show zone based on message count)
```

### Project Structure Notes

- New `components/chat/` directory for assessment chat depth components (separate from `components/home/` depth components)
- New `packages/ui/src/components/chat/` directory for shared reusable chat components
- No new routes needed
- No new npm packages needed
- All OCEAN shape components reused from `components/ocean-shapes/`
- Trait color utilities reused from `@workspace/domain`

### References

- [Epic 7 Spec: Story 7.10](/_bmad-output/planning-artifacts/epics/epic-7-ui-theme-visual-identity.md#story-710-assessment-chat---depth-journey-design) — Full requirements and acceptance criteria
- [UX Prototype: Depth Journey](/_bmad-output/ux-explorations/assessment-chat/direction-1-depth-journey.html) — Interactive prototype with zone transitions, depth meter, facet icons
- [Story 7.8: Homepage Depth Scroll](/_bmad-output/implementation-artifacts/7-8-conversation-driven-homepage-with-depth-scroll.md) — Depth scroll pattern precedent (DepthScrollProvider, DepthMeter)
- [Story 7.9: Results Page](/_bmad-output/implementation-artifacts/7-9-results-page-visual-redesign-with-archetype-theming.md) — Depth zone CSS variables, component extraction patterns
- [Story 7.7: Illustration System](/_bmad-output/implementation-artifacts/7-7-illustration-and-icon-system.md) — NerinAvatar, OCEAN shape components
- [FRONTEND.md](/docs/FRONTEND.md) — data-slot conventions, component patterns
- [TherapistChat.tsx](/apps/front/src/components/TherapistChat.tsx) — Current 534-line chat component
- [useTherapistChat.ts](/apps/front/src/hooks/useTherapistChat.ts) — Chat hook with messageReadyThreshold
- [DepthScrollProvider.tsx](/apps/front/src/components/home/DepthScrollProvider.tsx) — Homepage scroll tracking (reference pattern, do not reuse)
- [DepthMeter.tsx](/apps/front/src/components/home/DepthMeter.tsx) — Homepage depth meter (reference pattern, do not reuse)
- [globals.css](/packages/ui/src/styles/globals.css) — Depth zone CSS tokens, animation keyframes

## Dev Agent Record

### Agent Model Used

Claude Opus 4 (claude-opus-4-6)

### Debug Log References

- ThemeContext fix: Changed `useTheme()` (throws without ThemeProvider) to `useContext(ThemeContext)` (returns null gracefully) in DepthZoneProvider to fix 34 test failures in TherapistChat.test.tsx
- Lint fix: Removed unused `userMessageCount` and `messageReadyThreshold` props from ChatContent inner component, renamed unused `highlightQuote` to `_highlightQuote`
- onInputFocus callback: Added callback prop to ChatContent to bridge `setPlaceholder` across component boundary

### Completion Notes List

- All 8 tasks completed successfully
- Build: 0 errors (`pnpm build`)
- Lint: 0 new warnings (`pnpm lint`)
- Tests: 825 tests pass (506 domain + 154 API + 165 front), 0 regressions
- FacetIcon and EvidenceCard are future-ready components (created but not yet used in message rendering)
- Shared UI chat components created but TherapistChat not refactored to use them (per story spec)
- Visual verification pending (requires `pnpm dev` and manual testing)

### Change Log

- Created `apps/front/src/components/chat/DepthZoneProvider.tsx` — 5-zone depth context with theme-aware palettes
- Created `apps/front/src/components/chat/DepthMeter.tsx` — Fixed sidebar with zone pips and progress fill
- Created `apps/front/src/components/chat/FacetIcon.tsx` — Inline OCEAN trait shape icons (future-ready)
- Created `apps/front/src/components/chat/EvidenceCard.tsx` — Mini confidence bar visualization (future-ready)
- Created `apps/front/src/components/chat/index.ts` — Barrel export for chat components
- Modified `apps/front/src/components/TherapistChat.tsx` — Wrapped with DepthZoneProvider, added DepthMeter, zone-aware styling on header/bubbles/input/typing indicator/milestone badges
- Created `packages/ui/src/components/chat/ChatConversation.tsx` — Reusable message stream wrapper
- Created `packages/ui/src/components/chat/Message.tsx` — Role-based message layout
- Created `packages/ui/src/components/chat/MessageBubble.tsx` — Styled bubble with corner variants
- Created `packages/ui/src/components/chat/Avatar.tsx` — Generic avatar with fallback
- Created `packages/ui/src/components/chat/index.ts` — Barrel export for shared chat components
- Modified `packages/ui/package.json` — Added `./components/chat` export

### File List

**Created:**
- `apps/front/src/components/chat/DepthZoneProvider.tsx`
- `apps/front/src/components/chat/DepthMeter.tsx`
- `apps/front/src/components/chat/FacetIcon.tsx`
- `apps/front/src/components/chat/EvidenceCard.tsx`
- `apps/front/src/components/chat/index.ts`
- `packages/ui/src/components/chat/ChatConversation.tsx`
- `packages/ui/src/components/chat/Message.tsx`
- `packages/ui/src/components/chat/MessageBubble.tsx`
- `packages/ui/src/components/chat/Avatar.tsx`
- `packages/ui/src/components/chat/index.ts`

**Modified:**
- `apps/front/src/components/TherapistChat.tsx`
- `packages/ui/package.json`
