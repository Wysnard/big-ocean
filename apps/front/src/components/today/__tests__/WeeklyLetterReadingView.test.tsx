// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { vi } from "vitest";

vi.mock("@/lib/polar-checkout", () => ({
	createThemedCheckoutEmbed: vi.fn(() => Promise.resolve()),
}));

vi.mock("sonner", () => ({
	toast: { error: vi.fn() },
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

import { describe, expect, it } from "vitest";
import { WeeklyLetterReadingView } from "../WeeklyLetterReadingView";

describe("WeeklyLetterReadingView", () => {
	it("renders markdown and conversion block", () => {
		render(<WeeklyLetterReadingView content={"## Hi\n\nSomething **bold**."} />);

		expect(screen.getByTestId("weekly-letter-reading")).toBeInTheDocument();
		expect(screen.getByTestId("weekly-letter-back-link")).toHaveAttribute("href", "/today");
		expect(screen.getByTestId("weekly-letter-cta-lead")).toHaveTextContent(
			"I have more I want to say about what comes next",
		);
		expect(screen.getByTestId("weekly-letter-checkout-cta")).toBeInTheDocument();
		expect(screen.getByTestId("weekly-letter-dismiss")).toHaveAttribute("href", "/today");
	});
});
