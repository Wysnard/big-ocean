import { vi } from "vitest";

/**
 * Simulates the 2 greeting messages that the backend persists during startAssessment.
 * These are returned by the resume endpoint for new sessions.
 * (1 greeting bubble + 1 opening question)
 */
export const SERVER_GREETING_MESSAGES = [
	{
		role: "assistant" as const,
		content:
			"I'm Nerin 👋 No scripts, no right answers, nothing leaves this conversation — just you and me and whatever's true. I work best in the deep, messy, real stuff — so don't stay on the surface. Wherever a question takes you, follow it down 🤿",
		timestamp: "2026-02-01T10:00:00Z",
	},
	{
		role: "assistant" as const,
		content: "If your closest friend described you in three words, what would they say?",
		timestamp: "2026-02-01T10:00:01Z",
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

	// Default mock: new session with 2 server-persisted greeting messages
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
