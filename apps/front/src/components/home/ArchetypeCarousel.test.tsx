// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockUseReducedMotion = vi.hoisted(() => vi.fn(() => false));

vi.mock("motion/react", async () => {
	const actual = await vi.importActual<typeof import("motion/react")>("motion/react");
	return {
		...actual,
		useReducedMotion: () => mockUseReducedMotion(),
	};
});

import { ArchetypeCarousel } from "./ArchetypeCarousel";

describe("ArchetypeCarousel", () => {
	beforeEach(() => {
		mockUseReducedMotion.mockReturnValue(false);
	});

	it("renders five hardcoded archetype cards", () => {
		render(<ArchetypeCarousel />);

		expect(screen.getAllByTestId("homepage-archetype-card")).toHaveLength(5);
		expect(screen.getAllByTestId("archetype-card")).toHaveLength(5);
		expect(screen.getAllByTestId("ocean-code-4")).toHaveLength(5);
		expect(screen.getAllByTestId("ocean-code-5")).toHaveLength(5);
		expect(screen.getAllByTestId("confidence-indicator")).toHaveLength(5);
	});

	it("scroll navigation buttons are present", () => {
		render(<ArchetypeCarousel />);

		expect(screen.getByRole("button", { name: /previous archetypes/i })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /next archetypes/i })).toBeInTheDocument();
	});

	it("uses instant scroll when reduced motion is preferred", () => {
		const scrollByMock = vi.fn();
		Object.defineProperty(HTMLElement.prototype, "scrollBy", {
			configurable: true,
			writable: true,
			value: scrollByMock,
		});

		mockUseReducedMotion.mockReturnValue(true);

		render(<ArchetypeCarousel />);

		fireEvent.click(screen.getByRole("button", { name: /next archetypes/i }));

		expect(scrollByMock).toHaveBeenCalledWith(
			expect.objectContaining({
				behavior: "auto",
			}),
		);

		delete (HTMLElement.prototype as unknown as { scrollBy?: unknown }).scrollBy;
	});
});
