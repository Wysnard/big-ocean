// @vitest-environment jsdom

import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { CalendarMonthResponse } from "@workspace/contracts";
import { describe, expect, it, vi } from "vitest";
import { MoodCalendarView } from "./MoodCalendarView";

const calendarMonth: CalendarMonthResponse = {
	yearMonth: "2026-04",
	days: [
		{
			localDate: "2026-04-01",
			checkIn: {
				id: "check-in-1",
				localDate: "2026-04-01",
				mood: "good",
				note: "A grounded start",
				visibility: "private",
			},
		},
		{ localDate: "2026-04-02", checkIn: null },
		{
			localDate: "2026-04-03",
			checkIn: {
				id: "check-in-2",
				localDate: "2026-04-03",
				mood: "great",
				note: "Momentum came back",
				visibility: "private",
			},
		},
		...Array.from({ length: 27 }, (_, index) => ({
			localDate: `2026-04-${String(index + 4).padStart(2, "0")}`,
			checkIn: null,
		})),
	],
};

describe("MoodCalendarView", () => {
	it("renders the month grid with filled and empty day states", () => {
		render(
			<MoodCalendarView
				calendarMonth={calendarMonth}
				isLoading={false}
				isError={false}
				canGoForward={false}
				onPreviousMonth={vi.fn()}
				onNextMonth={vi.fn()}
			/>,
		);

		expect(screen.getByTestId("mood-calendar-view")).toHaveAttribute("data-state", "ready");
		expect(screen.getByRole("table", { name: /mood calendar/i })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /april 1, 2026: good/i })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /april 2, 2026: no check-in/i })).toBeInTheDocument();
	});

	it("shows the selected day in JournalEntry format when a check-in day is chosen", async () => {
		const user = userEvent.setup();

		render(
			<MoodCalendarView
				calendarMonth={calendarMonth}
				isLoading={false}
				isError={false}
				canGoForward
				onPreviousMonth={vi.fn()}
				onNextMonth={vi.fn()}
			/>,
		);

		await act(async () => {
			await user.click(screen.getByRole("button", { name: /april 3, 2026: great/i }));
		});

		expect(screen.getByTestId("journal-entry")).toBeInTheDocument();
		expect(screen.getByText("Momentum came back")).toBeInTheDocument();
	});

	it("wires previous and next month controls", async () => {
		const user = userEvent.setup();
		const onPreviousMonth = vi.fn();
		const onNextMonth = vi.fn();

		render(
			<MoodCalendarView
				calendarMonth={calendarMonth}
				isLoading={false}
				isError={false}
				canGoForward={false}
				onPreviousMonth={onPreviousMonth}
				onNextMonth={onNextMonth}
			/>,
		);

		await user.click(screen.getByRole("button", { name: /previous month/i }));
		expect(onPreviousMonth).toHaveBeenCalledTimes(1);
		expect(screen.getByRole("button", { name: /next month/i })).toBeDisabled();
		expect(onNextMonth).not.toHaveBeenCalled();
	});
});
