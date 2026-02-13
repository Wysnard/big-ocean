# Design System Foundation

## Design System Choice: shadcn/ui + Tailwind CSS v4

**Selected Approach:** Themeable System (shadcn/ui + Tailwind CSS v4)

big-ocean will use **shadcn/ui components with Tailwind CSS v4** as the design system foundation. This provides the perfect balance of customization, speed, and personality alignment.

## Rationale for Selection

**1. Perfect Tech Stack Alignment**
- Already using Tailwind CSS v4 in the frontend
- shadcn/ui integrates seamlessly with React 19 + TanStack Start
- Minimal additional setup needed
- No version conflicts or compatibility issues

**2. Extreme Customization for Bold Identity**
- Components are headless and unstyled
- Full control over colors, gradients, and visual appearance
- Easy to create bold archetype color system
- Can build custom components (archetype cards, precision meter, chat interface)
- Perfect for personality-driven design (not corporate/minimal defaults)

**3. Speed to MVP**
- Pre-built, battle-tested components (buttons, cards, dialogs, forms, etc.)
- Don't rebuild common UI patterns from scratch
- Faster prototyping and iteration
- Good for MVP validation (500 users) before scaling

**4. Supports Visual Goals**
- Tailwind enables vibrant, bold color palettes
- Gradient implementation built-in
- Responsive design by default
- Animation/transition support
- Custom component creation for archetype visuals

**5. Long-Term Viability**
- Active community and regular updates
- Excellent documentation
- Composable components (easy to extend)
- Works well with existing React ecosystem
- Scalable as team and product grow

## Implementation Approach

**Phase 1: Theme & Color System**

1. **Define Tailwind Theme:**
   - Base colors: Primary (brand), Secondary (accents), Neutral (UI)
   - Archetype colors: One vibrant color per type (e.g., purple, orange, pink, navy, etc.)
   - Semantic colors: Success, warning, error (for feedback)
   - Gradients: Pre-defined for key moments (results reveal, sharing, milestones)

2. **Configure Typography:**
   - Headings: Bold, warm personality (not corporate)
   - Body: Readable, friendly
   - Accents: Emphasize key moments
   - Maintain scientific credibility while feeling warm

3. **Spacing & Layout:**
   - Consistent spacing scale (Tailwind default: 4px base)
   - Visual hierarchy supports emotional journey
   - Breathing room (intentional whitespace, not obsessive)

**Phase 2: Component Library**

1. **Core shadcn/ui Components to Use:**
   - Button (various states, sizes, colors)
   - Card (archetype cards, profile displays)
   - Dialog/Modal (share flows, confirmations)
   - Form (assessment input, user data)
   - Input/Textarea (chat-like message input)
   - Progress (precision meter)
   - Select/Dropdown (filters, navigation)
   - Avatar (user profile pictures, optional)

2. **Custom Components to Build:**
   - **ArchetypeCard:** Displays archetype name, icon, color, summary
   - **PrecisionMeter:** Visual progress toward 70%+ (animated)
   - **NerinMessage:** Chat bubble interface for assessment conversation
   - **UserMessage:** User input messages in assessment flow
   - **ArchetypeComparison:** Side-by-side trait comparison
   - **GradientBackground:** Reusable gradient overlays for emotional moments
   - **ArchetypeIcon:** Illustrated character per type (integration with illustration system)

**Phase 3: Design Tokens**

Define consistent design tokens in Tailwind config:
```
Colors:
  - archetype-*: One per type (vibrant, saturated)
  - semantic-*: Success, warning, error
  - neutral-*: UI backgrounds, text, borders

Spacing:
  - Consistent 4px/8px/12px/16px/24px/32px scale

Typography:
  - Heading sizes (H1-H6)
  - Body text sizes and weights
  - Monospace for data/code

Shadows:
  - Elevation levels (sm, md, lg)

Animations:
  - Fast transitions (150ms)
  - Slow reveals (300ms)
  - Celebration moments (500ms+)
```

## Customization Strategy

**1. Archetype Color System**

Each of the 5 Big Five trait categories gets a bold, vibrant primary color + a lighter accent:

- **Openness** → Deep Purple + Gold
- **Conscientiousness** → Bold Orange + Teal
- **Extraversion** → Vibrant Pink + Navy
- **Agreeableness** → Sage Green + Coral
- **Neuroticism** → Rich Navy + Cream

(Note: Final names and colors TBD based on archetype character design)

**2. Custom Component Styling**

- All custom components follow Tailwind utility-first approach
- Use `classNameMerge` or similar to manage conditional classes
- Keep component props simple (size, variant, color, state)
- Animation and interactivity defined in component logic (Framer Motion optional for complex animation)

**3. Extending shadcn/ui**

- Use component composition to customize
- Override Tailwind classes as needed
- Create component variants for different contexts (e.g., ArchetypeCard for results vs. shared profile)

**4. Brand Consistency**

- All components use archetype colors where appropriate
- Gradients applied consistently (hero sections, CTAs, backgrounds)
- Typography conveys personality + scientific credibility
- Animation reserved for emotional moments

## Accessibility & Performance

- shadcn/ui components include ARIA labels and semantic HTML
- Tailwind CSS provides responsive design out of box
- Dark mode support (if needed in Phase 2)
- Optimized bundle size (tree-shaking with Tailwind)
- Component-level code splitting (React Server Components with TanStack Start)

---
