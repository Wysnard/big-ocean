# Story 2.1.1: GitHub Actions CI/CD with Use-Case Testing and Feature Branch Enforcement

**Status:** ready-for-dev

**Story ID:** 2.1.1
**Created:** 2026-02-01
**Epic:** 2 - Assessment Backend Services
**Epic Status:** in-progress (2-1 done, 2-1.1 ready-for-dev)

---

## Story

As a **developer**,
I want **automated CI/CD pipelines with mandatory use-case testing and feature branch requirements**,
so that **code quality is enforced, regressions are caught early, and development follows proper Git workflows**.

---

## Acceptance Criteria

1. **GitHub Actions Workflow Created** - CI/CD pipeline configured to run on:
   - Push to feature branches (all branches except master)
   - Pull requests to master
   - Manual trigger capability

2. **Use-Case Testing Enforcement** - Pipeline runs and validates:
   - All use-case tests pass (`apps/api/src/__tests__/*.test.ts`)
   - Test coverage metrics reported (target: ≥80% for new code)
   - Tests execute before allowing merge to master

3. **Feature Branch Enforcement (Remote)** - Git workflow rules on GitHub ensure:
   - Feature branches created with pattern: `feat/story-{epic}-{num}-{slug}` (matching CLAUDE.md)
   - All commits reference story number (e.g., "feat(story-2-1): ...")
   - Direct commits to master are blocked (except via PR merge)
   - Master branch protected with PR requirement

4. **Feature Branch Enforcement (Local)** - Git hooks prevent invalid commits:
   - Pre-commit hook: Runs lint and typecheck before committing
   - Commit-msg hook: Validates commit message format and story reference
   - Hooks prevent commits that don't follow story pattern
   - Developers can bypass with `--no-verify` if absolutely necessary

5. **TypeScript & Lint Validation** - Both local and remote validate:
   - TypeScript compilation succeeds (`pnpm typecheck`)
   - Biome linting passes with zero warnings (`pnpm lint`)
   - Build succeeds (`pnpm build`)
   - Both hooks (pre-commit) and CI (GitHub Actions) run same checks

6. **Documentation & Transparency** - Workflow and hooks provide:
   - Clear pass/fail indicators for each check (local & remote)
   - Detailed logs accessible in GitHub Actions UI
   - PR status checks that block merge on failure
   - Success badges or summary visible to developers
   - Clear error messages in pre-commit hooks guiding developers

7. **Documentation**: CLAUDE.md and README updated with CI/CD workflow explanation, Git hooks setup, and testing requirements

---

## Tasks / Subtasks

### Task 1: GitHub Actions Workflow Setup
- [ ] Create `.github/workflows/ci.yml` with jobs for:
  - Checkout code, setup Node.js/pnpm
  - Install dependencies (`pnpm install`)
  - Run TypeScript check (`pnpm typecheck`)
  - Run linter (`pnpm lint`)
  - Run build (`pnpm build`)
  - Run use-case tests (`pnpm --filter=api test`)
  - Report test coverage
- [ ] Configure workflow triggers: push (all branches), PR (to master), manual
- [ ] Set up artifact storage for test reports
- [ ] Verify workflow runs successfully on sample PR

### Task 2: Master Branch Protection & Git Rules
- [ ] Enable branch protection on master:
  - Require pull request reviews (optional: 1+ reviewer)
  - Require status checks to pass before merge
  - Require branches to be up-to-date before merging
  - Require commit signatures (optional)
- [ ] Configure branch naming: restrict direct commits to master
- [ ] Document required feature branch pattern in CLAUDE.md
- [ ] Create branch protection rule enforcement (if using advanced GitHub settings)

### Task 3: Test Integration & Coverage Reporting
- [ ] Integrate vitest with coverage reports (already in place from 7.1)
- [ ] Configure workflow to generate coverage reports
- [ ] Display coverage metrics in PR comments
- [ ] Set minimum coverage threshold (80%) with failure if not met
- [ ] Add coverage badge to README

### Task 4: Commit Message & Story Enforcement
- [ ] Create pre-commit hook (optional): validate story reference in commit message
- [ ] Document commit message format: `feat(story-X-Y): Description`
- [ ] Add GitHub Actions job to validate PR commits reference story numbers
- [ ] Block merge if commits don't reference story (optional advanced rule)

