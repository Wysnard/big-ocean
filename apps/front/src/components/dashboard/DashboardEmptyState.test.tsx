// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// Mock TanStack Router Link to avoid router context requirement
vi.mock("@tanstack/react-router", () => ({
	Link: ({ children, ...props }: { children: React.ReactNode; to: string }) => (
		<a href={props.to}>{children}</a>
	),
}));

import { DashboardEmptyState } from "./DashboardEmptyState";

describe("DashboardEmptyState", () => {
	it("renders warm ocean-themed heading", () => {
		render(<DashboardEmptyState />);
		expect(screen.getByText("Your ocean awaits")).toBeInTheDocument();
	});

	it("renders CTA to start conversation", () => {
		render(<DashboardEmptyState />);
		const cta = screen.getByText("Start Your Conversation");
		expect(cta).toBeInTheDocument();
		expect(cta.closest("a")).toHaveAttribute("href", "/chat");
	});

	it("renders description with ocean metaphor", () => {
		render(<DashboardEmptyState />);
		expect(screen.getByText(/dive master/)).toBeInTheDocument();
	});

	it("has data-testid attribute", () => {
		render(<DashboardEmptyState />);
		expect(screen.getByTestId("dashboard-empty-state")).toBeInTheDocument();
	});

	it("CTA is wrapped in a link", () => {
		render(<DashboardEmptyState />);
		const cta = screen.getByText("Start Your Conversation").closest("a");
		expect(cta).toBeInTheDocument();
		expect(cta).toHaveAttribute("href", "/chat");
	});
});
