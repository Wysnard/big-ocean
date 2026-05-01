# CI Secrets Checklist

Configure these values in GitHub repository settings under **Secrets and variables > Actions**.

## Repository Variables

- `RUN_E2E`: set to `true` to run Playwright E2E shards on normal push and pull request events.
- `E2E_EMAIL_FROM_ADDRESS`: optional sender address for E2E email flows. Defaults to `onboarding@resend.dev`.

## Required For E2E

- `RESEND_API_KEY`
- `POLAR_WEBHOOK_SECRET`
- `POLAR_PRODUCT_PORTRAIT_UNLOCK`
- `POLAR_PRODUCT_RELATIONSHIP_SINGLE`
- `POLAR_PRODUCT_RELATIONSHIP_5PACK`
- `POLAR_PRODUCT_EXTENDED_CONVERSATION`

## Optional For E2E

- `POLAR_ACCESS_TOKEN`
- `POLAR_PRODUCT_SUBSCRIPTION`

## Required For Pact When Contract Scripts Are Added

- `PACT_BROKER_BASE_URL`
- `PACT_BROKER_TOKEN`

The contract job also sets `GITHUB_BRANCH` for Pact provider verification. GitHub provides `GITHUB_SHA` automatically.

## Optional Notifications

- `SLACK_WEBHOOK_URL`: posts a non-blocking failure notification from the report job.

## Verification

After setting secrets:

1. Run the workflow manually from GitHub Actions.
2. Confirm the lint, build, and unit test jobs pass.
3. Confirm E2E shards run if `RUN_E2E=true` or the workflow was manually dispatched.
4. Confirm artifacts appear on failures.
5. Confirm Slack receives a message only when a quality gate fails and `SLACK_WEBHOOK_URL` is configured.
