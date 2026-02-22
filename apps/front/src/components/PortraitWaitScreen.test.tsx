// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PortraitWaitScreen } from "./PortraitWaitScreen";

// Mock useGetResults hook
let mockResultsData: unknown = undefined;
let mockIsError = false;
const mockRefetch = vi.fn();

vi.mock("@/hooks/use-assessment", () => ({
	useGetResults: () => ({
		data: mockResultsData,
		isError: mockIsError,
		refetch: mockRefetch,
	}),
}));

const queryClient = new QueryClient({
	defaultOptions: { queries: { retry: false } },
});

function renderWithProviders(component: React.ReactElement) {
	return render(<QueryClientProvider client={queryClient}>{component}</QueryClientProvider>);
}

describe("PortraitWaitScreen", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.clearAllMocks();
		mockResultsData = undefined;
		mockIsError = false;

		// Mock matchMedia for reduced-motion check
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
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("has data-slot attribute for testing", () => {
		const { container } = renderWithProviders(
			<PortraitWaitScreen sessionId="session-123" onRevealClick={vi.fn()} />,
		);

		expect(container.querySelector("[data-slot='portrait-wait-screen']")).toBeTruthy();
	});

	it("renders first rotating line on mount", () => {
		renderWithProviders(
			<PortraitWaitScreen sessionId="session-123" onRevealClick={vi.fn()} />,
		);

		expect(screen.getByText("Sitting with everything you told me...")).toBeTruthy();
	});

	it("rotates to next line after interval", () => {
		renderWithProviders(
			<PortraitWaitScreen sessionId="session-123" onRevealClick={vi.fn()} />,
		);

		act(() => {
			vi.advanceTimersByTime(8000);
		});

		expect(screen.getByText("Following the thread...")).toBeTruthy();
	});

	it("shows reveal when results ready and min wait elapsed", () => {
		mockResultsData = { portrait: "test" };

		renderWithProviders(
			<PortraitWaitScreen
				sessionId="session-123"
				portraitWaitMinMs={2000}
				onRevealClick={vi.fn()}
			/>,
		);

		// Before min wait — should not show reveal
		expect(screen.queryByText("Your portrait is ready.")).toBeNull();

		act(() => {
			vi.advanceTimersByTime(2000);
		});

		expect(screen.getByText("Your portrait is ready.")).toBeTruthy();
		expect(screen.getByTestId("read-portrait-btn")).toBeTruthy();
		expect(screen.getByText("Read what Nerin wrote")).toBeTruthy();
	});

	it("calls onRevealClick when reveal button is clicked", () => {
		mockResultsData = { portrait: "test" };
		const onRevealClick = vi.fn();

		renderWithProviders(
			<PortraitWaitScreen
				sessionId="session-123"
				portraitWaitMinMs={0}
				onRevealClick={onRevealClick}
			/>,
		);

		act(() => {
			vi.advanceTimersByTime(0);
		});

		fireEvent.click(screen.getByTestId("read-portrait-btn"));
		expect(onRevealClick).toHaveBeenCalledOnce();
	});

	it("shows error state with retry when results fail", () => {
		mockIsError = true;

		renderWithProviders(
			<PortraitWaitScreen sessionId="session-123" onRevealClick={vi.fn()} />,
		);

		expect(screen.getByText("Something got tangled.")).toBeTruthy();
		expect(screen.getByText("Let me try again.")).toBeTruthy();
		expect(screen.getByTestId("wait-retry-btn")).toBeTruthy();
	});

	it("calls refetch when retry button is clicked", () => {
		mockIsError = true;

		renderWithProviders(
			<PortraitWaitScreen sessionId="session-123" onRevealClick={vi.fn()} />,
		);

		fireEvent.click(screen.getByTestId("wait-retry-btn"));
		expect(mockRefetch).toHaveBeenCalledOnce();
	});

	it("does not show reveal when only min wait elapsed but results not ready", () => {
		mockResultsData = undefined;

		renderWithProviders(
			<PortraitWaitScreen
				sessionId="session-123"
				portraitWaitMinMs={2000}
				onRevealClick={vi.fn()}
			/>,
		);

		act(() => {
			vi.advanceTimersByTime(2000);
		});

		// Should still show rotating lines, not reveal
		expect(screen.queryByText("Your portrait is ready.")).toBeNull();
		expect(screen.getByText("Sitting with everything you told me...")).toBeTruthy();
	});
});
