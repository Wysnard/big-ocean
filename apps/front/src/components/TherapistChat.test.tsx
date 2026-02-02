// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TherapistChat } from "./TherapistChat";

// Mock the useTherapistChat hook
vi.mock("@/hooks/useTherapistChat", () => ({
	useTherapistChat: (_sessionId: string) => ({
		messages: [
			{
				id: "msg_1",
				role: "assistant",
				content:
					"Hi! I'm Nerin, your AI therapist. I'd like to understand you better. Let's start with something simple: What are you currently passionate about?",
				timestamp: new Date(),
			},
		],
		traits: {
			openness: 0.58,
			conscientiousness: 0.42,
			extraversion: 0.55,
			agreeableness: 0.51,
			neuroticism: 0.38,
			opennessPrecision: 58,
			conscientiousnessPrecision: 42,
			extraversionPrecision: 55,
			agreeablenessPrecision: 51,
			neuroticismPrecision: 38,
		},
		isLoading: false,
		isCompleted: false,
		sendMessage: vi.fn(),
	}),
}));

const queryClient = new QueryClient();

function renderWithProviders(component: React.ReactElement) {
	return render(<QueryClientProvider client={queryClient}>{component}</QueryClientProvider>);
}

describe("TherapistChat", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders initial Nerin greeting", () => {
		renderWithProviders(<TherapistChat sessionId="session-123" />);

		const greeting = screen.getByText(
			/Hi! I'm Nerin, your AI therapist.*What are you currently passionate about/s,
		);
		expect(greeting).toBeTruthy();
	});

	it("displays session ID in header", () => {
		renderWithProviders(<TherapistChat sessionId="session-123" />);

		const sessionText = screen.getByText(/session-123/);
		expect(sessionText).toBeTruthy();
	});

	it("renders trait precision scores", () => {
		renderWithProviders(<TherapistChat sessionId="session-123" />);

		expect(screen.getByText("Openness")).toBeTruthy();
		expect(screen.getByText("Conscientiousness")).toBeTruthy();
		expect(screen.getByText("Extraversion")).toBeTruthy();
		expect(screen.getByText("Agreeableness")).toBeTruthy();
		expect(screen.getByText("Neuroticism")).toBeTruthy();

		// Check that Current Scores header is present
		expect(screen.getByText("Current Scores")).toBeTruthy();
	});

	it("renders message input field", () => {
		renderWithProviders(<TherapistChat sessionId="session-123" />);

		const input = screen.getByPlaceholderText("Type your response here...");
		expect(input).toBeTruthy();
	});

	it("renders send button", () => {
		renderWithProviders(<TherapistChat sessionId="session-123" />);

		const buttons = screen.getAllByRole("button");
		expect(buttons.length).toBeGreaterThan(0);
	});

	it("allows user to type in input field", () => {
		renderWithProviders(<TherapistChat sessionId="session-123" />);

		const input = screen.getByPlaceholderText("Type your response here...") as HTMLInputElement;
		fireEvent.change(input, { target: { value: "I love hiking" } });

		expect(input.value).toBe("I love hiking");
	});

	it("displays header with title", () => {
		renderWithProviders(<TherapistChat sessionId="session-123" />);

		const title = screen.getByText("Big Five Personality Assessment");
		expect(title).toBeTruthy();
	});

	it("renders message list scrollable", () => {
		const { container } = renderWithProviders(<TherapistChat sessionId="session-123" />);

		const messagesArea = container.querySelector(".overflow-y-auto");
		expect(messagesArea).toBeTruthy();
	});

	it("input field is present and enabled", () => {
		renderWithProviders(<TherapistChat sessionId="session-123" />);

		const input = screen.getByPlaceholderText("Type your response here...") as HTMLInputElement;
		expect(input).toBeTruthy();
		expect(input.disabled).toBe(false);
	});
});
