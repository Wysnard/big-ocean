// @vitest-environment jsdom

import { render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-router", () => ({
	Link: ({ children, hash, to, ...props }: Record<string, unknown> & { children?: ReactNode }) => {
		const href = `${String(to)}${hash ? `#${String(hash)}` : ""}`;

		return (
			<a href={href} {...props}>
				{children}
			</a>
		);
	},
}));

vi.mock("@/lib/library-content", () => ({
	LIBRARY_TIER_LABELS: {
		archetype: "Archetypes",
		trait: "Traits",
		facet: "Facets",
		science: "Science",
		guides: "Guides",
	},
	LIBRARY_TIERS: ["archetype", "trait", "facet", "science", "guides"],
}));

import { LibraryNav } from "./LibraryNav";

describe("LibraryNav", () => {
	it("links tier pills to their library index shelves", () => {
		render(<LibraryNav activeTier="trait" />);

		expect(screen.getByTestId("library-nav-archetype")).toHaveAttribute(
			"href",
			"/library#all-archetype",
		);
		expect(screen.getByTestId("library-nav-trait")).toHaveAttribute("href", "/library#all-trait");
		expect(screen.getByTestId("library-nav-facet")).toHaveAttribute("href", "/library#all-facet");
		expect(screen.getByTestId("library-nav-science")).toHaveAttribute("href", "/library#all-science");
		expect(screen.getByTestId("library-nav-guides")).toHaveAttribute("href", "/library#all-guides");
	});

	it("links the article breadcrumb tier to the matching library shelf", () => {
		render(<LibraryNav activeTier="facet" articleTitle="Orderliness" />);

		const breadcrumb = screen.getByTestId("library-breadcrumb");

		expect(within(breadcrumb).getByRole("link", { name: "Library" })).toHaveAttribute(
			"href",
			"/library",
		);
		expect(screen.getByTestId("library-breadcrumb-tier")).toHaveAttribute(
			"href",
			"/library#all-facet",
		);
		expect(within(breadcrumb).getByText("Orderliness")).toHaveAttribute("aria-current", "page");
	});
});
