/**
 * Nerin auto-greeting messages for new assessment sessions.
 * Persisted to the database as the first 2 assistant messages when a session starts.
 *
 * Message 1 is fixed. Message 2 is randomly selected from OPENING_QUESTIONS.
 */

export const GREETING_MESSAGES = [
	"Hey — I'm Nerin 👋 We're about to have a conversation, and by the end I'll write you something about what I noticed. No quizzes, no right answers — just talk honestly and the messy, contradictory stuff is welcome 🤿",
] as const;

/**
 * Pool of opening questions. One is randomly selected per session as message 2.
 */
export const OPENING_QUESTIONS = [
	"If someone followed you around for a week, what would surprise them most about how you actually live?",
	"Free weekend ahead — are you the type to fill every hour with plans, or do you need it completely open? What happens when you get the opposite?",
	"If you had to send someone to explain *you* to a stranger — who are you sending, and what are they getting wrong?",
	"What's a rule you always break — and one you'd never break?",
	"What's the most boring true thing about you? Sometimes those are the ones I find most interesting.",
	"If you had to wear a sign around your neck for a day that said one true thing about you — what would it say?",
] as const;

/**
 * Select a random opening question from the pool.
 * Pure function — caller provides randomness or uses Math.random() default.
 */
export function pickOpeningQuestion(random: () => number = Math.random): string {
	const index = Math.floor(random() * OPENING_QUESTIONS.length);
	return OPENING_QUESTIONS[index] ?? OPENING_QUESTIONS[0];
}
