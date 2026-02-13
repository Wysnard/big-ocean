/**
 * Nerin auto-greeting messages for new assessment sessions.
 * Persisted to the database as the first 3 assistant messages when a session starts.
 *
 * Messages 1-2 are fixed. Message 3 is randomly selected from OPENING_QUESTIONS.
 */

export const GREETING_MESSAGES = [
	"Hey there! I'm Nerin — I'm here to help you understand your personality through conversation. No multiple choice, no right answers, just us talking.",
	"Here's the thing: the more openly and honestly you share, the more accurate and meaningful your insights will be. This is a judgment-free space — be as real as you'd like. The honest answer, even if it's messy or contradictory, is always more valuable than the polished one.",
] as const;

/**
 * Pool of opening questions. One is randomly selected per session as message 3.
 */
export const OPENING_QUESTIONS = [
	"If your closest friend described you in three words, what would they say?",
	"What's something most people get wrong about you?",
	"Picture a perfect Saturday with nothing planned — what does your ideal day look like?",
	"Think of a moment recently when you felt most like yourself — what were you doing?",
] as const;

/**
 * Select a random opening question from the pool.
 * Pure function — caller provides randomness or uses Math.random() default.
 */
export function pickOpeningQuestion(random: () => number = Math.random): string {
	return OPENING_QUESTIONS[Math.floor(random() * OPENING_QUESTIONS.length)];
}
