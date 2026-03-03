/**
 * Nerin farewell messages for assessment completion.
 * One is randomly selected when the user reaches the free-tier message threshold.
 *
 * Story 7.18: No LLM call — hardcoded pool saves cost and latency.
 */

export const NERIN_FAREWELL_MESSAGES = [
	"We're running low on oxygen — time to head back up 🤿 I've been building something in my head this whole dive. Give me a moment to put it on paper.",
	"That's our oxygen for today — gotta surface 🤿 I've been quietly tracing a thread through everything you've said. Let me write it down for you.",
	"Tank's almost empty — we need to come up 🤿 There's more I wanted to explore, but what I've got is enough to write you something real. Hold tight.",
] as const;

/**
 * Select a random farewell message from the pool.
 * Pure function — caller provides randomness or uses Math.random() default.
 */
export function pickFarewellMessage(random: () => number = Math.random): string {
	const index = Math.floor(random() * NERIN_FAREWELL_MESSAGES.length);
	return NERIN_FAREWELL_MESSAGES[index] ?? NERIN_FAREWELL_MESSAGES[0];
}
