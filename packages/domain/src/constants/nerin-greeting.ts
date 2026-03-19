/**
 * Nerin auto-greeting messages for new assessment sessions.
 * Persisted to the database as the first 5 assistant messages when a session starts.
 *
 * Messages 1-4 are fixed greeting bubbles. Message 5 is randomly selected from OPENING_QUESTIONS.
 *
 * Greeting includes (per FR8, FR52, FR54):
 * - Big Ocean diving shop introduction (bubble 1)
 * - Dive master introduction + diving log anticipation (bubble 2)
 * - "Not therapy" framing + data storage notice (bubble 3)
 * - Encouragement cues: honesty, concrete stories, going beyond (bubble 4)
 */

export const GREETING_MESSAGES = [
	"Welcome to Big Ocean — a diving shop where the ocean we explore is you 🌊",
	"I'm Nerin, think of me as your dive master 👋 We'll talk for a bit, and by the end I'll write you a diving log — what waters we've been to, what I found beneath the surface, and what I think it means.",
	"This isn't therapy, and there are no right answers — just be honest. I keep notes as we go so the log is precise — nothing leaves this dive.",
	"The messy, contradictory, real stuff is what I work with best — stories beat theories every time. If a question doesn't quite fit, go wherever it takes you 🤿",
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
