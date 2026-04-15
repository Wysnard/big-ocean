// @vitest-environment jsdom

import {
	createMemoryHistory,
	createRootRoute,
	createRoute,
	createRouter,
	Outlet,
	RouterProvider,
} from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
import type { WeekGridResponse } from "@workspace/contracts";
import { describe, expect, it } from "vitest";
import { getWeekIdForLocalDate } from "@/hooks/use-today-check-in";
import { WeeklyLetterCard } from "./WeeklyLetterCard";

function buildWeekGrid(weeklyLetter: WeekGridResponse["weeklyLetter"]): WeekGridResponse {
	return {
		weekId: "2026-W15",
		weeklyLetter,
		days: [
			{ localDate: "2026-04-06", checkIn: null },
			{ localDate: "2026-04-07", checkIn: null },
			{ localDate: "2026-04-08", checkIn: null },
			{ localDate: "2026-04-09", checkIn: null },
			{ localDate: "2026-04-10", checkIn: null },
			{ localDate: "2026-04-11", checkIn: null },
			{ localDate: "2026-04-12", checkIn: null },
		],
	};
}

async function renderWithRouter(localDate: string, weekGrid: WeekGridResponse) {
	const rootRoute = createRootRoute({
		component: () => <Outlet />,
	});

	const homeRoute = createRoute({
		getParentRoute: () => rootRoute,
		path: "/",
		component: () => <WeeklyLetterCard localDate={localDate} weekGrid={weekGrid} />,
	});

	const letterRoute = createRoute({
		getParentRoute: () => rootRoute,
		path: "today/week/$weekId",
		component: () => <div>Letter</div>,
	});

	const routeTree = rootRoute.addChildren([homeRoute, letterRoute]);
	const router = createRouter({
		routeTree,
		history: createMemoryHistory({ initialEntries: ["/"] }),
	});

	await router.load();
	return render(<RouterProvider router={router} />);
}

describe("WeeklyLetterCard", () => {
	it("renders on Sunday when weekly letter is ready", async () => {
		await renderWithRouter(
			"2026-04-12",
			buildWeekGrid({ status: "ready", generatedAt: "2026-04-12T18:00:00.000Z" }),
		);

		const link = screen.getByTestId("weekly-letter-card");
		expect(link).toBeTruthy();
		expect(screen.getByText("Your week with Nerin is ready", { exact: true })).toBeTruthy();
		expect(link.getAttribute("href")).toContain(`/today/week/${getWeekIdForLocalDate("2026-04-12")}`);
	});

	it("hides when not Sunday", async () => {
		const { container } = await renderWithRouter(
			"2026-04-15",
			buildWeekGrid({ status: "ready", generatedAt: "2026-04-12T18:00:00.000Z" }),
		);

		expect(container.querySelector("[data-testid='weekly-letter-card']")).toBeNull();
	});

	it("hides on Sunday when letter is not ready", async () => {
		const { container } = await renderWithRouter("2026-04-12", buildWeekGrid({ status: "none" }));

		expect(container.querySelector("[data-testid='weekly-letter-card']")).toBeNull();
	});
});
