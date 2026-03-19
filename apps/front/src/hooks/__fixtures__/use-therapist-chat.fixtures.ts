import { vi } from "vitest";

/**
 * Simulates the 5 greeting messages that the backend persists during startAssessment.
 * These are returned by the resume endpoint for new sessions.
 * (4 greeting bubbles + 1 opening question)
 */
export const SERVER_GREETING_MESSAGES = [
	{
		role: "assistant" as const,
		content: "Welcome to Big Ocean — a diving shop where the ocean we explore is you 🌊",
		timestamp: "2026-02-01T10:00:00Z",
	},
	{
		role: "assistant" as const,
		content:
			"I'm Nerin, think of me as your dive master 👋 We'll talk for a bit, and by the end I'll write you a diving log — what waters we've been to, what I found beneath the surface, and what I think it means.",
		timestamp: "2026-02-01T10:00:01Z",
	},
	{
		role: "assistant" as const,
		content:
			"This isn't therapy, and there are no right answers — just be honest. I keep notes as we go so the log is precise — nothing leaves this dive.",
		timestamp: "2026-02-01T10:00:02Z",
	},
	{
		role: "assistant" as const,
		content:
			"The messy, contradictory, real stuff is what I work with best — stories beat theories every time. If a question doesn't quite fit, go wherever it takes you 🤿",
		timestamp: "2026-02-01T10:00:03Z",
	},
	{
		role: "assistant" as const,
		content: "If your closest friend described you in three words, what would they say?",
		timestamp: "2026-02-01T10:00:04Z",
	},
];

export function setupDefaultMocks(mockResumeSession: ReturnType<typeof vi.fn>) {
	// Mock matchMedia for greeting stagger reduced-motion detection
	Object.defineProperty(window, "matchMedia", {
		writable: true,
		value: vi.fn().mockImplementation((query: string) => ({
			matches: false,
			media: query,
			onchange: null,
			addListener: vi.fn(),
			removeListener: vi.fn(),
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			dispatchEvent: vi.fn(),
		})),
	});

	// Default mock: new session with 5 server-persisted greeting messages
	mockResumeSession.mockReturnValue({
		data: {
			messages: SERVER_GREETING_MESSAGES,
			confidence: {
				openness: 0,
				conscientiousness: 0,
				extraversion: 0,
				agreeableness: 0,
				neuroticism: 0,
			},
		},
		isLoading: false,
		error: null,
		refetch: vi.fn(),
	});
}
