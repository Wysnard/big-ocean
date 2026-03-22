# Story 34-2: QR Drawer UI

Status: ready-for-dev

<!-- Source: Epic 5, Story 5.2 -->
<!-- Depends on: Story 34-1 (QR Token Infrastructure — backend endpoints) -->
<!-- Frontend-only story -->

## Story

As a **user with a completed assessment and available relationship credits**,
I want to **open a QR drawer that displays my QR code and a shareable URL**,
So that **I can invite someone to discover our relational dynamic together**.

## Acceptance Criteria

### AC1: QR Drawer Opens and Renders QR Code

**Given** a user with a completed assessment and available credits
**When** they open the QR drawer (from results page)
**Then** a bottom drawer opens with a QR code rendered via `qrcode.react`
**And** the QR code encodes a URL pointing to the accept screen with the token
**And** a shareable URL is displayed alongside the QR for manual sharing
**And** the drawer has proper focus management and ARIA attributes

### AC2: QR Code Auto-Regeneration

**Given** the QR drawer is open
**When** the token approaches its hourly regeneration
**Then** the QR code and URL auto-update without user action
**And** the user does not need to close and reopen the drawer

### AC3: Token Accepted State

**Given** the QR drawer is open
**When** the token is accepted by another user
**Then** the drawer updates to reflect the accepted state (via status polling)
**And** the user sees a success message indicating the invitation was accepted

### AC4: Error Handling

**Given** a network error occurs in the QR drawer
**When** token generation or polling fails
**Then** the drawer closes with a toast notification
**And** the error does not affect other page functionality

### AC5: Copy URL to Clipboard

**Given** the QR drawer is open with a valid token
**When** the user taps the copy URL button
**Then** the shareable URL is copied to clipboard
**And** a brief visual confirmation is shown (button text changes)

### AC6: Accessibility

**Given** the QR drawer is rendered
**When** a screen reader encounters it
**Then** the drawer has role="dialog" with aria-labelledby and aria-describedby
**And** all interactive elements meet 44px minimum tap targets
**And** focus is trapped within the drawer while open
**And** Escape key closes the drawer

## Tasks

### Task 1: Create `useQrDrawer` Hook

Create a custom hook that manages the QR drawer lifecycle:

- **1.1** Call `POST /relationship/qr/generate` on drawer open to get token, shareUrl, expiresAt
- **1.2** Poll `GET /relationship/qr/:token/status` every 60s to detect accepted/expired state
- **1.3** Auto-regenerate: when approaching the hourly regeneration threshold, call generate again to get a fresh token
- **1.4** Cleanup polling on drawer close or component unmount
- **1.5** Return state: `{ token, shareUrl, status, isLoading, error, generate, close }`

### Task 2: Create `QrDrawer` Component

Build the drawer UI component in `apps/front/src/components/relationship/`:

- **2.1** Use `Drawer` from `@workspace/ui/components/drawer` (vaul-based)
- **2.2** Render QR code via `qrcode.react` `QRCodeSVG` component
- **2.3** Display shareable URL with copy-to-clipboard button
- **2.4** Show loading skeleton while token is generating
- **2.5** Show accepted state when token status changes
- **2.6** Show error state with close-and-retry affordance
- **2.7** Add data-testid attributes for e2e testing

### Task 3: Integrate QR Drawer Trigger into Results Page

- **3.1** Add "Invite Someone" button to `RelationshipCreditsSection` when credits > 0
- **3.2** Wire button to open `QrDrawer`
- **3.3** Ensure drawer only appears when user has credits and a completed assessment

### Task 4: Write Tests

- **4.1** Unit tests for `useQrDrawer` hook (mock API calls, test polling, test auto-regenerate)
- **4.2** Component tests for `QrDrawer` (render states: loading, ready, accepted, error)
- **4.3** Integration test for trigger button visibility in `RelationshipCreditsSection`
