// @vitest-environment jsdom

import { render, screen, within } from "@testing-library/react";
import type { WeekGridResponse } from "@workspace/contracts";
import { describe, expect, it } from "vitest";
import { MoodDotsWeek } from "./MoodDotsWeek";

const sevenDays: WeekGridResponse = {
	weekId: "2026-W16",
	days: [
		{ localDate: "2026-04-13", checkIn: null },
		{ localDate: "2026-04-14", checkIn: null },
		{
			localDate: "2026-04-15",
			checkIn: {
				id: "c1",
				localDate: "2026-04-15",
				mood: "good",
				note: null,
				visibility: "private",
			},
		},
		{ localDate: "2026-04-16", checkIn: null },
		{ localDate: "2026-04-17", checkIn: null },
		{ localDate: "2026-04-18", checkIn: null },
		{ localDate: "2026-04-19", checkIn: null },
	],
};

describe("MoodDotsWeek", () => {
	it("renders Mon–Sun short labels in order", () => {
		render(
			<MoodDotsWeek localDate="2026-04-15" weekGrid={sevenDays} isLoading={false} isError={false} />,
		);

		const root = screen.getByTestId("mood-dots-week");
		const items = within(root).getAllByRole("listitem");
		expect(items).toHaveLength(7);
		const expected = ["M", "T", "W", "T", "F", "S", "S"] as const;
		items.forEach((item, i) => {
			const letter = expected[i];
			if (!letter) {
				throw new Error(`missing weekday label at index ${i}`);
			}
			expect(within(item).getByText(letter)).toBeTruthy();
		});
	});

	it("exposes weekday status for assistive tech", () => {
		render(
			<MoodDotsWeek localDate="2026-04-15" weekGrid={sevenDays} isLoading={false} isError={false} />,
		);

		expect(screen.getByText("Monday: no check-in")).toBeTruthy();
		expect(screen.getByText("Wednesday: checked in")).toBeTruthy();
	});

	it("shows loading skeleton when isLoading", () => {
		render(<MoodDotsWeek localDate="2026-04-15" weekGrid={sevenDays} isLoading isError={false} />);

		expect(screen.getByTestId("mood-dots-week")).toHaveAttribute("data-state", "loading");
		expect(screen.getByTestId("mood-dots-week")).toHaveAttribute("aria-busy", "true");
	});

	it("shows fallback when week grid is missing or wrong length", () => {
		render(
			<MoodDotsWeek localDate="2026-04-15" weekGrid={undefined} isLoading={false} isError={false} />,
		);

		expect(screen.getByTestId("mood-dots-week")).toHaveAttribute("data-state", "fallback");
		expect(screen.getByText("Week mood view unavailable")).toBeTruthy();
	});
});
