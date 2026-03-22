# Story 35-1: Ritual Suggestion Screen

**Status:** ready-for-dev

**Epic:** 6 — Relationship Analysis — Generation & Display
**Story:** 6.1 — Ritual Suggestion Screen

## User Story

As a user,
I want to share a meaningful moment with the other person before reading our analysis,
So that we approach the relationship insights with intention and presence.

## Acceptance Criteria

**AC1: Ritual screen displays after QR acceptance**
**Given** User B has accepted the QR token
**When** both users are routed to the ritual flow
**Then** a ritual suggestion screen is displayed on both devices (FR31)
**And** the ritual entrance animation plays (600ms) respecting prefers-reduced-motion

**AC2: Nerin speaks to both users**
**Given** the ritual screen is displayed
**When** both users are viewing it
**Then** Nerin speaks directly to both users with a brief framing message: "I wrote this about the two of you. It's better to read this together."
**And** the screen presents a suggested ritual activity for the pair

**AC3: Continue action transitions to analysis**
**Given** the ritual screen
**When** the user is ready to proceed
**Then** a "Start" action transitions to the analysis display (or generating state)
**And** the analysis fade animation plays (400ms) respecting prefers-reduced-motion

**AC4: Offline resilience**
**Given** the synchronization mechanism
**When** one user's device loses connectivity
**Then** the ritual screen still displays locally
**And** the user can proceed independently without being blocked by the other device

**AC5: Accessibility**
**Given** the ritual screen
**When** rendered
**Then** it uses `role="dialog"` with `aria-labelledby`
**And** focus is managed properly (NFR24)
**And** the screen is keyboard navigable

## Technical Notes

### UX Spec References

From the UX design specification:
- **RitualScreen component** (line ~2412): Pure UI, no sync, no locking. Each user sees this screen independently after acceptance. Text advises doing it together, nothing enforces it. Start button only — no skip (Start and Skip functionally do the same thing).
- **Visual treatment:** Same design tokens. Clean background with floating geometric identity shapes (circle, half-circle, rectangle, triangle, diamond) at very low opacity. No vignette/backdrop shadows. Nerin identity mark (5 mini trait shapes) replaces avatar. Text in `--font-heading` at larger size.
- **Entrance animation:** 600ms, respecting `prefers-reduced-motion`
- **Analysis fade:** 400ms transition from ritual to analysis
- **Layout:** Full viewport. Centered text. Large type. Same at all breakpoints — intentionally simple.

### Architecture Notes

- The ritual screen is **pure UI** — no backend sync, no WebSocket, no polling. Each user sees it independently after QR acceptance.
- Navigation flow: QR Accept -> Ritual Screen -> Relationship Analysis page
- The accept flow currently navigates directly to `/relationship/$analysisId`. This story adds a ritual screen as an intermediate step.
- The ritual route should be at `/relationship/$analysisId/ritual` or the ritual screen can be rendered inline on the analysis page before showing content.

## Tasks

### Task 1: Create RitualScreen component
**File:** `apps/front/src/components/relationship/RitualScreen.tsx`

1.1. Create `RitualScreen` component with props: `userAName`, `userBName`, `onStart`
1.2. Render full-viewport centered layout with:
  - Nerin's message: "I wrote this about the two of you. It's better to read this together."
  - Suggested ritual text: "Talk about what you're expecting before you read it."
  - "Start" button (primary, full-width, 44px min height)
1.3. Add floating geometric shapes at very low opacity as background decoration
1.4. Apply `role="dialog"` with `aria-labelledby` referencing Nerin's message
1.5. Manage focus: auto-focus the "Start" button on mount
1.6. Apply entrance animation (600ms fade-in/slide-up) gated by `prefers-reduced-motion` via `motion-safe:`
1.7. Add `data-testid="ritual-screen"` to the root element
1.8. Add `data-testid="ritual-start-button"` to the Start button

### Task 2: Create RitualScreen test
**File:** `apps/front/src/components/relationship/RitualScreen.test.tsx`

2.1. Test that RitualScreen renders Nerin's framing message
2.2. Test that RitualScreen renders both user names
2.3. Test that Start button calls `onStart` when clicked
2.4. Test that the component has `role="dialog"` with `aria-labelledby`
2.5. Test that `data-testid` attributes are present

### Task 3: Modify accept flow to navigate through ritual screen
**File:** `apps/front/src/hooks/useQrAccept.ts`

3.1. After accept success, navigate to `/relationship/$analysisId/ritual` instead of directly to `/relationship/$analysisId`

### Task 4: Create ritual route
**File:** `apps/front/src/routes/relationship/$analysisId.ritual.tsx`

4.1. Create route at `/relationship/$analysisId/ritual`
4.2. Auth-gate with `beforeLoad` (redirect to login if not authenticated)
4.3. Fetch both users' names from the relationship analysis API
4.4. Render `RitualScreen` component
4.5. On "Start", navigate to `/relationship/$analysisId` with a fade transition

### Task 5: Add fade transition CSS
**File:** `apps/front/src/styles/app.css` (or appropriate CSS file)

5.1. Add ritual entrance animation (600ms fade-in + subtle slide-up)
5.2. Gate with `prefers-reduced-motion` — instant display if reduced motion preferred
5.3. Add analysis fade transition (400ms)
