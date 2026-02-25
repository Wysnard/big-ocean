// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HighlightedText } from "./HighlightedText";

describe("HighlightedText", () => {
	it("renders plain text when no highlights", () => {
		render(<HighlightedText text="Hello world" highlights={[]} />);
		expect(screen.getByTestId("highlighted-text").textContent).toBe("Hello world");
	});

	it("renders single highlight with mark element", () => {
		const { container } = render(
			<HighlightedText
				text="Hello world"
				highlights={[{ start: 0, end: 5, color: "green", confidence: 80 }]}
			/>,
		);
		const marks = container.querySelectorAll("mark");
		expect(marks.length).toBe(1);
		expect(marks[0].textContent).toBe("Hello");
	});

	it("renders multiple non-overlapping highlights", () => {
		const { container } = render(
			<HighlightedText
				text="Hello beautiful world"
				highlights={[
					{ start: 0, end: 5, color: "green", confidence: 80 },
					{ start: 16, end: 21, color: "blue", confidence: 60 },
				]}
			/>,
		);
		const marks = container.querySelectorAll("mark");
		expect(marks.length).toBe(2);
		expect(marks[0].textContent).toBe("Hello");
		expect(marks[1].textContent).toBe("world");
	});

	it("handles overlapping highlights with layered marks", () => {
		const { container } = render(
			<HighlightedText
				text="Hello world"
				highlights={[
					{ start: 0, end: 8, color: "green", confidence: 80 },
					{ start: 3, end: 11, color: "blue", confidence: 60 },
				]}
			/>,
		);
		// Overlapping region (3-8) should have 2 marks
		const marks = container.querySelectorAll("mark");
		expect(marks.length).toBeGreaterThanOrEqual(3);
	});

	it("clamps out-of-bounds ranges to text length", () => {
		const { container } = render(
			<HighlightedText
				text="Hi"
				highlights={[{ start: -5, end: 100, color: "red", confidence: 50 }]}
			/>,
		);
		const marks = container.querySelectorAll("mark");
		expect(marks.length).toBe(1);
		expect(marks[0].textContent).toBe("Hi");
	});

	it("maps confidence to opacity correctly", () => {
		const { container } = render(
			<HighlightedText
				text="Test"
				highlights={[{ start: 0, end: 4, color: "green", confidence: 100 }]}
			/>,
		);
		const mark = container.querySelector("mark");
		// opacity = 0.15 + (100/100) * 0.45 = 0.6
		expect(mark?.style.opacity).toBe("0.6");
	});
});
