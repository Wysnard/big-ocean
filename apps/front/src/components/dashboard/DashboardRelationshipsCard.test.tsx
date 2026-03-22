// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// Mock TanStack Router Link to avoid router context requirement
vi.mock("@tanstack/react-router", () => ({
	Link: ({ children, ...props }: { children: React.ReactNode; to: string }) => (
		<a href={props.to}>{children}</a>
	),
}));

import { DashboardRelationshipsCard } from "./DashboardRelationshipsCard";

describe("DashboardRelationshipsCard", () => {
	it("renders loading state", () => {
		render(<DashboardRelationshipsCard analyses={undefined} isLoading={true} />);
		expect(screen.getByTestId("dashboard-relationships-card")).toBeInTheDocument();
	});

	it("renders empty state with ocean metaphor", () => {
		render(<DashboardRelationshipsCard analyses={[]} isLoading={false} />);
		expect(screen.getByText("No analyses yet")).toBeInTheDocument();
		expect(screen.getByText(/two currents meeting/)).toBeInTheDocument();
	});

	it("renders analyses with version badges", () => {
		const analyses = [
			{
				analysisId: "analysis-1",
				userAName: "Alice",
				userBName: "Bob",
				isLatestVersion: true,
				hasContent: true,
				createdAt: "2026-03-20T10:00:00Z",
			},
			{
				analysisId: "analysis-2",
				userAName: "Alice",
				userBName: "Charlie",
				isLatestVersion: false,
				hasContent: true,
				createdAt: "2026-03-19T10:00:00Z",
			},
		];

		render(<DashboardRelationshipsCard analyses={analyses} isLoading={false} />);
		expect(screen.getByText("Alice & Bob")).toBeInTheDocument();
		expect(screen.getByText("Alice & Charlie")).toBeInTheDocument();
		expect(screen.getByTestId("previous-version-badge")).toBeInTheDocument();
		expect(screen.getAllByText("Read Analysis")).toHaveLength(2);
	});

	it("renders generating state for analyses without content", () => {
		const analyses = [
			{
				analysisId: "analysis-1",
				userAName: "Alice",
				userBName: "Bob",
				isLatestVersion: true,
				hasContent: false,
				createdAt: "2026-03-20T10:00:00Z",
			},
		];

		render(<DashboardRelationshipsCard analyses={analyses} isLoading={false} />);
		expect(screen.getByText("Generating...")).toBeInTheDocument();
	});
});
