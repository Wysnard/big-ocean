/**
 * Nerin auto-greeting messages for new assessment sessions.
 * Persisted to the database as the first 3 assistant messages when a session starts.
 *
 * Messages 1-2 are fixed. Message 3 is randomly selected from OPENING_QUESTIONS.
 */

export const GREETING_MESSAGES = [
	"Hey 👋 I'm Nerin — think of me as your personality dive master. We're going to have a conversation, and by the end you'll see yourself in ways that might surprise you. No quizzes, no right answers — just a good conversation 🤿",
	"There's no good or bad answers here — just *true* ones. And honestly, the messy, contradictory stuff? That's usually where the most interesting patterns are hiding 🐙",
] as const;

/**
 * Pool of opening questions. One is randomly selected per session as message 3.
 */
export const OPENING_QUESTIONS = [
	"If someone followed you around for a week, what would surprise them most about how you actually live?",
	"When you've got a free weekend — are you the type to fill every hour with plans, or do you need it completely open? What happens when you get the opposite?",
	"If you had to send someone to explain *you* to a stranger — who are you sending, and what are they getting wrong?",
	"You're at the beach — are you the one diving straight into the waves, testing the water with your toes first, or watching from the shore with a book? 🌊",
	"What's a rule you always break — and one you'd never break?",
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
