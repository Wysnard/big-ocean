/**
 * Date Utility Functions
 *
 * Shared date manipulation functions for cost tracking and rate limiting.
 */

/**
 * Get today's date in YYYY-MM-DD format (UTC).
 * Used for Redis key generation in cost tracking.
 *
 * @returns Date string in YYYY-MM-DD format (e.g., "2026-02-05")
 */
export function getUTCDateKey(): string {
	// biome-ignore lint/style/noNonNullAssertion: ISO 8601 format guarantees T separator
	return new Date().toISOString().split("T")[0]!;
}

/**
 * Get next day midnight UTC for rate limit reset calculations.
 * Used for resetAt timestamps in RateLimitExceeded errors.
 *
 * @returns Date object set to next day midnight UTC
 * @example
 * // Current time: 2026-02-05 14:30:00 UTC
 * getNextDayMidnightUTC()
 * // Returns: 2026-02-06 00:00:00 UTC
 */
export function getNextDayMidnightUTC(): Date {
	const tomorrow = new Date();
	tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
	tomorrow.setUTCHours(0, 0, 0, 0);
	return tomorrow;
}
