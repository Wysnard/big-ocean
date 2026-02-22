/**
 * Nerin farewell messages for assessment completion.
 * One is randomly selected when the user reaches the free-tier message threshold.
 *
 * Story 7.18: No LLM call — hardcoded pool saves cost and latency.
 */

export const NERIN_FAREWELL_MESSAGES = [
	"We've gone somewhere real today. I'm going to sit with everything you've told me — and I want to write something for you. Give me a moment.",
	"This was a good dive. I've been quietly building a picture of you this whole time — and I think you'll find it interesting. Let me put it together.",
	"Thank you for going there with me. There's a thread running through everything you've said today — I want to take a moment to trace it properly. I'll have something for you soon.",
] as const;

/**
 * Select a random farewell message from the pool.
 * Pure function — caller provides randomness or uses Math.random() default.
 */
export function pickFarewellMessage(random: () => number = Math.random): string {
	const index = Math.floor(random() * NERIN_FAREWELL_MESSAGES.length);
	return NERIN_FAREWELL_MESSAGES[index] ?? NERIN_FAREWELL_MESSAGES[0];
}