### Task 5: Git Hooks Setup for Local Enforcement
- [ ] Create pre-commit hook (`.husky/pre-commit`):
  - Lint staged files: `pnpm lint` (fail if warnings/errors)
  - Type check: `pnpm typecheck` (fail if errors)
  - Prevent commit if either check fails
- [ ] Create commit-msg hook (`.husky/commit-msg`):
  - Validate commit message format: `feat(story-X-Y): Description`
  - Extract story number from branch name if not in message
  - Reject commits that don't reference story
  - Allow special commits: `chore:`, `docs:`, `test:` without story ref (for documentation-only changes)
- [ ] Install Husky framework:
  - Add to package.json: `"prepare": "husky install"`
  - Create `.husky/` directory structure
  - Make hooks executable
- [ ] Create `.gitignore` entry for Husky (if not already present)
- [ ] Test hooks locally:
  - Try invalid commit message (should fail) ✓
  - Try committing without lint passing (should fail) ✓
  - Try valid commit (should succeed) ✓

### Task 6: Documentation & Developer Workflow
- [ ] Update CLAUDE.md:
  - Add "CI/CD Workflow" section explaining GitHub Actions pipeline
  - Add "Git Hooks" section explaining local enforcement
  - Document feature branch naming convention
  - Document commit message format with examples
  - Add troubleshooting section for common CI failures
  - Document how to bypass hooks if absolutely necessary (`git commit --no-verify`)
- [ ] Create `.github/workflows/README.md` or documentation:
  - Explain what each workflow step does
  - How to debug failing checks locally
  - How to skip CI (if applicable, with restrictions)
