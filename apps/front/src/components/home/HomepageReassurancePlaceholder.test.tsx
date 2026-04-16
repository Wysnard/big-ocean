// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockUseReducedMotion = vi.hoisted(() => vi.fn(() => false));

vi.mock("motion/react", async () => {
	const actual = await vi.importActual<typeof import("motion/react")>("motion/react");

	return {
		...actual,
		useReducedMotion: () => mockUseReducedMotion(),
		motion: {
			...actual.motion,
			div: ({
				children,
				transition,
				initial: _initial,
				whileInView: _whileInView,
				viewport: _viewport,
				...props
			}: {
				children: ReactNode;
				transition?: { delay?: number; duration?: number };
				[key: string]: unknown;
			}) => (
				<div
					{...props}
					data-motion-delay={String(transition?.delay ?? "")}
					data-motion-duration={String(transition?.duration ?? "")}
				>
					{children}
				</div>
			),
		},
	};
});

import { HomepageReassurancePlaceholder } from "./HomepageReassurancePlaceholder";

describe("HomepageReassurancePlaceholder", () => {
	beforeEach(() => {
		mockUseReducedMotion.mockReturnValue(false);
	});

	it("renders the real reassurance section with three fear-addressing cards", () => {
		render(<HomepageReassurancePlaceholder />);

		expect(screen.getByText("Before you start")).toBeInTheDocument();
		expect(screen.getAllByTestId("homepage-reassurance-card")).toHaveLength(3);

		expect(screen.getByText("It's a conversation, not a quiz")).toBeInTheDocument();
		expect(screen.getByText("30 minutes that surprise you")).toBeInTheDocument();
		expect(
			screen.getByText("Everything Nerin writes comes from a place of understanding"),
		).toBeInTheDocument();
	});

	it("keeps the scroll-linked reassurance section contract intact", () => {
		render(<HomepageReassurancePlaceholder />);

		const wrapper = screen.getByTestId("homepage-reassurance-placeholder");
		const section = wrapper.closest("section");

		expect(section).toHaveAttribute("data-homepage-phase", "reassurance");
		expect(section).toHaveAttribute("id", "homepage-phase-reassurance");
	});

	it("includes concrete evidence blocks for conversation, time, and portrait tone", () => {
		render(<HomepageReassurancePlaceholder />);

		expect(
			screen.getByText(
				"No quiz energy here. Just tell me where your mind goes when the room finally gets quiet.",
			),
		).toBeInTheDocument();
		expect(
			screen.getByText('"By minute seven, I forgot I was supposed to be good at this."'),
		).toBeInTheDocument();
		expect(
			screen.getByText(
				"Nothing in you is too much for the page. The gentleness is part of the seeing.",
			),
		).toBeInTheDocument();
	});

	it("removes stagger when reduced motion is preferred", () => {
		mockUseReducedMotion.mockReturnValue(true);

		render(<HomepageReassurancePlaceholder />);

		for (const card of screen.getAllByTestId("homepage-reassurance-card")) {
			expect(card).toHaveAttribute("data-motion-delay", "0");
			expect(card).toHaveAttribute("data-motion-duration", "0");
		}
	});
});
