// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { OceanCode5Schema } from "@workspace/domain";
import { TooltipProvider } from "@workspace/ui/components/tooltip";
import { describe, expect, it, vi } from "vitest";

// Mock TanStack Router Link to avoid router context requirement
vi.mock("@tanstack/react-router", () => ({
	Link: ({ children, ...props }: { children: React.ReactNode; to: string }) => (
		<a href={props.to}>{children}</a>
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

	it("renders View Full Results link", () => {
		renderWithProviders(<DashboardIdentityCard {...defaultProps} />);
		expect(screen.getByText("View Full Results")).toBeInTheDocument();
	});

	it("has data-testid attribute", () => {
		renderWithProviders(<DashboardIdentityCard {...defaultProps} />);
		expect(screen.getByTestId("dashboard-identity-card")).toBeInTheDocument();
	});
});
