# Story 4.1: Authentication UI (Sign-Up Modal)

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **User**,
I want **to sign up after my first message when I'm engaged**,
So that **my results are saved without friction**.

## Acceptance Criteria

**Given** I've sent my first message
**When** Nerin responds
**Then** a subtle modal appears: "Save your results? Sign up to continue"
**And** I can dismiss it and continue (no pressure)
**And** I can enter email + password to sign up

**Given** I sign up successfully
**When** the modal closes
**Then** my session links to my new account
**And** I see "Your results are being saved"

## Tasks / Subtasks

- [ ] Task 1: Create SignUpModal component (AC: Modal appears after first message)
  - [ ] Subtask 1.1: Create `SignUpModal.tsx` in `apps/front/src/components/auth/`
  - [ ] Subtask 1.2: Use shadcn/ui Dialog component (from `@workspace/ui`)
  - [ ] Subtask 1.3: Add "Save your results" heading and messaging
  - [ ] Subtask 1.4: Embed existing SignupForm with modal-specific styling
  - [ ] Subtask 1.5: Add "Continue without account" button to dismiss modal

- [ ] Task 2: Integrate modal trigger in TherapistChat (AC: Modal appears after first user message)
  - [ ] Subtask 2.1: Track message count from `messages.length`
  - [ ] Subtask 2.2: Add modal state: `const [showSignUpModal, setShowSignUpModal] = useState(false)`
  - [ ] Subtask 2.3: Trigger modal on first user message: `if (messages.length === 1 && !hasShownModal)`
  - [ ] Subtask 2.4: Pass anonymous sessionId to modal for session linking
  - [ ] Subtask 2.5: Handle modal dismiss (set flag to not show again this session)

- [ ] Task 3: Implement session linking (AC: Session links to new account)
  - [ ] Subtask 3.1: Modify SignupForm to accept `anonymousSessionId` prop
  - [ ] Subtask 3.2: Include anonymousSessionId in signup request body
  - [ ] Subtask 3.3: Better Auth hook handles linking automatically (already configured)
  - [ ] Subtask 3.4: Show success message: "Your results are being saved"
  - [ ] Subtask 3.5: Close modal and update auth state

- [ ] Task 4: Form validation and UX polish (AC: Password validation enforced)
  - [ ] Subtask 4.1: Ensure 12+ char password validation (NIST 2025)
  - [ ] Subtask 4.2: Valid email format check
  - [ ] Subtask 4.3: Add loading state during signup
  - [ ] Subtask 4.4: Display errors inline (email already exists, network errors)
  - [ ] Subtask 4.5: Focus trap within modal when open

- [ ] Task 5: Testing (AC: All acceptance criteria verified)
  - [ ] Subtask 5.1: Test modal appears after first message
  - [ ] Subtask 5.2: Test modal can be dismissed
  - [ ] Subtask 5.3: Test signup flow with session linking
  - [ ] Subtask 5.4: Test form validation (email, password)
  - [ ] Subtask 5.5: Test error handling (duplicate email, network failure)

## Dev Notes

### Authentication Architecture (Better Auth - Fully Configured)

**NIST 2025 Compliance:**
- Minimum password length: 12 characters
- Maximum password length: 128 characters
- Password hashing: Bcrypt with cost factor 12
- Session duration: 7 days expiration, 24-hour update age
- Cookie security: httpOnly, secure (HTTPS only), sameSite=lax

**Session Linking Pattern (Anonymous → Authenticated):**
The system already supports linking anonymous assessment sessions to new user accounts via database hooks. When a user signs up with an `anonymousSessionId`, the Better Auth hook automatically updates the session's userId.

**Critical Implementation Detail:**
```typescript
// Better Auth configuration includes this hook:
databaseHooks: {
  user: {
    create: {
      after: async (user, context) => {
        const anonymousSessionId = context?.body?.anonymousSessionId;
        if (anonymousSessionId) {
          // Link anonymous assessment session to new user
          await database.update(authSchema.session)
            .set({ userId: user.id, updatedAt: new Date() })
            .where(eq(authSchema.session.id, anonymousSessionId));
        }
      }
    }
  }
}
```

**Auth Client Methods (use from `useAuth()` hook):**
```typescript
const { signUp, isAuthenticated, isPending, error } = useAuth();
await signUp.email({ email, password, name, anonymousSessionId });
```

