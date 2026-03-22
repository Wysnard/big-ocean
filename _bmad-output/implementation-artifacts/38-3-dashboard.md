# Story 38-3: Dashboard

Status: ready-for-dev

## Story

As a user,
I want a centralized view of everything I've discovered about myself and my relationships,
So that I can easily navigate between my results, portrait, and relationship analyses.

## Acceptance Criteria

1. **Given** a logged-in user navigates to their dashboard (`/dashboard`) **When** the page renders **Then** it displays: results summary (archetype name, OCEAN code, GeometricSignature), portrait status (locked/generating/ready), relationship analyses list (primary and previous versions), and credit balance (FR19)

2. **Given** the dashboard displays relationship analyses **When** the user has multiple analyses **Then** each analysis shows the other user's name, version status (primary/previous), and a link to view the full analysis

3. **Given** the dashboard on mobile **When** viewport is <640px **Then** sections stack vertically with clear navigation between content types **And** all interactive elements meet 44px minimum tap targets

4. **Given** the dashboard **When** the user has no portrait or relationship analyses yet **Then** empty states use warm tone with ocean metaphors and a clear next step CTA (no dead ends)

5. **Given** a user is not authenticated **When** they navigate to `/dashboard` **Then** they are redirected to the login page

6. **Given** the dashboard displays portrait status **When** the portrait is locked **Then** an "Unlock your portrait" CTA is shown **When** the portrait is generating **Then** a generating indicator is shown **When** the portrait is ready **Then** a "Read your portrait" link navigates to the portrait reading view

7. **Given** the dashboard displays credits **When** the user has credits **Then** a "Compare Personalities" QR drawer trigger is available **When** the user has no credits **Then** a purchase CTA is available

## Tasks / Subtasks

- [ ] Task 1: Create `/dashboard` route with auth guard (AC: #1, #5)
  - [ ] 1.1: Create `apps/front/src/routes/dashboard.tsx` with `beforeLoad` auth guard using `getSession()` pattern from CLAUDE.md
  - [ ] 1.2: Route fetches the user's latest assessment session via `useListAssessments` hook
  - [ ] 1.3: If user has a completed session, fetch results via `useGetResults` and portrait status via `usePortraitStatus`
  - [ ] 1.4: Fetch relationship analyses via `useRelationshipAnalysesList`

- [ ] Task 2: Create DashboardPage component layout (AC: #1, #3)
  - [ ] 2.1: Create `apps/front/src/components/dashboard/DashboardPage.tsx` with responsive grid layout (single column mobile, multi-column sm+)
  - [ ] 2.2: Page header with "Your Dashboard" title and user greeting
  - [ ] 2.3: Add `data-testid="dashboard-page"` to the root element

- [ ] Task 3: Create DashboardIdentityCard component (AC: #1)
  - [ ] 3.1: Create `apps/front/src/components/dashboard/DashboardIdentityCard.tsx` showing archetype name, OCEAN code strand, and GeometricSignature
  - [ ] 3.2: Reuse `OceanCodeStrand` from `apps/front/src/components/results/OceanCodeStrand.tsx`
  - [ ] 3.3: Link to full results page (`/results/$assessmentSessionId`)
  - [ ] 3.4: Add `data-testid="dashboard-identity-card"`

- [ ] Task 4: Create DashboardPortraitCard component (AC: #6)
  - [ ] 4.1: Create `apps/front/src/components/dashboard/DashboardPortraitCard.tsx` with three states: locked (unlock CTA), generating (skeleton pulse with "Nerin is writing..." label), ready (link to reading view)
  - [ ] 4.2: Reuse portrait status polling via `usePortraitStatus` from parent route
  - [ ] 4.3: Add `data-testid="dashboard-portrait-card"`

- [ ] Task 5: Create DashboardRelationshipsCard component (AC: #2)
  - [ ] 5.1: Create `apps/front/src/components/dashboard/DashboardRelationshipsCard.tsx` showing list of relationship analyses with version badges
  - [ ] 5.2: Reuse `RelationshipAnalysesList` component or extract a shared list pattern
  - [ ] 5.3: Each analysis links to `/relationship/$analysisId`
  - [ ] 5.4: Add `data-testid="dashboard-relationships-card"`

- [ ] Task 6: Create DashboardCreditsCard component (AC: #7)
  - [ ] 6.1: Create `apps/front/src/components/dashboard/DashboardCreditsCard.tsx` showing credit balance, QR drawer trigger (when credits > 0), and purchase CTA (when credits = 0)
  - [ ] 6.2: Reuse `RelationshipCreditsSection` pattern or simplify for dashboard context
  - [ ] 6.3: Add `data-testid="dashboard-credits-card"`

- [ ] Task 7: Implement empty states (AC: #4)
  - [ ] 7.1: No assessment yet: show warm CTA to start conversation with Nerin (link to `/chat`)
  - [ ] 7.2: No portrait: show "Unlock your portrait" CTA with ocean metaphor copy
  - [ ] 7.3: No relationship analyses: show "Compare personalities" CTA with ocean metaphor copy
  - [ ] 7.4: All empty states meet 44px minimum tap targets

- [ ] Task 8: Add dashboard link to navigation (AC: #1)
  - [ ] 8.1: Add "Dashboard" link to `Header.tsx` and `MobileNav.tsx` for authenticated users
  - [ ] 8.2: Only show when user is authenticated

- [ ] Task 9: Write tests (all ACs)
  - [ ] 9.1: Unit test for DashboardIdentityCard — renders archetype name, OCEAN code
  - [ ] 9.2: Unit test for DashboardPortraitCard — renders correct state (locked/generating/ready)
  - [ ] 9.3: Unit test for DashboardRelationshipsCard — renders analyses with version badges
  - [ ] 9.4: Unit test for DashboardCreditsCard — renders credit balance and CTA
  - [ ] 9.5: Unit test for empty states — renders warm CTAs with no dead ends

## Dev Notes

- This is a frontend-only story — no new backend endpoints needed. All data is already available via existing hooks: `useListAssessments`, `useGetResults`, `usePortraitStatus`, `useRelationshipAnalysesList`, `useCredits`
- The dashboard is an aggregation/navigation view. It does NOT duplicate the full results page — it shows summaries with links to the detailed views
- Follow the existing results page pattern for auth guard (`getSession()` in `beforeLoad`)
- Reuse existing components where possible: `OceanCodeStrand`, `RelationshipAnalysesList`, `RelationshipCreditsSection`
- Mobile-first responsive design per FRONTEND.md conventions
- All data-testid attributes must not be removed or renamed (testing rule from CLAUDE.md)
