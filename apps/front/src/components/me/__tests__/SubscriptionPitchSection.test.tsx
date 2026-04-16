// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockCreateThemedCheckoutEmbed, mockToastError } = vi.hoisted(() => ({
	mockCreateThemedCheckoutEmbed: vi.fn(),
	mockToastError: vi.fn(),
}));

vi.mock("@/lib/polar-checkout", () => ({
	createThemedCheckoutEmbed: mockCreateThemedCheckoutEmbed,
	POLAR_CHECKOUT_SLUG_SUBSCRIPTION: "subscription",
}));

vi.mock("sonner", () => ({
	toast: { error: mockToastError, success: vi.fn(), message: vi.fn() },
}));

vi.mock("@workspace/ui/hooks/use-theme", () => ({
	useTheme: () => ({ appTheme: "light", userTheme: "light", setTheme: vi.fn() }),
}));

import { SubscriptionPitchSection } from "../SubscriptionPitchSection";

function renderWithClient(ui: ReactElement) {
	const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
	return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe("SubscriptionPitchSection", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockCreateThemedCheckoutEmbed.mockResolvedValue({ addEventListener: vi.fn() });
	});

	it("renders the Nerin-voiced pitch copy", () => {
		renderWithClient(<SubscriptionPitchSection />);

		expect(screen.getByTestId("subscription-pitch")).toBeInTheDocument();
		expect(screen.getByText(/Continue your conversation with Nerin/)).toBeInTheDocument();
		expect(screen.getByText(/\+15 exchanges \+ a new portrait/)).toBeInTheDocument();
	});

	it("renders a single checkout CTA", () => {
		renderWithClient(<SubscriptionPitchSection />);

		expect(screen.getByTestId("subscription-checkout-cta")).toBeInTheDocument();
	});

	it("calls createThemedCheckoutEmbed with the subscription slug and theme on CTA click", async () => {
		renderWithClient(<SubscriptionPitchSection />);
		const user = userEvent.setup();

		await user.click(screen.getByTestId("subscription-checkout-cta"));

		expect(mockCreateThemedCheckoutEmbed).toHaveBeenCalledWith(
			"subscription",
			"light",
			undefined,
			expect.objectContaining({
				onSuccess: expect.any(Function),
			}),
		);
	});

	it("does not show a value summary or skeleton", () => {
		renderWithClient(<SubscriptionPitchSection />);

		expect(screen.queryByTestId("subscription-value-summary")).not.toBeInTheDocument();
		expect(screen.queryByTestId("subscription-skeleton")).not.toBeInTheDocument();
	});

	it("shows a Sonner error toast when checkout fails", async () => {
		mockCreateThemedCheckoutEmbed.mockRejectedValueOnce(new Error("Polar unavailable"));
		renderWithClient(<SubscriptionPitchSection />);
		const user = userEvent.setup();

		await user.click(screen.getByTestId("subscription-checkout-cta"));

		expect(mockToastError).toHaveBeenCalledWith("Polar unavailable");
	});
});
