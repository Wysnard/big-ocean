/**
 * Two-tier placeholder pools for the chat input textarea.
 * Playful tier for early conversation (messages 1-15), calmer tier for later (16+).
 */

export const PLAYFUL_PLACEHOLDERS = [
	"What comes to mind first?",
	"Tell me more about that...",
	"There's no wrong answer here...",
	"What does that look like for you?",
	"Share whatever feels right...",
	"What would your friends say?",
	"Take your time with this one...",
	"How does that make you feel?",
	"What's your gut reaction?",
	"Paint me a picture...",
	"Go with your first instinct...",
	"What's that like for you?",
] as const;

export const CALM_PLACEHOLDERS = [
	"What else comes to mind?",
	"Anything you'd like to add?",
	"Share your thoughts...",
	"Keep going, I'm listening...",
	"You're doing great...",
	"What would you like to explore?",
	"Tell me a bit more...",
	"Anything else on your mind?",
	"I'm here, take your time...",
	"What stands out to you?",
] as const;

/**
 * Returns a random placeholder from the appropriate tier based on user message count.
 */
export function getPlaceholder(userMessageCount: number, threshold = 25): string {
	const pool = userMessageCount < threshold ? PLAYFUL_PLACEHOLDERS : CALM_PLACEHOLDERS;
	return pool[Math.floor(Math.random() * pool.length)];
}
