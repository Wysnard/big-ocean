---
type: ux-design-addendum
parent: ux-design-specification.md
section: '§18.17'
date: '2026-04-16'
author: Vincentlay
status: active
---

# Addendum: Canonical Me URLs & Deprecation of `/results`

This addendum is a **short, linkable reference** for product and engineering. The full narrative, cross-links, and spec-drift notes live in the main UX specification.

**Canonical source:** [ux-design-specification.md §18.17](ux-design-specification.md) — *Canonical Me URL & Results Route Deprecation (2026-04-16)*.

---

## Decision

**`/me` is the single user-facing home for post-assessment identity.** Legacy `/results` routes are deprecated; browsers and deep links should land on **`/me`** and **`/me/$conversationSessionId`** via permanent redirects.

---

## URL map

| Intent | URL |
|--------|-----|
| Latest assessment (default Me) | `/me` |
| Full analytical surface for one conversation | `/me/$conversationSessionId` |
| Focused portrait read (`PortraitReadingView`) | `/me/$conversationSessionId?view=portrait` |
| Legacy | `/results`, `/results/$conversationSessionId` → redirect (preserve query) |

---

## Redirects

| From | To |
|------|-----|
| `/results` | `/me` |
| `/results/$sessionId` | `/me/$sessionId` |

Use **308** (or 301) and **preserve the query string** (including `?view=portrait`).

---

## Rules that do not change

- **Auth gate:** Unauthenticated deep links still use teaser + sign-in; return URL is canonical **`/me/$sessionId`**.
- **Resume / first-visit:** Behavior stays the same; only the path moves under the Me shell.
- **Latest wins:** `/me` without a session id shows the **latest** completed assessment.

---

## Implementation checklist

- [ ] Session-scoped Me route hosts today’s full results composition (`ProfileView` stack, etc.).
- [ ] In-app navigation and “There’s more to see →” point to **`/me/$sessionId`** (and portrait query as needed).
- [ ] Redirects from `/results/*`.
- [ ] Copy: “Results” → “Me” where it refers to this surface.
- [ ] Tests updated off `/results` paths.

---

## Editorial follow-up (main spec)

Older sections of `ux-design-specification.md` may still say `/results/...` in journey tables. **§18.17** defines the target URLs; a global editorial pass can align wording.
