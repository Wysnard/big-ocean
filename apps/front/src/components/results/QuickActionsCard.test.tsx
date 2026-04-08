// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// Mock TanStack Router Link to avoid router context requirement
vi.mock("@tanstack/react-router", () => ({
	Link: ({ children, ...props }: { children: React.ReactNode; to: string }) => (
		<a href={props.to}>{children}</a>
	),
}));

import { QuickActionsCard } from "./QuickActionsCard";

describe("QuickActionsCard", () => {
	it("renders the heading", () => {
		render(<QuickActionsCard />);
		expect(screen.getByText("Quick Actions")).toBeTruthy();
	});

	it("renders all 3 action items", () => {
		render(<QuickActionsCard />);
		expect(screen.getByText("View Dashboard")).toBeTruthy();
		expect(screen.getByText("View Public Profile")).toBeTruthy();
		expect(screen.getByText("Download Report")).toBeTruthy();
	});

	it("links the dashboard action to /dashboard", () => {
		render(<QuickActionsCard />);
		const dashboardLink = screen.getByText("View Dashboard").closest("a");
		expect(dashboardLink?.getAttribute("href")).toBe("/dashboard");
	});

	it("disables Download Report action", () => {
		render(<QuickActionsCard />);
		const downloadButton = screen.getByText("Download Report").closest("button");
		expect(downloadButton?.hasAttribute("disabled")).toBe(true);
	});

	it("disables View Public Profile when no publicProfileId", () => {
		render(<QuickActionsCard />);
		const profileButton = screen.getByText("View Public Profile").closest("button");
		expect(profileButton?.hasAttribute("disabled")).toBe(true);
	});

	it("has data-slot attribute", () => {
		const { container } = render(<QuickActionsCard />);
		expect(container.querySelector("[data-slot='quick-actions-card']")).not.toBeNull();
	});
});
