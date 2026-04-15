// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockCreateThemedCheckoutEmbed, mockToastError } = vi.hoisted(() => ({
	mockCreateThemedCheckoutEmbed: vi.fn(),
	mockToastError: vi.fn(),
}));

vi.mock("@/lib/polar-checkout", () => ({
	createThemedCheckoutEmbed: mockCreateThemedCheckoutEmbed,
}));

vi.mock("sonner", () => ({
	toast: { error: mockToastError, success: vi.fn() },
}));

vi.mock("@workspace/ui/hooks/use-theme", () => ({
	useTheme: () => ({ appTheme: "light", userTheme: "light", setTheme: vi.fn() }),
}));

import { SubscriptionPitchSection } from "../SubscriptionPitchSection";

describe("SubscriptionPitchSection", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockCreateThemedCheckoutEmbed.mockResolvedValue(undefined);
	});

	it("renders the Nerin-voiced pitch copy", () => {
		render(<SubscriptionPitchSection />);

		expect(screen.getByTestId("subscription-pitch")).toBeInTheDocument();
		expect(screen.getByText(/Continue your conversation with Nerin/)).toBeInTheDocument();
		expect(screen.getByText(/\+15 exchanges \+ a new portrait/)).toBeInTheDocument();
	});

	it("renders a single checkout CTA", () => {
		render(<SubscriptionPitchSection />);

		expect(screen.getByTestId("subscription-checkout-cta")).toBeInTheDocument();
	});

	it("calls createThemedCheckoutEmbed with the correct slug and theme on CTA click", async () => {
		render(<SubscriptionPitchSection />);
		const user = userEvent.setup();

		await user.click(screen.getByTestId("subscription-checkout-cta"));

		expect(mockCreateThemedCheckoutEmbed).toHaveBeenCalledWith("extended-conversation", "light");
	});

	it("does not show a value summary or skeleton", () => {
		render(<SubscriptionPitchSection />);

		expect(screen.queryByTestId("subscription-value-summary")).not.toBeInTheDocument();
		expect(screen.queryByTestId("subscription-skeleton")).not.toBeInTheDocument();
	});

	it("shows a Sonner error toast when checkout fails", async () => {
		mockCreateThemedCheckoutEmbed.mockRejectedValueOnce(new Error("Polar unavailable"));
		render(<SubscriptionPitchSection />);
		const user = userEvent.setup();

		await user.click(screen.getByTestId("subscription-checkout-cta"));

		expect(mockToastError).toHaveBeenCalledWith("Polar unavailable");
	});
});
