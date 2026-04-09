// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
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
			<PortraitReadingView content={SAMPLE_PORTRAIT} onViewFullProfile={vi.fn()} />,
		);

		expect(container.querySelector("[data-slot='portrait-reading-view']")).toBeTruthy();
		expect(screen.getByRole("article", { name: /your portrait/i })).toBeTruthy();
	});

	it("renders portrait sections as headings and body text", () => {
		render(<PortraitReadingView content={SAMPLE_PORTRAIT} onViewFullProfile={vi.fn()} />);

		expect(screen.getByText("Your Portrait")).toBeTruthy();
		expect(screen.getByText(/wide-open eyes/)).toBeTruthy();
		expect(screen.getByText(/quiet superpower/)).toBeTruthy();
	});

	it("renders 'See your full personality profile' link", () => {
		render(<PortraitReadingView content={SAMPLE_PORTRAIT} onViewFullProfile={vi.fn()} />);

		expect(screen.getByTestId("view-full-profile-btn")).toBeTruthy();
		expect(screen.getByText("See your full personality profile")).toBeTruthy();
	});

	it("keeps the reading surface at prose width", () => {
		render(<PortraitReadingView content={SAMPLE_PORTRAIT} onViewFullProfile={vi.fn()} />);

		expect(screen.getByRole("article", { name: /your portrait/i }).className).toContain(
			"max-w-[65ch]",
		);
	});

	it("calls onViewFullProfile when link is clicked", () => {
		const onViewFullProfile = vi.fn();
		render(<PortraitReadingView content={SAMPLE_PORTRAIT} onViewFullProfile={onViewFullProfile} />);

		fireEvent.click(screen.getByTestId("view-full-profile-btn"));
		expect(onViewFullProfile).toHaveBeenCalledOnce();
	});

	it("does not render trait cards, radar, or OCEAN code", () => {
		const { container } = render(
			<PortraitReadingView content={SAMPLE_PORTRAIT} onViewFullProfile={vi.fn()} />,
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
				onViewFullProfile={vi.fn()}
			/>,
		);

		expect(screen.getByText("Just a plain paragraph with no headings.")).toBeTruthy();
	});
});
