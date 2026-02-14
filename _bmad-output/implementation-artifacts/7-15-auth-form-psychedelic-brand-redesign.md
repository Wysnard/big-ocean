# Story 7.15: Auth Form Psychedelic Brand Redesign

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **User visiting the sign-up or sign-in page**,
I want **the authentication forms to match the psychedelic brand identity used throughout the rest of the application**,
So that **the experience feels cohesive and trustworthy at the critical moment of creating an account or signing in, rather than jarring me with generic styling**.

## Acceptance Criteria

1. **Given** I visit the sign-up page
   **When** the form renders
   **Then** I see the `big-[shapes]` brand mark at the top
   **And** the heading uses Space Grotesk with a gradient accent word
   **And** inputs use borderless tinted styling (cream/blush in light mode, deep navy in dark)
   **And** the primary CTA button uses dark/charcoal fill with brand color hover reveal
   **And** corner geometric decorations are visible
   **And** no hard-coded blue/gray colors remain (`bg-blue-600`, `border-gray-300`, etc.)

2. **Given** I visit the sign-in page
   **When** the form renders
   **Then** the same brand styling from AC#1 is applied consistently
   **And** the heading reads "Welcome back" with gradient accent
   **And** form fields, buttons, and layout match the sign-up form pattern

3. **Given** I toggle between light and dark mode
   **When** the auth forms re-render
   **Then** light mode uses: Electric Pink (#FF0080) → Vivid Orange (#FF6B2B) gradient accents, warm cream backgrounds, blush-tinted inputs
   **And** dark mode uses: Saturated Teal (#00D4C8) → Rich Gold (#FFB830) gradient accents, abyss navy backgrounds, deep navy inputs
   **And** all text remains readable with sufficient contrast (WCAG AA)

4. **Given** I view the auth forms on a mobile device (< 768px)
   **When** the layout adapts
   **Then** all interactive elements (inputs, buttons) are minimum 44px touch targets
   **And** the form is comfortable to use on a 375px viewport
   **And** corner decorations scale down or hide gracefully

5. **Given** I interact with form fields
   **When** I focus an input
   **Then** a visible focus ring appears using the `--ring` semantic token
   **And** validation errors display using `text-destructive` semantic token
   **And** the loading state shows a spinner on submit

6. **Given** the Results-specific auth forms (`ResultsSignUpForm`, `ResultsSignInForm`) exist
   **When** comparing all auth forms
   **Then** all four forms share consistent brand styling and semantic token usage
   **And** no form uses hard-coded color values

## Tasks / Subtasks

- [ ] Task 1: Update `login-form.tsx` with semantic tokens and brand styling (AC: #1, #2, #3, #5)
  - [ ] Replace all hard-coded colors (`bg-blue-600`, `border-gray-300`, `text-blue-600`, `hover:bg-blue-700`, `disabled:bg-gray-400`) with semantic tokens
  - [ ] Add `font-heading` (Space Grotesk) to heading
  - [ ] Add gradient accent text on heading keyword
  - [ ] Style inputs as borderless tinted (bg-card with subtle border-border)
  - [ ] Style primary button as dark fill with brand hover
  - [ ] Style secondary action as ghost button
  - [ ] Add `big-[shapes]` brand mark above the heading
  - [ ] Add corner geometric decorations
  - [ ] Verify dark mode appearance

- [ ] Task 2: Update `signup-form.tsx` with semantic tokens and brand styling (AC: #1, #3, #5)
  - [ ] Same token replacement and brand styling as Task 1
  - [ ] Heading: "Start your discovery" with gradient accent on "discovery"
  - [ ] Include name field styling consistent with email/password fields
  - [ ] Verify dark mode appearance

- [ ] Task 3: Align Results auth forms with brand styling (AC: #6)
  - [ ] Review `ResultsSignUpForm.tsx` and `ResultsSignInForm.tsx` for brand consistency
  - [ ] Add gradient accent text on headings if not present
  - [ ] Add corner geometric decorations if appropriate for inline context
  - [ ] Ensure all four forms share consistent input/button styling

- [ ] Task 4: Mobile responsiveness verification (AC: #4)
  - [ ] Verify 44px+ touch targets on all inputs and buttons
  - [ ] Test on 375px viewport width
  - [ ] Scale or hide corner decorations on small screens
  - [ ] Ensure form is usable without horizontal scrolling

- [ ] Task 5: Accessibility verification (AC: #5)
  - [ ] Verify focus rings on all interactive elements
  - [ ] Verify color contrast meets WCAG AA in both themes
  - [ ] Verify error messages use `role="alert"` and `aria-describedby`
  - [ ] Verify form labels are properly associated with inputs

## Design Reference

- **Approved HTML sketch:** `apps/front/src/components/auth/_design-sketches/auth-final-direction.html`
- **Reference implementation:** `ResultsSignUpForm.tsx` and `ResultsSignInForm.tsx` (semantic token patterns)
- **Brand tokens:** `packages/ui/src/styles/globals.css`
- **Sprint Change Proposal:** `_bmad-output/planning-artifacts/sprint-change-proposal-2026-02-14-auth-form-redesign.md`

## Dev Notes

- This story was created via correct-course workflow on 2026-02-14 to address visual inconsistency in auth forms
- The standalone route forms (`login-form.tsx`, `signup-form.tsx`) have hard-coded blue/gray colors that predate the Epic 7 brand identity work
- The Results-specific forms already use semantic tokens and serve as the reference pattern
- No backend or API changes needed — purely frontend visual update
- Dependencies: Stories 7.1-7.5 (all done — design tokens, typography, dark mode, shapes, colors are in place)
