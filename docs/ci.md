# CI Pipeline Guide

The GitHub Actions pipeline lives at `.github/workflows/ci.yml`.

## Triggers

- Pushes to any branch
- Pull requests targeting `master`
- Manual `workflow_dispatch`
- Weekly scheduled burn-in on Sundays at 02:00 UTC

## Quality Gates

- `lint`: installs dependencies with `pnpm install --frozen-lockfile`, checks native optional dependencies, and runs `pnpm lint`.
- `build`: runs `pnpm typecheck` and `pnpm build`.
- `unit-tests`: runs `pnpm test:run` and uploads coverage artifacts when present.
- `e2e-tests`: runs Playwright in four shards when `RUN_E2E=true`, on manual dispatch, or on the weekly schedule.
- `contract-test`: checks for Pact scripts and runs contract gates when they exist. Until Pact is configured, it reports a skip in the GitHub Step Summary.
- `burn-in`: runs scheduled Playwright flaky detection with `--repeat-each=10` after E2E shards pass.
- `report`: writes an aggregate quality gate summary and optionally notifies Slack on failures.

P0 gates require 100% pass for lint, build, unit/integration tests, enabled E2E shards, and enabled contract tests. Scheduled burn-in is treated as a P1 stability gate.

## Local Parity

Run the default CI checks locally:

```bash
scripts/ci-local.sh
```

Run the CI checks plus E2E:

```bash
RUN_E2E=true scripts/ci-local.sh
```

Run Playwright burn-in locally:

```bash
scripts/burn-in.sh
```

Override burn-in iteration count:

```bash
BURN_IN_ITERATIONS=3 scripts/burn-in.sh
```

## E2E Requirements

The Playwright suite requires `.env.e2e`. In CI, `.github/workflows/ci.yml` creates that file from GitHub secrets before running E2E shards.

Set repository variable `RUN_E2E=true` to run E2E on normal push and pull request events. Without it, E2E runs on manual dispatch and the scheduled burn-in workflow.

## Artifacts

- Coverage artifacts are uploaded from `**/coverage/` when present.
- Playwright failure artifacts are uploaded from `e2e/test-results/` and `e2e/playwright-report/`.
- Burn-in failure artifacts use the same Playwright paths.
- Artifact links are available from the workflow run page and the generated GitHub Step Summary.

## Notifications

Slack notifications are optional. Configure `SLACK_WEBHOOK_URL` in GitHub Actions secrets to send a failure notification from the `report` job. Notification failures are non-blocking.

## Pact Contract Tests

The workflow includes a Pact-aware `contract-test` job because TEA contract utilities are enabled. The job becomes active when these root package scripts exist:

- `test:pact:consumer`
- `publish:pact`
- `test:pact:provider:remote:contract`
- `can:i:deploy:provider`

When active, `can:i:deploy:provider` is the final contract gate before deployment promotion.
