// @vitest-environment jsdom

import { render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("motion/react", async () => {
	const actual = await vi.importActual<typeof import("motion/react")>("motion/react");

	return {
		...actual,
		useReducedMotion: () => false,
		motion: {
			...actual.motion,
			div: ({
				children,
				initial: _initial,
				whileInView: _whileInView,
				viewport: _viewport,
				transition: _transition,
				...props
			}: {
				children: ReactNode;
				[key: string]: unknown;
			}) => <div {...props}>{children}</div>,
		},
	};
});

import { HomepageTimeline } from "./HomepageTimeline";

describe("HomepageTimeline", () => {
	it("renders four scroll-linked phase sections for DepthScrollProvider", () => {
		const { container } = render(<HomepageTimeline />);

		const phases = container.querySelectorAll("[data-homepage-phase]");
		expect(phases).toHaveLength(4);

		const keys = [...phases].map((el) => el.getAttribute("data-homepage-phase"));
		expect(keys).toEqual(["conversation", "portrait", "worldAfter", "reassurance"]);
	});

	it("renders World After product artifacts", () => {
		render(<HomepageTimeline />);

		expect(screen.getByTestId("today-screen-mockup")).toBeInTheDocument();
		expect(screen.getByTestId("homepage-weekly-letter-preview")).toBeInTheDocument();
		expect(screen.getByTestId("relationship-letter-fragment")).toBeInTheDocument();

		const carousel = screen.getByTestId("homepage-archetype-carousel");
		expect(within(carousel).getAllByTestId("homepage-archetype-card")).toHaveLength(5);
	});

	it("uses shared chat bubbles for the conversation preview", () => {
		const { container } = render(<HomepageTimeline />);

		expect(container.querySelectorAll("[data-slot='chat-bubble']")).toHaveLength(3);
	});

	it("renders sections without forced viewport heights so content sets the size", () => {
		const { container } = render(<HomepageTimeline />);

		const phases = container.querySelectorAll("[data-homepage-phase]");
		for (const phase of phases) {
			expect(phase.className).not.toMatch(/min-h-screen|min-h-\[\d+svh\]/);
		}
	});

	it("separates phases with a top divider instead of gradient bleed surfaces", () => {
		const { container } = render(<HomepageTimeline />);

		expect(
			container.querySelector("[data-testid='homepage-timeline-bleed-conversation-to-portrait']"),
		).toBeNull();
		expect(
			container.querySelector("[data-testid='homepage-timeline-bleed-portrait-to-world']"),
		).toBeNull();
		expect(
			container.querySelector("[data-testid='homepage-timeline-bleed-world-to-reassurance']"),
		).toBeNull();

		const phases = container.querySelectorAll("[data-homepage-phase]");
		for (const phase of phases) {
			expect(phase.className).toMatch(/border-t/);
		}
	});
});