### Frontend Stack & Component Patterns

**Tech Stack Versions:**
- TanStack Start: 1.132.0 (SSR framework)
- TanStack Router: 1.132.0 (file-based routing)
- TanStack Query: 5.66.5 (data fetching)
- TanStack Form: 1.0.0 (available but not yet used in auth forms)
- React: 19.2.0
- Tailwind CSS: 4.0.6

**Modal Component Selection:**
Use shadcn/ui Dialog from `@workspace/ui/components/dialog`:
```typescript
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@workspace/ui/components/dialog";
```

**Why shadcn/ui Dialog:**
- Radix UI based (production-ready, accessible)
- Built-in close button with X icon
- Portal support for proper z-index stacking
- Keyboard navigation (Escape to close)
- Focus trap included

**Existing Form Pattern (Simple State - No TanStack Form Yet):**
Current auth forms use `useState` for form fields with manual validation:
```typescript
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [error, setError] = useState<string | null>(null);
const [isLoading, setIsLoading] = useState(false);

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError(null);
  setIsLoading(true);
  try {
    await signUp.email({ email, password, name, anonymousSessionId });
    // Success handling
  } catch (err) {
    setError(err.message);
  } finally {
    setIsLoading(false);
  }
};
```

**Stick with this pattern for now** - TanStack Form can be added in future refactor.

### Modal Trigger Logic (TherapistChat Integration)

**Current TherapistChat Structure:**
- Located at: `apps/front/src/components/TherapistChat.tsx`
- Manages message list with TanStack DB live queries
- Tracks user/assistant messages in state
- Shows trait precision in sidebar

**Modal Trigger Implementation:**
```typescript
// In TherapistChat component
const [showSignUpModal, setShowSignUpModal] = useState(false);
const [hasShownModal, setHasShownModal] = useState(false);
const { isAuthenticated } = useAuth();

// Trigger after first user message
useEffect(() => {
  const userMessages = messages.filter(m => m.role === 'user');
  if (userMessages.length === 1 && !hasShownModal && !isAuthenticated) {
    setShowSignUpModal(true);
    setHasShownModal(true);
  }
}, [messages, hasShownModal, isAuthenticated]);

// Pass sessionId from route params
const { sessionId } = Route.useSearch();
```

### Styling Guidelines (Dark Theme)

**Color Palette (from TherapistChat):**
- Background: `bg-slate-900`
- Cards/Panels: `bg-slate-800/50 border-slate-700`
- Text: `text-slate-300` (body), `text-white` (headings)
- Buttons: `bg-gradient-to-r from-blue-500 to-purple-500`
- Input fields: `bg-slate-800 border-slate-600 text-white`

**Modal Styling:**
```tsx
<DialogContent className="bg-slate-800 border-slate-700">
  <DialogHeader>
    <DialogTitle className="text-white">Save your results</DialogTitle>
    <DialogDescription className="text-slate-300">
      Sign up to continue and keep your personality insights
    </DialogDescription>
  </DialogHeader>
  {/* Form content */}
</DialogContent>
```

### Database Schema & Session Linking

**Key Tables:**
```typescript
// user table
{
  id: uuid (PK),
  name: string,
  email: string (unique),
  emailVerified: timestamp,
  createdAt, updatedAt
}

// session table (Better Auth sessions)
{
  id: uuid (PK),
  token: string (unique),
  userId: uuid (FK → user, onDelete: cascade),
  expiresAt, createdAt, updatedAt
}

// assessmentSession table
{
  id: uuid (PK),
  userId: uuid (FK → user, onDelete: set null), // NULL for anonymous
  status: 'active' | 'paused' | 'completed',
  confidence: jsonb, // 30 facet scores
  messageCount: integer,
  createdAt, updatedAt
}
```

**Session Linking Flow:**
1. User starts assessment (assessmentSession created with userId = NULL)
2. After first message, modal appears
3. User signs up with email/password + anonymousSessionId
4. Better Auth hook automatically links sessionId to new user.id
5. Subsequent messages attributed to authenticated user

### Testing Strategy

