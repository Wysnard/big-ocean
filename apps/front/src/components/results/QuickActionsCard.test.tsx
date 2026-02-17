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
		render(<QuickActionsCard sessionId="session-123" />);
		expect(screen.getByText("Quick Actions")).toBeInTheDocument();
	});

	it("renders all 3 action items", () => {
		render(<QuickActionsCard sessionId="session-123" />);
		expect(screen.getByText("Resume Conversation")).toBeInTheDocument();
		expect(screen.getByText("View Public Profile")).toBeInTheDocument();
		expect(screen.getByText("Download Report")).toBeInTheDocument();
	});

	it("disables Download Report action", () => {
		render(<QuickActionsCard sessionId="session-123" />);
		const downloadButton = screen.getByText("Download Report").closest("button");
		expect(downloadButton).toBeDisabled();
	});

	it("disables View Public Profile when no publicProfileId", () => {
		render(<QuickActionsCard sessionId="session-123" />);
		const profileButton = screen.getByText("View Public Profile").closest("button");
		expect(profileButton).toBeDisabled();
	});

	it("has data-slot attribute", () => {
		const { container } = render(<QuickActionsCard sessionId="session-123" />);
		expect(container.querySelector("[data-slot='quick-actions-card']")).toBeInTheDocument();
	});
});
