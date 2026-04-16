// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-router", () => ({
	Link: ({
		children,
		to,
		params,
		search: _search,
		...props
	}: {
		children: React.ReactNode;
		to: string;
		params?: { conversationSessionId?: string };
		search?: unknown;
	}) => (
		<a href={to.replace("$conversationSessionId", params?.conversationSessionId ?? "")} {...props}>
			{children}
		</a>
	),
}));

import { PortraitReadingView } from "./PortraitReadingView";

const SAMPLE_PORTRAIT = `# Your Portrait

An opening paragraph about who you are.

## The Curious Mind — *Openness*

You approach the world with wide-open eyes.

## The Steady Hand — *Conscientiousness*

Your reliability is your quiet superpower.`;

describe("PortraitReadingView", () => {
	it("has data-slot attribute for testing", () => {
		const { container } = render(
			<PortraitReadingView content={SAMPLE_PORTRAIT} sessionId="test-session-id" />,
		);

		expect(container.querySelector("[data-slot='portrait-reading-view']")).toBeTruthy();
		expect(screen.getByRole("article", { name: /your portrait/i })).toBeTruthy();
	});

	it("renders portrait sections as headings and body text", () => {
		render(<PortraitReadingView content={SAMPLE_PORTRAIT} sessionId="test-session-id" />);

		expect(screen.getByText("Your Portrait")).toBeTruthy();
		expect(screen.getByText(/wide-open eyes/)).toBeTruthy();
		expect(screen.getByText(/quiet superpower/)).toBeTruthy();
	});

	it("renders 'There's more to see →' link", () => {
		render(<PortraitReadingView content={SAMPLE_PORTRAIT} sessionId="test-session-id" />);

		expect(screen.getByTestId("view-full-profile-btn")).toBeTruthy();
		expect(screen.getByText("There's more to see →")).toBeTruthy();
	});

	it("gives the back-to-results link a minimum touch target height", () => {
		render(<PortraitReadingView content={SAMPLE_PORTRAIT} sessionId="test-session-id" />);
		expect(screen.getByTestId("view-full-profile-btn").className).toMatch(/min-h-11/);
	});

	it("keeps the reading surface at prose width", () => {
		render(<PortraitReadingView content={SAMPLE_PORTRAIT} sessionId="test-session-id" />);

		expect(screen.getByRole("article", { name: /your portrait/i }).className).toContain(
			"max-w-[65ch]",
		);
	});

	it("links to the session-scoped Me surface", () => {
		render(<PortraitReadingView content={SAMPLE_PORTRAIT} sessionId="test-session-id" />);

		expect(screen.getByTestId("view-full-profile-btn")).toHaveAttribute(
			"href",
			"/me/test-session-id",
		);
	});

	it("does not render trait cards, radar, or OCEAN code", () => {
		const { container } = render(
			<PortraitReadingView content={SAMPLE_PORTRAIT} sessionId="test-session-id" />,
		);

		expect(container.querySelector("[data-slot='trait-card']")).toBeNull();
		expect(container.querySelector("[data-slot='personality-radar-chart']")).toBeNull();
		expect(container.querySelector("[data-slot='ocean-code-strand']")).toBeNull();
		expect(container.querySelector("[data-slot='archetype-hero']")).toBeNull();
	});

	it("renders raw text when no markdown sections found", () => {
		render(
			<PortraitReadingView
				content="Just a plain paragraph with no headings."
				sessionId="test-session-id"
			/>,
		);

		expect(screen.getByText("Just a plain paragraph with no headings.")).toBeTruthy();
	});
});
