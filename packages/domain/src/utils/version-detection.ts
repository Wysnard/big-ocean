/**
 * Version Detection Utility (Story 36-3)
 *
 * Derive-at-read version classification for portraits and relationship analyses.
 * A result is "latest" if its ID matches the user's most recent completed result.
 *
 * This utility is intentionally simple — the caller is responsible for fetching
 * the latest result via getLatestByUserId.
 */

/**
 * Determines if a given result is the latest version for a user.
 *
 * @param resultId - The result ID to check
 * @param latestResultId - The user's most recent completed result ID (null if no results exist)
 * @returns true if resultId equals latestResultId, or if latestResultId is null
 */
export const isLatestVersion = (resultId: string, latestResultId: string | null): boolean => {
	if (latestResultId === null) return true;
	return resultId === latestResultId;
};
