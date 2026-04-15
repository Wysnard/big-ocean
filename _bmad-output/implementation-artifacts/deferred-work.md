# Deferred Work

## Deferred from: code review of 5-3-weekly-letter-inline-card-and-notifications (2026-04-15)

- **Unbounded push concurrency** — `sendWeeklyLetterReadyNotification` uses `concurrency: "unbounded"` for `Effect.forEach` over push subscriptions. Mirrors existing `send-relationship-analysis-notification` pattern. Low risk in practice (few subs per user) but a spike risk at scale.
- **PII in logs** — Email address logged on push failures, success, and error paths. Pre-existing pattern across all notification use-cases. Consider hashing or redacting in a future logging hygiene pass.
- **QuietAnticipationLine / WeeklyLetterCard use different clocks for Sunday** — `QuietAnticipationLine` uses `new Date()` while `WeeklyLetterCard` uses the `localDate` prop. Pre-existing `QuietAnticipationLine` behavior; only matters at timezone boundaries right at midnight.
- **`letterUrl` double-slash if `frontendUrl` has trailing slash** — `\`${config.frontendUrl}/today/week/${weekId}\`` produces `//` if env var is configured with trailing slash. Same pattern as relationship-analysis notification; fix centrally in a config normalization pass.
- **Push+email duplicate on uncaught Effect defect in `forEach`** — If a push subscription throws an error type not covered by `catchTags`, the outer `catchAll` returns `pushDelivered = false` and email fallback runs even if some subscriptions were notified. Pre-existing pattern from relationship-analysis; low probability in production.
