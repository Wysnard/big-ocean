# FRONTEND.md

Frontend development guidelines and patterns for big-ocean.

**Last Updated:** 2026-02-10
**Status:** Active
**Scope:** All frontend code in `apps/front` and `packages/ui`

---

## Table of Contents

1. [Tailwind Data Attributes for State Management](#tailwind-data-attributes-for-state-management)
2. [Component Patterns](#component-patterns)
3. [Data Fetching](#data-fetching)
4. [Tech Stack Reference](#tech-stack-reference)

---

## Tailwind Data Attributes for State Management

### Overview

Data attributes provide a clean, type-safe way to style components based on state without cluttering the DOM with conditional class names. This is the **preferred pattern** for state-based styling in this project.

**Official Documentation:** [Tailwind CSS - Data Attributes](https://tailwindcss.com/docs/hover-focus-and-other-states#data-attributes)

### Why Data Attributes?

✅ **Benefits:**
- **Cleaner JSX** - No ternary operators in className props
- **Better composability** - State styling is declarative and stackable
- **Framework integration** - Works seamlessly with Radix UI, React Aria, Headless UI
- **Type safety** - Data attributes are part of the HTML spec
- **Performance** - No runtime class concatenation

❌ **Avoid for:**
- Standard HTML states (use `disabled:`, `required:`, `checked:` variants)
- Responsive design (use `sm:`, `md:`, `lg:` variants)
- One-off boolean toggles (use conditional `cn()` for simplicity)

### Syntax Patterns

#### 1. Check for Attribute Existence

Use when you only care if an attribute is present, not its value:

```tsx
<div data-active className="border data-active:border-purple-500">
  Active state
</div>
```

#### 2. Check for Specific Values (Most Common)

Use `data-[attribute=value]` for state-based styling:

```tsx
<div
  data-state="open"
  className="data-[state=open]:bg-blue-50 data-[state=closed]:opacity-0"
>
  Stateful content
</div>
```

**Multiple states:**

```tsx
<button
  data-state={isOpen ? "open" : "closed"}
  data-variant="primary"
  className="
    data-[state=open]:rotate-180
    data-[state=closed]:rotate-0
    data-[variant=primary]:bg-blue-500
    data-[variant=secondary]:bg-gray-500
  "
>
  Toggle
</button>
```

#### 3. Complex State Combinations

Stack data attribute variants with other Tailwind modifiers:

```tsx
<div
  data-state="loading"
  className="
    data-[state=loading]:opacity-50
    data-[state=loading]:cursor-wait
    hover:data-[state=loading]:opacity-75
    dark:data-[state=loading]:opacity-30
  "
>
  Loading content
</div>
```

### Real-World Example: Dialog Component

From `packages/ui/src/components/dialog.tsx`:

```tsx
function DialogOverlay({ className, ...props }) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        // State-based animations using data-[state=*]
        "data-[state=open]:animate-in data-[state=open]:fade-in-0",
        "data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
        "fixed inset-0 z-50 bg-black/50",
        className,
      )}
      {...props}
    />
  );
}

function DialogContent({ className, children, ...props }) {
  return (
    <DialogPrimitive.Content
      data-slot="dialog-content"
      className={cn(
        // Multiple state-based styles
        "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
        "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
        "fixed top-[50%] left-[50%] z-50 grid w-full max-w-lg",
        "translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6",
        className,
      )}
      {...props}
    >
      {children}
    </DialogPrimitive.Content>
  );
}
```

**How it works:**
1. Radix UI's `DialogPrimitive.Overlay` automatically provides `data-state="open"` or `data-state="closed"`
2. Tailwind's `data-[state=open]:*` variant applies styles when `data-state="open"` is present
3. No JavaScript logic needed in the component - pure declarative styling

### Project Conventions

#### Two-Tier Data Attribute System

This project uses data attributes for two distinct purposes:

##### 1. Structural Identification (`data-slot`)

**Purpose:** Identify component parts for testing, debugging, and CSS targeting

```tsx
<Dialog data-slot="dialog">
  <DialogTrigger data-slot="dialog-trigger" />
  <DialogContent data-slot="dialog-content">
    <DialogHeader data-slot="dialog-header">
      <DialogTitle data-slot="dialog-title">Title</DialogTitle>
    </DialogHeader>
  </DialogContent>
</Dialog>
```

**Guidelines:**
- ✅ **Always use** on component primitives and compound component parts
- ✅ Use kebab-case naming: `data-slot="dialog-header"`
- ✅ Name should match component name or logical part name
- ❌ Don't use for state management
- ❌ Don't style directly with `data-slot` (use for targeting only)

**Why:** Enables stable selectors for E2E tests and CSS overrides without relying on class names.

##### 2. State Management (`data-state`, `data-*`)

**Purpose:** Apply conditional styles based on component state

```tsx
// ✅ Good - Radix UI provides data-state automatically
<Collapsible>
  <CollapsibleContent
    className="data-[state=open]:animate-slideDown data-[state=closed]:animate-slideUp"
  >
    Content
  </CollapsibleContent>
</Collapsible>

// ✅ Good - Custom state for app-specific logic
<AssessmentCard
  data-status={assessment.status}
  className="data-[status=completed]:border-green-500 data-[status=in-progress]:border-blue-500"
>
  {assessment.title}
</AssessmentCard>
```

**Guidelines:**
- ✅ **Prefer `data-state`** for binary states (open/closed, active/inactive)
- ✅ Use descriptive attribute names: `data-validation`, `data-loading`, `data-status`
- ✅ Keep values simple: strings or booleans
- ❌ Don't duplicate what CSS pseudo-classes provide (`:hover`, `:focus`, `:disabled`)
- ❌ Don't use for layout variants (use `variant` prop + `cva()` instead)

#### Integration with Radix UI

Radix UI primitives automatically provide `data-state` and `data-disabled` attributes:

| Radix Component | Auto-Provided Attributes | Example Usage |
|-----------------|-------------------------|---------------|
| Dialog | `data-state="open\|closed"` | `data-[state=open]:scale-100` |
| Collapsible | `data-state="open\|closed"` | `data-[state=closed]:hidden` |
| Accordion | `data-state="open\|closed"` | `data-[state=open]:rotate-180` |
| Checkbox | `data-state="checked\|unchecked"` | `data-[state=checked]:bg-blue-500` |
| All primitives | `data-disabled` | `data-[disabled]:opacity-50` |

**Reference:** [Radix UI - Styling](https://www.radix-ui.com/primitives/docs/guides/styling#data-attributes)

### When to Use Each Pattern

| Scenario | Pattern | Example |
|----------|---------|---------|
| Radix UI component state | Use provided `data-state` | `data-[state=open]:animate-in` |
| Custom app state (status, phase) | Custom `data-*` attribute | `data-[status=error]:border-red-500` |
| Boolean feature flags | `data-feature` existence check | `data-beta:opacity-50` |
| Validation states | `data-validation` | `data-[validation=error]:ring-red-500` |
| Loading states | `data-loading` | `data-loading:cursor-wait` |
| Component variants | Use `variant` prop + `cva()` | See [Component Patterns](#component-patterns) |

### Anti-Patterns to Avoid

❌ **Don't use data attributes for variants:**

```tsx
// Bad - Use variant prop instead
<Button data-variant="primary">Click</Button>

// Good - Use cva() and variant prop
<Button variant="primary">Click</Button>
```

❌ **Don't duplicate CSS pseudo-classes:**

```tsx
// Bad - Use hover: variant
<div data-hovered className="data-hovered:bg-blue-500">Hover me</div>

// Good - Use Tailwind's hover variant
<div className="hover:bg-blue-500">Hover me</div>
```

❌ **Don't overuse for simple boolean toggles:**

```tsx
// Bad - Unnecessary complexity for one-off case
<div data-visible={isVisible} className="data-[visible=true]:block data-[visible=false]:hidden">
  Content
</div>

// Good - Use conditional cn() for simplicity
<div className={cn("hidden", isVisible && "block")}>Content</div>
```

### Testing with Data Attributes

#### `data-testid` vs `data-slot` — Two Separate Concerns

| Attribute | Purpose | Who uses it | Managed by |
|-----------|---------|-------------|------------|
| `data-testid` | E2E test selectors (Playwright) | QA / test automation | Developers — added explicitly |
| `data-slot` | Component structural identification | shadcn/ui internals, CSS targeting | shadcn/ui — auto-generated |

**Hard rule: NEVER remove, replace, or rename `data-testid` attributes.** They coexist with `data-slot` — they serve different purposes. E2E tests use `data-testid` exclusively.

```tsx
// ✅ Correct — both attributes coexist
<DialogTitle data-slot="dialog-title" data-testid="assessment-dialog-title">
  Title
</DialogTitle>

// ❌ WRONG — replacing data-testid with data-slot breaks e2e tests
<DialogTitle data-slot="assessment-dialog-title">Title</DialogTitle>
```

```tsx
// E2E test (Playwright) — PREFERRED: use getByTestId
await page.getByTestId("assessment-dialog").waitFor();
await expect(page.getByTestId("assessment-dialog-title")).toHaveText('Title');

// Unit test (Testing Library) — prefer semantic queries first, then data-testid
const dialog = screen.getByRole('dialog', { name: /assessment/i });
const title = within(dialog).getByText('Title');
```

**Guidelines:**
- ✅ **Use `data-testid`** for E2E test selectors — `page.getByTestId("element-name")`
- ✅ Use semantic queries first (role, label), then `data-testid` when needed
- ❌ **Do NOT use `data-slot` for testing** — it's for styling/CSS targeting only
- ❌ Do NOT use CSS selector syntax like `[data-slot='...']` in tests

---

## Component Patterns

### Class Variance Authority (CVA)

For components with multiple visual variants, use `cva()` from `class-variance-authority`:

```tsx
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@workspace/ui/lib/utils";

const buttonVariants = cva(
  // Base styles
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-blue-500 text-white hover:bg-blue-600",
        secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300",
        ghost: "hover:bg-gray-100",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4",
        lg: "h-12 px-6 text-base",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      data-slot="button"
      {...props}
    />
  );
}
```

**When to use CVA vs data attributes:**
- **CVA:** Visual variants that are part of the component API (primary/secondary, small/large)
- **Data attributes:** Dynamic state that changes during runtime (open/closed, loading/idle)

---

## Data Fetching

### Standard: TanStack Query + Effect HttpApiClient

All frontend data fetching MUST use **TanStack Query** (`useQuery`, `useMutation`) with the typed **Effect HttpApiClient** from `@workspace/contracts`. Never use raw `fetch`.

**API functions** live in `apps/front/src/lib/` (e.g., `qr-token-api.ts`) — pure async functions using the Effect client. **Hooks** in `apps/front/src/hooks/` compose these with TanStack Query.

#### Mutations (POST/PUT/DELETE)

```tsx
import { useMutation } from "@tanstack/react-query";
import { Effect } from "effect";
import { makeApiClient } from "../lib/api-client";

export function useDeleteAccount() {
  return useMutation({
    mutationKey: ["account", "delete"],
    mutationFn: () =>
      Effect.gen(function* () {
        const client = yield* makeApiClient;
        return yield* client.account.deleteAccount({});
      }).pipe(Effect.runPromise),
  });
}
```

#### Queries with Polling

```tsx
import { useQuery } from "@tanstack/react-query";

export function usePortraitStatus(sessionId: string) {
  return useQuery({
    queryKey: ["portraitStatus", sessionId],
    queryFn: () => fetchPortraitStatus(sessionId),
    enabled: !!sessionId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === "ready" || status === "failed") return false;
      return 2000; // Poll every 2s while generating
    },
  });
}
```

#### API Function Pattern (for testability)

Extract API calls into separate files in `lib/` so hooks can be tested by mocking the API module:

```tsx
// lib/qr-token-api.ts — API functions (mockable)
export function generateToken(): Promise<QrTokenData> {
  return Effect.gen(function* () {
    const client = yield* makeApiClient;
    return yield* client.qrToken.generateQrToken({});
  }).pipe(Effect.runPromise);
}

// hooks/useQrDrawer.ts — Hook (testable)
import { generateToken } from "../lib/qr-token-api";

export function useQrDrawer() {
  const mutation = useMutation({ mutationFn: generateToken });
  // ...
}
```

#### Rules

- **Always use TanStack Query** for async state — never manual `useState` + `useEffect` for fetching
- **Always use Effect HttpApiClient** — never raw `fetch` (see CLAUDE.md)
- **Extract API functions** into `lib/` for testability
- **Use `refetchInterval`** for polling — never `setInterval`
- **Use `enabled`** to conditionally run queries — never guard with `if` inside `queryFn`
- **Invalidate queries** after mutations via `queryClient.invalidateQueries`

---

## Tech Stack Reference

### Core Frontend Stack

- **Framework:** React 19
- **Meta-framework:** TanStack Start (SSR)
- **Routing:** TanStack Router
- **Data fetching:** TanStack Query
- **Forms:** TanStack Form
- **Database:** TanStack DB + ElectricSQL (local-first)
- **Styling:** Tailwind CSS v4
- **Component library:** shadcn/ui (Radix UI + Tailwind)
- **Icons:** lucide-react
- **Type safety:** TypeScript 5.7+, Effect Schema

### Import Conventions

```tsx
// ✅ Workspace imports (preferred)
import { Button } from "@workspace/ui/components/button";
import type { UserId } from "@workspace/domain";
import { AssessmentContract } from "@workspace/contracts";

// ✅ Type imports for types only
import type * as React from "react";

// ✅ Relative imports within same package
import { cn } from "../lib/utils";
```

### File Organization

```
apps/front/
├── src/
│   ├── routes/          # TanStack Router routes
│   ├── components/      # App-specific components
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utilities and helpers
│   └── styles/          # Global CSS and Tailwind config

packages/ui/
├── src/
│   ├── components/      # Shared UI components
│   │   ├── button.tsx
│   │   ├── dialog.tsx
│   │   └── *.stories.tsx  # Storybook stories
│   └── lib/
│       └── utils.ts     # cn() helper
```

---

## Guidelines Summary

### Data Attributes

1. ✅ **Use `data-testid`** for E2E/integration test selectors — `page.getByTestId("name")`
2. ✅ **Use `data-slot`** for CSS styling and structural identification (NOT for testing)
3. ✅ **Use `data-state`** for binary runtime states (open/closed, active/inactive)
4. ✅ **Use custom `data-*`** for app-specific states (status, validation, loading)
5. ✅ **Stack with other variants** (hover, dark, responsive)
6. ❌ **Don't use `data-slot` for tests** — use `data-testid` instead
7. ❌ **Don't use for visual variants** (use CVA + variant props)
8. ❌ **Don't duplicate CSS pseudo-classes** (use Tailwind variants)

### Components

1. ✅ Export compound components as named exports
2. ✅ Use `cva()` for components with visual variants
3. ✅ Forward all HTML attributes via `...props`
4. ✅ Add `data-slot` to all component roots
5. ✅ Use `cn()` for class merging

### Styling

1. ✅ Mobile-first responsive design
2. ✅ Prefer Tailwind utility classes over custom CSS
3. ✅ Use semantic color tokens (`bg-background`, `text-foreground`)
4. ✅ Follow shadcn/ui conventions for consistency

---

**Related Documentation:**
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Backend architecture and Effect-ts patterns
- [CLAUDE.md](../CLAUDE.md) - Repository overview and setup
- [packages/ui/README.md](../packages/ui/README.md) - Component library documentation

**External Resources:**
- [Tailwind CSS - Data Attributes](https://tailwindcss.com/docs/hover-focus-and-other-states#data-attributes)
- [Radix UI - Styling Guide](https://www.radix-ui.com/primitives/docs/guides/styling)
- [TanStack Start](https://tanstack.com/start)
