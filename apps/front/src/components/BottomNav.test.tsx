// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockPathname } = vi.hoisted(() => ({
	mockPathname: vi.fn(() => "/today"),
}));

vi.mock("@tanstack/react-router", () => ({
	Link: ({ children, to, ...props }: Record<string, unknown> & { children?: ReactNode }) => (
		<a href={to as string} {...props}>
			{children}
		</a>
	),
	useRouterState: ({ select }: { select: (state: { location: { pathname: string } }) => unknown }) =>
		select({
			location: {
				pathname: mockPathname(),
			},
		}),
}));

import { BottomNav } from "./BottomNav";

describe("BottomNav", () => {
	beforeEach(() => {
		mockPathname.mockReset();
		mockPathname.mockReturnValue("/today");
	});

	it("renders both desktop and mobile variants from one route-aware source", () => {
		render(<BottomNav />);

		expect(screen.getByTestId("bottom-nav-desktop")).toHaveClass("hidden", "lg:block");
		expect(screen.getByTestId("bottom-nav-mobile")).toHaveClass("lg:hidden");
		expect(screen.getByTestId("bottom-nav-tab-today-desktop")).toHaveAttribute(
			"data-state",
			"active",
		);
		expect(screen.getByTestId("bottom-nav-tab-today-mobile")).toHaveAttribute("data-state", "active");
	});

	it("highlights the active tab from the current pathname", () => {
		mockPathname.mockReturnValue("/circle");

		render(<BottomNav />);

		expect(screen.getByTestId("bottom-nav-tab-circle-desktop")).toHaveAttribute(
			"data-state",
			"active",
		);
		expect(screen.getByTestId("bottom-nav-tab-today-desktop")).toHaveAttribute(
			"data-state",
			"inactive",
		);
	});

	it("adds safe-area padding to the mobile variant", () => {
		render(<BottomNav />);

		expect(screen.getByTestId("bottom-nav-mobile").className).toContain(
			"env(safe-area-inset-bottom)",
		);
	});

	it("hides itself on focused non-three-space routes", () => {
		mockPathname.mockReturnValue("/settings");

		render(<BottomNav />);

		expect(screen.queryByTestId("bottom-nav-root")).toBeNull();
	});
});