**Test Environment:**
- Framework: Vitest with jsdom
- Libraries: @testing-library/react, @testing-library/dom
- Location: `apps/front/src/components/auth/SignUpModal.test.tsx`

**Test Pattern:**
```typescript
// @vitest-environment jsdom
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi } from "vitest";

// Mock auth hook
vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({
    isAuthenticated: false,
    isPending: false,
    signUp: { email: vi.fn().mockResolvedValue({ success: true }) },
    error: null
  })
}));

const queryClient = new QueryClient();

function renderWithProviders(component: React.ReactElement) {
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
}

describe("SignUpModal", () => {
  it("renders with 'Save your results' heading", () => {
    renderWithProviders(<SignUpModal isOpen={true} sessionId="test-session" />);
    expect(screen.getByText("Save your results")).toBeTruthy();
  });

  it("calls signUp with anonymousSessionId on submit", async () => {
    const mockSignUp = vi.fn().mockResolvedValue({ success: true });
    vi.mocked(useAuth).mockReturnValue({
      signUp: { email: mockSignUp },
      isAuthenticated: false,
      isPending: false,
      error: null
    });

    renderWithProviders(<SignUpModal isOpen={true} sessionId="test-session" />);

    fireEvent.change(screen.getByPlaceholderText("Email"), {
      target: { value: "test@example.com" }
    });
    fireEvent.change(screen.getByPlaceholderText("Password"), {
      target: { value: "SecurePassword123!" }
    });
    fireEvent.click(screen.getByRole("button", { name: /sign up/i }));

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "SecurePassword123!",
        anonymousSessionId: "test-session"
      });
    });
  });

  it("allows dismissing modal with 'Continue without account'", () => {
    const onClose = vi.fn();
    renderWithProviders(
      <SignUpModal isOpen={true} sessionId="test-session" onClose={onClose} />
    );

    fireEvent.click(screen.getByText(/continue without account/i));
    expect(onClose).toHaveBeenCalled();
  });
});
```

### Error Handling

**Error Types (from contracts/src/errors.ts):**
```typescript
export class InvalidCredentials extends S.TaggedError<InvalidCredentials>()(
  "InvalidCredentials", { message: S.String }
) {}

export class UserAlreadyExists extends S.TaggedError<UserAlreadyExists>()(
  "UserAlreadyExists", { email: S.String, message: S.String }
) {}

export class Unauthorized extends S.TaggedError<Unauthorized>()(
  "Unauthorized", { message: S.String }
) {}
```

**Error Display:**
```tsx
{error && (
  <div className="text-red-400 text-sm mt-2">
    {error.message || "Failed to sign up. Please try again."}
  </div>
)}
```

### Project Structure Notes

**Files to Create:**
```
apps/front/src/components/auth/
├── SignUpModal.tsx        # NEW: Modal wrapper with Dialog component
└── signup-form.tsx        # EXISTS: Reuse with props for modal context

apps/front/src/components/
└── TherapistChat.tsx      # MODIFY: Add modal trigger logic
```

**Files to Reference:**
```
packages/ui/src/components/
└── dialog.tsx             # USE: shadcn/ui Dialog component

apps/front/src/hooks/
└── use-auth.ts            # USE: useAuth() hook

packages/infrastructure/src/context/
└── better-auth.ts         # REFERENCE: Session linking logic

apps/front/src/lib/
└── auth-client.ts         # REFERENCE: Frontend auth client
```

**Naming Conventions:**
- Component files: PascalCase with `.tsx` extension
- Test files: `ComponentName.test.tsx`
- Use named exports for components: `export function SignUpModal() {}`

### Alignment with Unified Project Structure

**Monorepo Structure (Turbo + pnpm workspaces):**
```
apps/front/          # TanStack Start frontend (port 3000)
packages/ui/         # Shared React components (shadcn/ui)
packages/contracts/  # HTTP API definitions
packages/domain/     # Core types, schemas, repository interfaces
```

**Import Patterns:**
```typescript
import { Dialog } from "@workspace/ui/components/dialog";
import { useAuth } from "@/hooks/use-auth";  // @ alias for apps/front/src
import type { User } from "better-auth/types";
```

**No Detected Conflicts:**
- Better Auth is already configured for email/password
- Session linking hook is already in place
- Frontend auth client is ready to use
- Modal component exists in UI package
- No breaking changes needed

