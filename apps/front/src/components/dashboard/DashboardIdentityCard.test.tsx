// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { OceanCode5Schema } from "@workspace/domain";
import { TooltipProvider } from "@workspace/ui/components/tooltip";
import { describe, expect, it, vi } from "vitest";

// Mock TanStack Router Link to avoid router context requirement
vi.mock("@tanstack/react-router", () => ({
	Link: ({
		children,
		...props
	}: { children: React.ReactNode; to: string } & Record<string, unknown>) => (
		<a {...props} href={props.to as string}>
			{children}
		</a>
	),
}));

import { DashboardIdentityCard } from "./DashboardIdentityCard";

const defaultProps = {
	archetypeName: "The Beacon",
	oceanCode5: OceanCode5Schema.make("OCEAR"),
	sessionId: "session-123",
	dominantTrait: "openness" as const,
};

function renderWithProviders(ui: React.ReactElement) {
	return render(<TooltipProvider>{ui}</TooltipProvider>);
}

describe("DashboardIdentityCard", () => {
	it("renders archetype name", () => {
		renderWithProviders(<DashboardIdentityCard {...defaultProps} />);
		expect(screen.getByTestId("dashboard-archetype-name")).toHaveTextContent("The Beacon");
	});

	it("renders OCEAN code letters", () => {
		renderWithProviders(<DashboardIdentityCard {...defaultProps} />);
		const letters = defaultProps.oceanCode5.split("");
		for (const letter of letters) {
			expect(screen.getByText(letter)).toBeInTheDocument();
		}
	});

	it("renders OCEAN code letters as 44px buttons", () => {
		renderWithProviders(<DashboardIdentityCard {...defaultProps} />);
		const buttons = screen.getAllByRole("button");
		const oceanButtons = buttons.filter((button) => {
			const text = button.textContent?.trim() ?? "";
			return text.length === 1 && defaultProps.oceanCode5.includes(text);
		});
		expect(oceanButtons).toHaveLength(5);
		for (const button of oceanButtons) {
			expect(button.className).toMatch(/min-h-11/);
			expect(button.className).toMatch(/min-w-11/);
		}
	});

	it("renders View Full Results link", () => {
		renderWithProviders(<DashboardIdentityCard {...defaultProps} />);
		expect(screen.getByText("View Full Results")).toBeInTheDocument();
	});

	it("gives the public profile link a compliant tap target", () => {
		renderWithProviders(<DashboardIdentityCard {...defaultProps} publicProfileId="public-123" />);
		const link = screen
			.getAllByRole("link")
			.find((candidate) => candidate.getAttribute("href")?.includes("/public-profile/"));
		if (!link) throw new Error("Expected public profile link");
		expect(link.className).toMatch(/min-h-11/);
		expect(link.className).toMatch(/min-w-11/);
	});

	it("has data-testid attribute", () => {
		renderWithProviders(<DashboardIdentityCard {...defaultProps} />);
		expect(screen.getByTestId("dashboard-identity-card")).toBeInTheDocument();
	});
});
