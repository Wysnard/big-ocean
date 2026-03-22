// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// Mock TanStack Router Link to avoid router context requirement
vi.mock("@tanstack/react-router", () => ({
	Link: ({ children, ...props }: { children: React.ReactNode; to: string }) => (
		<a href={props.to}>{children}</a>
	),
}));

// Mock the QrDrawer component since it has complex dependencies
vi.mock("@/components/relationship/QrDrawer", () => ({
	QrDrawerWithTrigger: () => <div data-testid="qr-drawer-trigger">QR Drawer</div>,
}));

// Mock polar checkout
vi.mock("@/lib/polar-checkout", () => ({
	createThemedCheckoutEmbed: vi.fn(),
}));

// Mock useTheme
vi.mock("@workspace/ui/hooks/use-theme", () => ({
	useTheme: () => ({ appTheme: "light", setTheme: vi.fn(), userTheme: "light" }),
}));

import { DashboardCreditsCard } from "./DashboardCreditsCard";

describe("DashboardCreditsCard", () => {
	it("renders loading state", () => {
		render(<DashboardCreditsCard credits={undefined} isLoading={true} userId="user-1" />);
		expect(screen.getByTestId("dashboard-credits-card")).toBeInTheDocument();
	});

	it("renders credit balance with QR trigger when credits > 0", () => {
		render(
			<DashboardCreditsCard
				credits={{ availableCredits: 3, hasCompletedAssessment: true }}
				isLoading={false}
				userId="user-1"
			/>,
		);
		expect(screen.getByText("3 credits")).toBeInTheDocument();
		expect(screen.getByTestId("qr-drawer-trigger")).toBeInTheDocument();
	});

	it("renders purchase CTA when credits = 0", () => {
		render(
			<DashboardCreditsCard
				credits={{ availableCredits: 0, hasCompletedAssessment: true }}
				isLoading={false}
				userId="user-1"
			/>,
		);
		expect(screen.getByText("0 credits")).toBeInTheDocument();
		expect(screen.getByTestId("dashboard-get-credits-button")).toBeInTheDocument();
	});

	it("renders singular credit text", () => {
		render(
			<DashboardCreditsCard
				credits={{ availableCredits: 1, hasCompletedAssessment: true }}
				isLoading={false}
				userId="user-1"
			/>,
		);
		expect(screen.getByText("1 credit")).toBeInTheDocument();
	});
});
