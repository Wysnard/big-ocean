// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { QuietAnticipationLine } from "./QuietAnticipationLine";

describe("QuietAnticipationLine", () => {
	it("renders locked copy on Wednesday", () => {
		render(<QuietAnticipationLine referenceDate={new Date(2026, 3, 15)} />);

		expect(
			screen.getByText("Nerin will write you a letter about your week on Sunday.", { exact: true }),
		).toBeTruthy();
		expect(screen.getByTestId("quiet-anticipation-line")).toBeTruthy();
	});

	it("hides on Sunday", () => {
		const { container } = render(<QuietAnticipationLine referenceDate={new Date(2026, 3, 12)} />);

		expect(container.firstChild).toBeNull();
	});
});
