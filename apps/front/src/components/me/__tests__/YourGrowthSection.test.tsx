// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockUseHasCheckIns } = vi.hoisted(() => ({
	mockUseHasCheckIns: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
	Link: ({ children, to, ...props }: Record<string, unknown> & { children?: ReactNode }) => (
		<a href={to as string} {...props}>
			{children}
		</a>
	),
}));

vi.mock("@/hooks/use-has-check-ins", () => ({
	useHasCheckIns: (...args: unknown[]) => mockUseHasCheckIns(...args),
}));

import { YourGrowthSection } from "../YourGrowthSection";

describe("YourGrowthSection", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders nothing when the user has no check-ins yet", () => {
		mockUseHasCheckIns.mockReturnValue({
			data: { hasCheckIns: false },
			isLoading: false,
			isError: false,
		});

		const { container } = render(<YourGrowthSection />);

		expect(container).toBeEmptyDOMElement();
	});

	it("renders a link to the mood calendar when history exists", () => {
		mockUseHasCheckIns.mockReturnValue({
			data: { hasCheckIns: true },
			isLoading: false,
			isError: false,
		});

		render(<YourGrowthSection />);

		expect(screen.getByTestId("me-section-growth")).toBeInTheDocument();
		expect(screen.getByTestId("me-growth-calendar-link")).toHaveAttribute("href", "/today/calendar");
	});
});
