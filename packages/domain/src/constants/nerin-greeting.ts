/**
 * Nerin auto-greeting messages for new assessment sessions.
 * Persisted to the database as the first 2 assistant messages when a session starts.
 *
 * Message 1 is fixed. Message 2 is randomly selected from OPENING_QUESTIONS.
 *
 * Greeting includes (per FR8, FR52, FR54):
 * - "Not therapy" framing woven naturally into Nerin's voice
 * - Data storage notice in conversational tone
 * - Encouragement cues (honesty, concrete examples, going beyond)
 * - Portrait anticipation without revealing the format
 */

export const GREETING_MESSAGES = [
	"Hey — I'm Nerin 👋 We're about to have a conversation, and by the end I'll write you something about what I noticed. This isn't therapy and there are no right answers — just talk honestly. I keep notes from our conversation so I can be precise about what I see. The messy, contradictory, real stuff is welcome — and if a question doesn't quite fit, go wherever it takes you 🤿",
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
