// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement, ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockUseSubscriptionState } = vi.hoisted(() => ({
	mockUseSubscriptionState: vi.fn(() => ({
		data: {
			subscriptionStatus: "none" as const,
			isEntitledToConversationExtension: false,
			subscribedSince: null,
		},
		isPending: false,
		isError: false,
		isFetching: false,
		error: null,
		refetch: vi.fn(),
	})),
}));

vi.mock("@/lib/polar-checkout", () => ({
	createThemedCheckoutEmbed: vi.fn(() => Promise.resolve({ addEventListener: vi.fn() })),
	POLAR_CHECKOUT_SLUG_SUBSCRIPTION: "subscription",
}));

vi.mock("@/hooks/use-subscription-state", () => ({
	useSubscriptionState: () => mockUseSubscriptionState(),
	pollUntilConversationExtensionEntitled: vi.fn().mockResolvedValue(true),
	subscriptionStateQueryKey: ["purchase", "subscription-state"],
}));

vi.mock("sonner", () => ({
	toast: { error: vi.fn(), message: vi.fn() },
}));

vi.mock("@workspace/ui/hooks/use-theme", () => ({
	useTheme: () => ({ appTheme: "light", userTheme: "light", setTheme: vi.fn() }),
}));

vi.mock("@tanstack/react-router", () => ({
	Link: ({
		to,
		children,
		...rest
	}: {
		to: string;
		children?: ReactNode;
		"data-testid"?: string;
		className?: string;
	}) => (
		<a href={to} {...rest}>
			{children}
		</a>
	),
}));

import { WeeklyLetterReadingView } from "../WeeklyLetterReadingView";

function renderWithQuery(ui: ReactElement) {
	const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
	return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe("WeeklyLetterReadingView", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockUseSubscriptionState.mockReturnValue({
			data: {
				subscriptionStatus: "none",
				isEntitledToConversationExtension: false,
				subscribedSince: null,
			},
			isPending: false,
			isError: false,
			isFetching: false,
			error: null,
			refetch: vi.fn(),
		});
	});

	it("renders markdown and conversion block", () => {
		renderWithQuery(<WeeklyLetterReadingView content={"## Hi\n\nSomething **bold**."} />);

		expect(screen.getByTestId("weekly-letter-reading")).toBeInTheDocument();
		expect(screen.getByTestId("weekly-letter-back-link")).toHaveAttribute("href", "/today");
		expect(screen.getByTestId("weekly-letter-cta-lead")).toHaveTextContent(
			"I have more I want to say about what comes next",
		);
		expect(screen.getByTestId("weekly-letter-checkout-cta")).toBeInTheDocument();
		expect(screen.getByTestId("weekly-letter-dismiss")).toHaveAttribute("href", "/today");
	});

	it("renders subscriber block without checkout when entitled to conversation extension", () => {
		mockUseSubscriptionState.mockReturnValue({
			data: {
				subscriptionStatus: "active",
				isEntitledToConversationExtension: true,
				subscribedSince: "2025-06-01T00:00:00.000Z",
			},
			isPending: false,
			isError: false,
			isFetching: false,
			error: null,
			refetch: vi.fn(),
		});

		renderWithQuery(<WeeklyLetterReadingView content={"## Hi"} />);

		expect(screen.getByTestId("weekly-letter-subscriber")).toBeInTheDocument();
		expect(screen.queryByTestId("weekly-letter-checkout-cta")).toBeNull();
		expect(screen.getByTestId("weekly-letter-me-link")).toHaveAttribute("href", "/me");
	});

	it("shows loading state while subscription query is pending", () => {
		mockUseSubscriptionState.mockReturnValue({
			data: undefined,
			isPending: true,
			isError: false,
			isFetching: true,
			error: null,
			refetch: vi.fn(),
		});

		renderWithQuery(<WeeklyLetterReadingView content={"## Hi"} />);

		expect(screen.getByTestId("weekly-letter-subscription-loading")).toBeInTheDocument();
		expect(screen.queryByTestId("weekly-letter-conversion")).toBeNull();
		expect(screen.queryByTestId("weekly-letter-subscriber")).toBeNull();
	});

	it("calls subscription refetch when Try again is clicked on error", async () => {
		const refetch = vi.fn().mockResolvedValue({ data: undefined });
		mockUseSubscriptionState.mockReturnValue({
			data: undefined,
			isPending: false,
			isError: true,
			isFetching: false,
			error: new Error("network"),
			refetch,
		});
		const user = userEvent.setup();

		renderWithQuery(<WeeklyLetterReadingView content={"## Hi"} />);

		await user.click(await screen.findByTestId("weekly-letter-subscription-retry"));
		expect(refetch).toHaveBeenCalledTimes(1);
	});
});
