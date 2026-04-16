// @vitest-environment jsdom

import { QueryClientProvider } from "@tanstack/react-query";
import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	mockHookReturn,
	queryClient,
	renderWithProviders,
	resetMockHookReturn,
	setupMatchMedia,
} from "./__fixtures__/therapist-chat.fixtures";
import { TherapistChat } from "./TherapistChat";

describe("TherapistChat", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		setupMatchMedia();
		resetMockHookReturn();
	});

	// Story 7.18: Farewell transition — input fade
	describe("Farewell Transition (Story 7.18)", () => {
		it("fades input area when isFarewellReceived is true", () => {
			mockHookReturn.isFarewellReceived = true;

			const { container } = renderWithProviders(<TherapistChat sessionId="session-123" />);

			const textarea = container.querySelector("[data-slot='chat-input']") as HTMLElement;
			const fadeWrapper = textarea?.closest("[class*='opacity-0']");
			expect(fadeWrapper).toBeTruthy();
			expect(fadeWrapper?.className).toContain("pointer-events-none");
		});

		it("replaces the input with a single portrait CTA when assessment is completed", () => {
			mockHookReturn.isCompleted = true;

			const { container } = renderWithProviders(
				<TherapistChat sessionId="session-123" isAuthenticated={true} />,
			);

			const textarea = container.querySelector("[data-slot='chat-input']");
			expect(textarea).toBeNull();
			expect(screen.queryByText("View Results")).toBeNull();
			expect(screen.getAllByRole("link", { name: "Show me what you found →" })).toHaveLength(1);
		});

		it("targets the portrait reading route and hides competing CTAs after farewell", () => {
			mockHookReturn.isFarewellReceived = true;

			const { container } = renderWithProviders(
				<TherapistChat sessionId="session-123" isAuthenticated={true} />,
			);

			const portraitLink = screen.getByRole("link", { name: "Show me what you found →" });
			const textarea = container.querySelector("[data-slot='chat-input']") as HTMLElement;
			const fadeWrapper = textarea?.closest("[class*='opacity-0']");

			expect(textarea).toBeTruthy();
			expect(fadeWrapper).toBeTruthy();
			expect(portraitLink).toHaveAttribute("href", "/me/session-123?view=portrait");
			expect(screen.queryByText("View Results")).toBeNull();
			expect(screen.getAllByTestId("post-assessment-transition-button")).toHaveLength(1);
		});

		it("does not fade input area during normal chat", () => {
			const { container } = renderWithProviders(<TherapistChat sessionId="session-123" />);

			const textarea = container.querySelector("[data-slot='chat-input']") as HTMLElement;
			const fadeWrapper = textarea?.closest("[class*='opacity-0']");
			expect(fadeWrapper).toBeNull();
		});

		it("does not show celebration card (removed in Story 7.18)", () => {
			const { container } = renderWithProviders(<TherapistChat sessionId="session-123" />);

			expect(container.querySelector("[data-slot='celebration-card']")).toBeNull();
			expect(screen.queryByText("Your Personality Profile is Ready!")).toBeNull();
		});

		it("does not show header results link (removed in Story 7.18)", () => {
			mockHookReturn.isConfidenceReady = true;

			renderWithProviders(<TherapistChat sessionId="session-123" />);

			expect(screen.queryByTestId("view-results-header-link")).toBeNull();
		});
	});

	// Story 9.5: Auto-focus and input behavior
	describe("Auto-focus (Story 9.5)", () => {
		it("textarea receives focus after mount when not resuming", () => {
			renderWithProviders(<TherapistChat sessionId="session-123" />);

			const textarea = screen.getByPlaceholderText("What comes to mind first?");
			expect(document.activeElement).toBe(textarea);
		});

		it("textarea receives focus after resume data loads", () => {
			// Start with resuming state — textarea is rendered but should NOT be focused
			mockHookReturn.isResuming = true;
			mockHookReturn.messages = [];

			const { rerender } = renderWithProviders(<TherapistChat sessionId="session-123" />);

			const textarea = screen.getByPlaceholderText("What comes to mind first?");
			expect(document.activeElement).not.toBe(textarea);

			// Simulate resume completing
			mockHookReturn.isResuming = false;
			mockHookReturn.messages = [
				{ id: "msg_1", role: "assistant", content: "Welcome back!", timestamp: new Date() },
			];

			rerender(
				<QueryClientProvider client={queryClient}>
					<TherapistChat sessionId="session-123" />
				</QueryClientProvider>,
			);

			const focusedTextarea = screen.getByPlaceholderText("What comes to mind first?");
			expect(document.activeElement).toBe(focusedTextarea);
		});

		it("textarea is NOT rendered when isCompleted is true", () => {
			mockHookReturn.isCompleted = true;

			const { container } = renderWithProviders(
				<TherapistChat sessionId="session-123" isAuthenticated={true} />,
			);

			const textarea = container.querySelector("[data-slot='chat-input']");
			expect(textarea).toBeNull();
		});

		it("textarea is NOT focused when isFarewellReceived is true (unauthenticated)", () => {
			mockHookReturn.isFarewellReceived = true;

			const { container } = renderWithProviders(
				<TherapistChat sessionId="session-123" isAuthenticated={false} />,
			);

			// Input should be faded — verify focus was not applied
			const textarea = container.querySelector("[data-slot='chat-input']");
			expect(textarea).toBeTruthy();
			expect(document.activeElement).not.toBe(textarea);
		});

		it("auto-scroll triggers when new messages arrive", async () => {
			Element.prototype.scrollIntoView = vi.fn();

			mockHookReturn.messages = [
				{ id: "msg_1", role: "assistant", content: "Hello", timestamp: new Date() },
			];

			const { rerender } = renderWithProviders(<TherapistChat sessionId="session-123" />);

			// Add a new message
			mockHookReturn.messages = [
				{ id: "msg_1", role: "assistant", content: "Hello", timestamp: new Date() },
				{ id: "msg_2", role: "user", content: "Hi there", timestamp: new Date() },
			];

			rerender(
				<QueryClientProvider client={queryClient}>
					<TherapistChat sessionId="session-123" />
				</QueryClientProvider>,
			);

			await waitFor(() => {
				expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth" });
			});
		});

		it("highlight scroll triggers when highlightMessageId URL param present", async () => {
			const scrollIntoViewMock = vi.fn();
			document.querySelector = vi.fn().mockReturnValue({
				scrollIntoView: scrollIntoViewMock,
			});

			mockHookReturn.messages = [
				{ id: "msg_highlight", role: "user", content: "Highlighted message", timestamp: new Date() },
			];

			renderWithProviders(
				<TherapistChat sessionId="session-123" highlightMessageId="msg_highlight" />,
			);

			await waitFor(() => {
				expect(scrollIntoViewMock).toHaveBeenCalledWith({ behavior: "smooth", block: "center" });
			});
		});

		it("input bar has data-slot='chat-input-bar' for E2E targeting", () => {
			const { container } = renderWithProviders(<TherapistChat sessionId="session-123" />);

			expect(container.querySelector("[data-slot='chat-input-bar']")).toBeTruthy();
		});
	});
});