### References

**Authentication Setup:**
- [Better Auth Config: packages/infrastructure/src/context/better-auth.ts](file://packages/infrastructure/src/context/better-auth.ts) - Lines 117-136 contain session linking hook
- [Frontend Auth Client: apps/front/src/lib/auth-client.ts](file://apps/front/src/lib/auth-client.ts) - Configured client with signUp.email method
- [Auth Hook: apps/front/src/hooks/use-auth.ts](file://apps/front/src/hooks/use-auth.ts) - Exported useAuth() hook

**Component References:**
- [shadcn/ui Dialog: packages/ui/src/components/dialog.tsx](file://packages/ui/src/components/dialog.tsx) - Production-ready modal component
- [Signup Form: apps/front/src/components/auth/signup-form.tsx](file://apps/front/src/components/auth/signup-form.tsx) - Existing form to reuse
- [TherapistChat: apps/front/src/components/TherapistChat.tsx](file://apps/front/src/components/TherapistChat.tsx) - Modal trigger location

**Database Schema:**
- [Drizzle Schema: packages/infrastructure/src/db/drizzle/schema.ts](file://packages/infrastructure/src/db/drizzle/schema.ts) - User, session, and assessmentSession tables

**Testing Examples:**
- [TherapistChat Test: apps/front/src/components/TherapistChat.test.tsx](file://apps/front/src/components/TherapistChat.test.tsx) - Test pattern reference
- [Vitest Config: apps/front/vitest.config.ts](file://apps/front/vitest.config.ts) - Test environment setup

**Architecture Decisions:**
- [ADR-6 Hexagonal Architecture: _bmad-output/planning-artifacts/architecture/adr-6-hexagonal-architecture-dependency-inversion.md](file://_bmad-output/planning-artifacts/architecture/adr-6-hexagonal-architecture-dependency-inversion.md)
- [Core Architectural Decisions: _bmad-output/planning-artifacts/architecture/core-architectural-decisions.md](file://_bmad-output/planning-artifacts/architecture/core-architectural-decisions.md) - Decision 1 covers Better Auth

**UX Design:**
- [UX Design Specification: _bmad-output/planning-artifacts/ux-design-specification.md](file://_bmad-output/planning-artifacts/ux-design-specification.md) - Sign-up flow and modal timing

**Epic Context:**
- [Epic 4 Requirements: _bmad-output/planning-artifacts/epics.md#Epic-4-Frontend-Assessment-UI](file://_bmad-output/planning-artifacts/epics.md) - Lines 910-1058 contain full Epic 4 context

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Debug Log References

_To be filled during development_

### Completion Notes List

_To be filled during development_

### File List

_To be filled during development_

---

## Story Completion Status

**Status:** ready-for-dev

**Context Engine Analysis:** Complete
- ✅ Epic 4 requirements analyzed
- ✅ Better Auth architecture documented (NIST 2025 compliant)
- ✅ Frontend stack and component patterns identified
- ✅ Session linking logic verified (database hooks configured)
- ✅ Modal component selected (shadcn/ui Dialog)
- ✅ Form validation pattern documented (useState approach)
- ✅ Testing strategy defined (vitest + jsdom + React Testing Library)
- ✅ Styling guidelines provided (dark theme, Tailwind v4)
- ✅ Database schema reviewed (user, session, assessmentSession tables)
- ✅ Error handling patterns documented (contracts/errors.ts)
- ✅ File structure and imports defined
- ✅ Recent commit patterns analyzed (TDD approach, co-authorship)

**Comprehensive Developer Guide Created:**
- All technical requirements clearly specified
- Architecture compliance requirements documented
- Library/framework versions provided (Better Auth, TanStack, React 19)
- File structure requirements defined with absolute paths
- Testing requirements with concrete examples
- Previous story learnings incorporated (Story 3.2: TDD pattern, pure functions)
- Git intelligence analyzed (commit conventions, PR workflow)
- Latest technical specifics researched and verified

**Next Steps:**
1. Review this comprehensive story document
2. Run `dev-story` to implement with full context
3. Follow TDD pattern established in Epic 2 and 3
4. Run `code-review` when complete
5. Update sprint-status.yaml to mark as done

**The developer now has everything needed for flawless implementation!**

