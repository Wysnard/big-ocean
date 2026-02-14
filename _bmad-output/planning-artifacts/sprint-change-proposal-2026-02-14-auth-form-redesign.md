# Sprint Change Proposal: Auth Form Visual Redesign

**Date:** 2026-02-14
**Trigger Story:** Story 7.11 — Auth-Gated Results Reveal & Sign-Up Flow
**Severity:** Low — visual consistency issue, no backend or architectural impact
**Mode:** Incremental (expand existing story scope)

---

## 1. Identified Issue Summary

The sign-up and sign-in forms (`login-form.tsx`, `signup-form.tsx`) use hard-coded generic blue/gray styling (`bg-blue-600`, `border-gray-300`, `text-blue-600`) that conflicts with the established psychedelic brand identity defined in Epic 7. Meanwhile, the Results-specific auth forms (`ResultsSignUpForm.tsx`, `ResultsSignInForm.tsx`) already use semantic design tokens (`bg-card`, `border-border`, `font-heading`) but lack the distinctive brand styling.

**Core problem:** Auth forms are visually disconnected from the rest of the application's psychedelic brand identity, creating an inconsistent and generic user experience at a critical trust-building touchpoint.

**Evidence:**
- `login-form.tsx` lines contain: `bg-blue-600`, `border-gray-300`, `hover:bg-blue-700`, `text-blue-600`
- `signup-form.tsx` has identical hard-coded color issues
- UX Design Specification explicitly requires auth forms follow psychedelic brand tokens
- Tech spec 7.11 (line 126) acknowledges: "Current reusable auth forms... are not drop-in suitable for inline results-gate UX"

---

## 2. Epic Impact & Artifact Adjustments

### Epic Impact
- **Epic 7 (UI Theme & Visual Identity):** Can be completed with minor scope expansion to Story 7.11
- **No other epics affected** — this is purely a frontend visual update within Epic 7
- **No new epics needed** — existing story structure accommodates the change

### Artifact Conflicts
- **PRD:** No conflicts — brand consistency aligns with PRD goals
- **Architecture:** No conflicts — purely frontend visual change, no backend or data model impact
- **UX Specification:** Actively supports this change — Visual Design Foundation specifies psychedelic tokens for all interactive elements including auth forms
- **Tech Spec 7.11:** Already acknowledges standalone forms need brand alignment (Task 8 requires brand + accessibility compliance)

---

## 3. Recommended Path Forward

**Selected Option:** Direct Adjustment (Low effort, Low risk)

### Rationale
- Story 7.11 is already `review` status and its tech spec includes Task 8 for brand compliance
- The Results auth forms (`ResultsSignUpForm`, `ResultsSignInForm`) already demonstrate the correct semantic token approach — they serve as reference implementations
- The standalone forms (`login-form.tsx`, `signup-form.tsx`) need the same treatment: replace hard-coded colors with semantic tokens + brand styling
- No architectural changes, no new dependencies, no migration needed

### Alternatives Considered
- **Option 2 (Rollback):** Not viable — nothing to roll back, forms simply need updating
- **Option 3 (PRD MVP Review):** Not warranted — this is a visual polish issue, not a scope problem

---

## 4. PRD MVP Impact & Action Plan

**MVP Impact:** None — this is an enhancement within existing scope, not a scope change.

### Action Items

1. **Update `login-form.tsx`** — Replace hard-coded blue/gray with semantic design tokens (`bg-primary`, `border-border`, `font-heading`, etc.) following the approved design direction
2. **Update `signup-form.tsx`** — Same treatment as login-form
3. **Apply approved design direction** — Hybrid of Geometric Bold + Floating Card:
   - `big-[shapes]` brand mark at top
   - Gradient accent text on headings (Space Grotesk)
   - Borderless tinted inputs (cream/blush in light, deep navy in dark)
   - Corner geometric decorations
   - Dark primary CTA button with brand color hover reveal
   - Ghost secondary action buttons
4. **Verify dark/light mode** — Both themes must work with the new styling
5. **Verify mobile responsiveness** — 44px+ touch targets, proper spacing on 375px viewport

### Design Reference
- Approved HTML sketch: `apps/front/src/components/auth/_design-sketches/auth-final-direction.html`
- Reference implementation: `ResultsSignUpForm.tsx` and `ResultsSignInForm.tsx` (semantic token usage)

### Dependencies & Sequencing
- No blockers — all design tokens from Stories 7.1–7.5 are already in place
- Can be executed immediately as part of Story 7.11 scope or as a follow-up task within Story 7.14 (Component Visual Consistency & Final Polish)

---

## 5. Agent Handoff Plan

| Role | Responsibility |
|------|---------------|
| **Developer** | Implement auth form visual updates following approved design direction and HTML sketch reference |
| **Scrum Master** | Update Story 7.11 scope to include standalone auth form redesign (or add as sub-task) |
| **Code Reviewer** | Verify brand consistency, accessibility (WCAG AA), responsive behavior, dark/light mode |

### Implementation Notes for Developer
- Use the Results auth forms as the reference for semantic token patterns
- Follow the final HTML sketch (`auth-final-direction.html`) for visual direction
- Key CSS classes to use: `font-heading` (Space Grotesk), `bg-card`, `border-border`, `text-foreground`, `text-muted-foreground`, `bg-primary`, `focus-visible:ring-ring`
- Brand gradient for headings: `bg-gradient-to-r from-[var(--brand-pink)] to-[var(--brand-orange)]` (light) / `from-[var(--brand-teal)] to-[var(--brand-gold)]` (dark)
- No new dependencies required
