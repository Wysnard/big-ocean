// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import type { CheckInResponse } from "@workspace/contracts";
import { describe, expect, it } from "vitest";
import { JournalEntry } from "./JournalEntry";

const sample: CheckInResponse = {
	id: "x1",
	localDate: "2026-04-15",
	mood: "okay",
	note: "Quiet morning.",
	visibility: "private",
};

describe("JournalEntry", () => {
	it("renders article semantics and journal layout", () => {
		render(<JournalEntry checkIn={sample} />);

		expect(screen.getByTestId("journal-entry")).toBeTruthy();
		expect(screen.getByRole("article")).toBeTruthy();
		expect(screen.getByText("Today's check-in")).toBeTruthy();
		expect(screen.getByText("Quiet morning.")).toBeTruthy();
		expect(screen.getByText("Private entry")).toBeTruthy();
	});
});
