/**
 * Compute Domain Streak
 *
 * Pure function that walks backward through assistant messages counting
 * consecutive same-domain turns. Returns 0 if no current domain.
 *
 * Story 2.3 (IC-2): domainStreak computed from message history.
 */
import type { LifeDomain } from "../../constants/life-domain";

/**
 * Counts consecutive same-`targetDomain` messages from the end of the array.
 * Returns 0 if the array is empty or the last message has `targetDomain === null`.
 */
export function computeDomainStreak(
	messages: readonly { readonly targetDomain: LifeDomain | null }[],
): number {
	if (messages.length === 0) return 0;

	const last = messages[messages.length - 1];
	if (last === undefined || last.targetDomain === null) return 0;

	const currentDomain = last.targetDomain;
	let streak = 0;

	for (let i = messages.length - 1; i >= 0; i--) {
		const msg = messages[i];
		if (msg !== undefined && msg.targetDomain === currentDomain) {
			streak++;
		} else {
			break;
		}
	}

	return streak;
}
