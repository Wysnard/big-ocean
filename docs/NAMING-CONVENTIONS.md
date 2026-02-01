# Naming Conventions

## Component Naming

| Component                 | Location                                    | Example                                    | Notes                       |
| ------------------------- | ------------------------------------------- | ------------------------------------------ | --------------------------- |
| Repository Interface      | `packages/domain/src/repositories/`         | `assessment-message.repository.ts`         | Context.Tag definition      |
| Repository Implementation | `packages/infrastructure/src/repositories/` | `assessment-message.drizzle.repository.ts` | Layer.effect implementation |
| Live Layer Export         | Same as implementation                      | `AssessmentMessageDrizzleRepositoryLive`   | Production Layer            |
| Test Layer Export         | Test files                                  | `AssessmentMessageTestRepositoryLive`      | Testing Layer               |
| Use-Case                  | `apps/api/src/use-cases/`                   | `send-message.use-case.ts`                 | Pure business logic         |
| Handler                   | `apps/api/src/handlers/`                    | `assessment.ts`                            | HTTP adapter                |

## Git Conventions

### Branch Naming

```
feat/story-{epic-num}-{story-num}-{slug}
├─ epic-num: Epic number (1-7 for current project)
├─ story-num: Story number within epic
└─ slug: URL-safe description of the story
```

**Examples:**
- `feat/story-1-2-integrate-better-auth`
- `feat/story-2-1-session-management-persistence`
- `feat/story-4-2-assessment-conversation-component`

### Commit Message Format

**Standard format:**

```
type(scope): Brief description

Detailed explanation of what was changed and why.

Co-Authored-By: Claude <model> <noreply@anthropic.com>
```

**Types:** `feat`, `fix`, `docs`, `chore`, `test`, `ci`, `refactor`, `perf`, `style`, `build`, `revert`

**Examples:**
- `feat: Add user authentication`
- `fix(api): Resolve session timeout issue`
- `docs: Update README with setup instructions`

### Commit Message Validation

Conventional commit format is enforced by git hooks:

```bash
git commit --no-verify   # Skip commit-msg hook (use sparingly)
git push --no-verify     # Skip pre-push hook
```

See [Git Hooks](#git-hooks-local-enforcement) in CLAUDE.md for details.
