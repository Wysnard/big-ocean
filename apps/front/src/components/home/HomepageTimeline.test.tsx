// @vitest-environment jsdom

import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

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

	it("includes in-section gradient bleeds between phases (no standalone gaps)", () => {
		render(<HomepageTimeline />);

		expect(
			screen.getByTestId("homepage-timeline-bleed-conversation-to-portrait"),
		).toBeInTheDocument();
		expect(screen.getByTestId("homepage-timeline-bleed-portrait-to-world")).toBeInTheDocument();
		expect(screen.getByTestId("homepage-timeline-bleed-world-to-reassurance")).toBeInTheDocument();
	});
});