- [ ] Update root README.md with CI status badge and quick reference
- [ ] Documentation & Testing (AC: #6) — **REQUIRED BEFORE DONE**
  - [ ] Add JSDoc comments to any helper scripts created
  - [ ] Update CLAUDE.md with full workflow explanation including Git hooks
  - [ ] Write test to verify workflow configuration is valid
  - [ ] Test locally: Run git hooks on sample commits
  - [ ] Test CI: `npm run test:workflow` or manual PR test
  - [ ] Update story file with completion notes

---

## Dev Notes

### Architecture Compliance

**Relevant Architecture Patterns (from Story 2-0.5):**
- Effect-based dependency injection for services
- Repository pattern for data access
- Use-case pattern for business logic
- Drizzle ORM for database operations
- Vitest for unit testing framework (Story 7.1)

**CI/CD Pipeline Must:**
1. Verify all 3 packages compile (domain, contracts, infrastructure)
2. Verify all 2 apps compile (api, front)
3. Run use-case tests (`apps/api/src/__tests__/session-management.test.ts` verified in 2-1)
4. Ensure no existing tests break

### Project Structure Notes

**Relevant Files & Directories:**
- `.github/workflows/` - GitHub Actions workflow files (to be created)
- `apps/api/src/__tests__/` - Use-case tests (already implemented in 2-1)
- `packages/*/` - All packages must compile
- `pnpm-workspace.yaml` - Monorepo configuration (already configured)
- `CLAUDE.md` - Developer guidelines (update needed)
- `turbo.json` - Build configuration (reference for task ordering)

**Build Commands Verified:**
- `pnpm install` - Install workspace dependencies
- `pnpm --filter=api typecheck` - TypeScript check API package
- `pnpm lint` - Biome linting all packages
- `pnpm build` - Build all packages
- `pnpm --filter=api test` - Run API use-case tests

### Git Workflow Reference

**From CLAUDE.md - Story Development Process:**
```
1. Create feature branch: git checkout -b feat/story-{epic}-{num}-{slug}
2. Develop story following TDD workflow
3. Commit incrementally: feat(story-X-Y): Description
4. After dev: Run code-review workflow
5. Create PR to master (workflow blocks until CI passes)
6. After approval: Merge to master
```

**This story enforces step 1 and 5-6** via GitHub Actions and branch protection.

### Testing Standards Summary

**From Story 7.1 (Unit Testing Framework Setup):**
- Framework: `vitest`
- Test files: `**/__tests__/*.test.ts`
- Minimum coverage: 80% for new code
- Run tests: `pnpm --filter=api test`
- Coverage report: `pnpm --filter=api test -- --coverage`

**This story integrates Story 7.1 testing into CI pipeline.**

### Known Dependencies

- Story 2-1 (Session Management) - Use-case tests created, will be run in CI
- Story 7.1 (Unit Testing Framework) - Vitest and test patterns established
- All previous stories (1-1 through 2-0.5) - Must compile in CI

### Previous Story Intelligence

**From Story 2-0.5 (Effect-Based DI Refactoring):**
- Established Effect Context.Tag pattern for services
- Repository implementations use Layer.effect for DI
- All dependencies injected at layer construction time
- Error handling uses contract errors (DatabaseError, SessionNotFound)

**Learnings for Story 2-1.1:**
- CI must verify services compose correctly (Layer.mergeAll)
- Tests should verify service wiring, not just library behavior
- Error handling patterns established must be validated in tests

**From Story 2-1 (Session Management & Persistence):**
- Created use-case tests at `apps/api/src/__tests__/session-management.test.ts`
- Tests cover:
  - Service creation (createSession, getSession, updateSession)
  - Message persistence (saveMessage, getMessages, getMessageCount)
  - Service interface verification
  - Effect-based composition
- Performance verified: 19ms response time for 103-message session
- All TypeScript checks pass

**CI Pipeline Must:** Ensure these tests continue to pass as more stories are added.

### Git Analysis

**Recent commits (from master branch):**
```
4fdfa5d - feat(story-2-1): Mark session management story complete
79bea4c - chore(sprint-status): Update story 2-1 status to review
d70fe0f - fix(story-2-1): Resolve all CRITICAL code review findings
1bbc347 - feat(story-2-1): Session Management & Persistence - Core Implementation
fd99caf - feat(story-2-0.5): Effect-Based Dependency Injection Refactoring - COMPLETE
```

**Pattern observations:**
- Commit format: `{type}({scope}): {description}`
- Scope includes story reference: `(story-2-1)`
- Multiple commits per story (phase-based)
- All stories use feature branches (git status on branches, not master)

**For this story 2-1.1:**
- Commits should follow: `chore(story-2-1.1): ...` or `feat(story-2-1.1): ...`
- Branch: `feat/story-2-1-1-github-actions-ci-cd`
- Enforce this pattern in CI

### External Context & Latest Tech

**GitHub Actions (Latest 2026):**
- Matrix builds: Test across multiple Node.js versions (18.x, 20.x, 22.x)
- Caching: Use `actions/setup-node@v4` with pnpm cache for faster builds
- Coverage: `codecov/codecov-action` for external coverage reporting
- Branch protection: Available via GitHub API v3/GraphQL
- PR checks: Automatic status checks when workflow passes/fails

**Recommended Actions:**
- Use `actions/setup-node@v4` (latest)
- Use `pnpm/action-setup@v2` (latest, handles setup)
- Use `codecov/codecov-action@v3` for coverage reporting
- Consider `dorny/test-reporter@v1` for detailed test reports

**Testing Strategy:**
- Run tests on Node.js 20.x (current LTS, matches CLAUDE.md requirement)
- Optional: Matrix test on 18.x, 20.x for compatibility
- Store coverage reports as artifacts for download

---

## Technical Requirements

### Core Dependencies
- Node.js >= 20 (verify in workflow)
- pnpm >= 10.4.1 (verify in workflow)
- All existing dependencies from package.json (no new major deps needed)

### GitHub Actions Workflow Structure

**Workflow file:** `.github/workflows/ci.yml`

```yaml
name: CI - TypeScript, Lint, Build, Test

on:
  push:
    branches: ['**']  # All branches
  pull_request:
    branches: [master]
  workflow_dispatch:  # Manual trigger

jobs:
  ci:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [20.x]  # Primary: Node 20.x (LTS)

    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: TypeScript Check
        run: pnpm typecheck

      - name: Lint
        run: pnpm lint

      - name: Build
        run: pnpm build

      - name: Run Use-Case Tests
        run: pnpm --filter=api test

      - name: Upload Coverage (optional)
        if: always()
        uses: codecov/codecov-action@v3
        with:
          files: ./apps/api/coverage/coverage-final.json
          flags: api
```

### Git Hooks Configuration

**Husky Framework Setup:**

File: `.husky/pre-commit`
```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run linting on staged files
pnpm lint

# Run TypeScript check
pnpm typecheck

# If any check fails, prevent commit
if [ $? -ne 0 ]; then
  echo "❌ Pre-commit checks failed. Fix issues and try again."
  exit 1
fi
```

File: `.husky/commit-msg`
```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Validate commit message format
COMMIT_MSG=$(cat "$1")

# Allow special commits (docs, chore)
if [[ $COMMIT_MSG =~ ^(docs|chore|test|ci|refactor|perf|style): ]]; then
  exit 0
fi

# Require story reference: feat(story-X-Y): or fix(story-X-Y):
if [[ ! $COMMIT_MSG =~ ^(feat|fix|refactor)\(story-[0-9]+-[0-9]+ ]]; then
  echo "❌ Commit message must reference story number!"
  echo "Format: feat(story-X-Y): Description"
  echo "Or: fix(story-X-Y): Description"
  echo ""
  echo "Allowed special commits (no story ref):"
  echo "  - docs: ..."
  echo "  - chore: ..."
  echo "  - test: ..."
  exit 1
fi

exit 0
```

**Package.json setup:**
```json
{
  "scripts": {
    "prepare": "husky install",
    "lint": "biome lint --apply .",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "husky": "^9.0.0"
  }
}
```

**Installation:**
```bash
# Install Husky
npm install husky --save-dev
npx husky install

# Make hooks executable
chmod +x .husky/pre-commit
chmod +x .husky/commit-msg

# Test hook
git commit -m "test(story-2-1): Test commit"  # Should fail due to message format
git commit -m "feat(story-2-1-1): Test commit"  # Should run pre-commit checks
```

### Branch Protection Rules

**Master branch protection:**
- Require status checks to pass: `ci` job
- Require branches up-to-date: yes
- Require code reviews: optional (1+ if enabled)
- Dismiss stale reviews: yes
- Require commit signatures: optional

**Via GitHub API (if automating):**
```bash
gh api -X PUT /repos/OWNER/REPO/branches/master/protection \
  -f required_status_checks='{
    "strict": true,
    "contexts": ["ci"]
  }' \
  -f enforce_admins=true \
  -f restrictions=null
```

### Commit Validation (Optional Advanced)

**Pre-commit hook (local):** `.git/hooks/pre-commit`
- Validate commit message matches `feat(story-X-Y):`
- Prevent commits that don't reference story

**GitHub Actions validation (CI):**
- PR commit lint job (optional)
- Check all commits reference story number
- Block merge if any commit missing story reference

---

## Success Criteria

**Dev Completion (definition of done):**
- [ ] `.github/workflows/ci.yml` created and tested
- [ ] Master branch protection enabled
- [ ] Test workflow runs successfully on PR
- [ ] All 5 checks pass (typecheck, lint, build, test, coverage)
- [ ] CLAUDE.md updated with workflow documentation
- [ ] README.md updated with CI status badge
- [ ] All existing tests still pass
- [ ] Feature branch enforcement working (test: try pushing to master, expect failure)

**Verification:**
1. Create sample PR with changes
2. Verify CI workflow runs automatically
3. Verify all 5 checks pass or fail as expected
4. Try pushing to master directly (expect rejection or warning)
5. Merge PR after CI passes
6. Verify merged commit appears on master

---

## Developer Guidance

### Story Purpose

This story establishes **automated quality gates and Git workflow enforcement** to prevent:
1. Broken builds being committed to master
2. Code without tests going to production
3. Developers bypassing feature branch workflow
4. Regression bugs from slipping through untested code

### Key Implementation Files to Create/Modify

**Create:**
- `.github/workflows/ci.yml` - Main CI/CD workflow
- `.github/workflows/README.md` (optional) - Workflow documentation

**Modify:**
- `CLAUDE.md` - Add CI/CD workflow section and feature branch enforcement docs
- `README.md` - Add CI status badge

**Reference (do not modify, just understand):**
- `turbo.json` - Build task configuration
- `pnpm-workspace.yaml` - Workspace setup
- `.biomerc.json` - Linting configuration
- `tsconfig.json` - TypeScript configuration

### Development Checklist

1. **Setup GitHub Actions workflow:**
   - Create `.github/workflows/` directory
   - Create `ci.yml` with all 5 jobs (typecheck, lint, build, test, coverage)
   - Test locally: `act -j ci` or push to feature branch

2. **Test workflow execution:**
   - Push feature branch with sample commit
   - Verify workflow runs in GitHub Actions tab
   - Check all jobs pass
   - Verify PR shows passing checks

3. **Enable branch protection:**
   - Go to repo settings → Branches
   - Add rule for `master` branch
   - Enable "Require status checks to pass before merging"
   - Select `ci` job as required status check

4. **Document workflow:**
   - Update CLAUDE.md with workflow explanation
   - Add troubleshooting section
   - Document how to run tests locally before push
   - Add commit message format examples

5. **Test enforcement:**
   - Try to commit directly to master (should be blocked or warned)
   - Create feature branch properly
   - Submit PR
   - Verify CI blocks merge if tests fail
   - Fix and retry
   - Merge after CI passes

### Common Pitfalls to Avoid

1. **Workflow only runs on push:** Configure to run on PR too
2. **Tests not in path:** Use correct filter flag: `pnpm --filter=api test`
3. **Coverage report not found:** Verify vitest config generates coverage to correct path
4. **Node version mismatch:** Use Node 20.x to match CLAUDE.md requirement
5. **pnpm cache not working:** Use `pnpm/action-setup` before `setup-node`
6. **Master branch not protected:** GitHub doesn't auto-protect; must enable explicitly
7. **Status checks missing:** Ensure workflow job name matches protection rule setting

### Testing Strategy for This Story

Since this story is about **CI/CD infrastructure**, testing is partially manual:

**Automated Tests:**
- [ ] Verify workflow YAML syntax (GitHub Actions syntax checker)
- [ ] Verify branch protection rules via GitHub API

**Manual Tests (run before marking done):**
- [ ] Push feature branch with intentional lint error → CI fails ✓
- [ ] Fix lint error → CI passes ✓
- [ ] Try commit to master directly → Blocked/warned ✓
- [ ] Create PR with passing tests → Merges successfully ✓
- [ ] Verify master branch only has PRs merged, no direct commits

---

## Dev Agent Record

### Agent Model Used
Claude Haiku 4.5

### Key Context from Story 2-1 (Session Management)
- Use-case tests created: `apps/api/src/__tests__/session-management.test.ts`
- Tests verify service layer composition and session lifecycle
- All TypeScript checks pass
- Vitest framework in place (from Story 7.1)

### Key Dependencies
- Story 2-0.5: Effect-based dependency injection patterns
- Story 7.1: Unit testing framework (vitest, testing standards)
- CLAUDE.md: Developer workflow and commit message standards

### Completion Notes

**To be filled by developer after implementation:**
- Workflow tested and passing
- Branch protection rules enabled
- Documentation updated
- All PR checks functional

### File List

**Created:**
- `.github/workflows/ci.yml` - Main CI/CD workflow
- (optional) `.github/workflows/README.md` - Detailed workflow docs

**Modified:**
- `CLAUDE.md` - Added CI/CD workflow section
- `README.md` - Added CI status badge

---

## References

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Branch Protection Rules](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches)
- [CLAUDE.md - Story Development Process](file:///Users/vincentlay/Projects/big-ocean/CLAUDE.md#BMAD-Development-Workflow-Rules)
- [Story 2-1 - Session Management Use-Cases](file:///Users/vincentlay/Projects/big-ocean/_bmad-output/implementation-artifacts/2-1-session-management-and-persistence.md#Task-4--Service-Tests)
- [Story 7.1 - Unit Testing Framework](file:///Users/vincentlay/Projects/big-ocean/_bmad-output/implementation-artifacts/7-1-unit-testing-framework-setup-tdd-pattern.md)

---

## Related Stories & Dependencies

**Depends on (must be done first):**
- Story 2-1: Session Management & Persistence (use-case tests referenced)
- Story 7.1: Unit Testing Framework (vitest setup)

**Enables (unblocks):**
- Story 2-2: Nerin Agent (will need CI pipeline for its tests)
- Story 2-3, 2-4, 2-5: All subsequent backend stories
- All frontend stories (Epic 4+) - CI ensures code quality across monorepo

**Parallel work:**
- Can be done in parallel with Story 2-2
- Should be done before Epic 2 completion

---
