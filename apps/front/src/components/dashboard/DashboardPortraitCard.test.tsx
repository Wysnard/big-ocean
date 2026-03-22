// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// Mock TanStack Router Link to avoid router context requirement
vi.mock("@tanstack/react-router", () => ({
	Link: ({ children, ...props }: { children: React.ReactNode; to: string }) => (
		<a href={props.to}>{children}</a>
	),
}));

import { DashboardPortraitCard } from "./DashboardPortraitCard";

describe("DashboardPortraitCard", () => {
	it("renders locked state when portrait status is none", () => {
		render(
			<DashboardPortraitCard
				portraitStatus="none"
				sessionId="session-123"
				onUnlockPortrait={() => {}}
			/>,
		);
		expect(screen.getByText(/Unlock it to read/)).toBeInTheDocument();
		expect(screen.getByTestId("dashboard-unlock-portrait")).toBeInTheDocument();
	});

	it("renders locked state when portrait status is undefined", () => {
		render(
			<DashboardPortraitCard
				portraitStatus={undefined}
				sessionId="session-123"
				onUnlockPortrait={() => {}}
			/>,
		);
		expect(screen.getByText(/Unlock it to read/)).toBeInTheDocument();
	});

	it("renders generating state", () => {
		render(<DashboardPortraitCard portraitStatus="generating" sessionId="session-123" />);
		expect(screen.getByText("Nerin is writing...")).toBeInTheDocument();
	});

	it("renders ready state with read link", () => {
		render(<DashboardPortraitCard portraitStatus="ready" sessionId="session-123" />);
		expect(screen.getByText("Read Your Portrait")).toBeInTheDocument();
	});

	it("renders failed state", () => {
		render(<DashboardPortraitCard portraitStatus="failed" sessionId="session-123" />);
		expect(screen.getByText(/encountered an issue/)).toBeInTheDocument();
		expect(screen.getByText("Go to Results")).toBeInTheDocument();
	});

	it("has data-testid attribute", () => {
		render(<DashboardPortraitCard portraitStatus="none" sessionId="session-123" />);
		expect(screen.getByTestId("dashboard-portrait-card")).toBeInTheDocument();
	});
});
