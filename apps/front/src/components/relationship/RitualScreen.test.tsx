/**
 * RitualScreen Component Tests (Story 35-1)
 *
 * Tests for the ritual suggestion screen displayed before
 * a relationship analysis is shown to both users.
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { RitualScreen } from "./RitualScreen";

describe("RitualScreen", () => {
	const defaultProps = {
		userAName: "Alice",
		userBName: "Bob",
		onStart: vi.fn(),
	};

	it("renders Nerin's framing message", () => {
		render(<RitualScreen {...defaultProps} />);

		expect(screen.getByText(/I wrote this about the two of you/)).toBeInTheDocument();
		expect(screen.getByText(/better to read this together/i)).toBeInTheDocument();
	});

	it("renders both user names", () => {
		render(<RitualScreen {...defaultProps} />);

		expect(screen.getByText(/Alice/)).toBeInTheDocument();
		expect(screen.getByText(/Bob/)).toBeInTheDocument();
	});

	it("calls onStart when Start button is clicked", async () => {
		const onStart = vi.fn();
		const user = userEvent.setup();

		render(<RitualScreen {...defaultProps} onStart={onStart} />);

		const startButton = screen.getByTestId("ritual-start-button");
		await user.click(startButton);

		expect(onStart).toHaveBeenCalledOnce();
	});

	it("has role=dialog with aria-labelledby", () => {
		render(<RitualScreen {...defaultProps} />);

		const dialog = screen.getByRole("dialog");
		expect(dialog).toBeInTheDocument();
		expect(dialog).toHaveAttribute("aria-labelledby");

		// The aria-labelledby should reference an element that exists
		const labelId = dialog.getAttribute("aria-labelledby");
		expect(labelId).toBeTruthy();
		expect(document.getElementById(labelId!)).toBeInTheDocument();
	});

	it("has correct data-testid attributes", () => {
		render(<RitualScreen {...defaultProps} />);

		expect(screen.getByTestId("ritual-screen")).toBeInTheDocument();
		expect(screen.getByTestId("ritual-start-button")).toBeInTheDocument();
	});

	it("renders Start button with accessible label", () => {
		render(<RitualScreen {...defaultProps} />);

		const startButton = screen.getByTestId("ritual-start-button");
		expect(startButton).toHaveTextContent("Start");
	});

	it("renders the ritual suggestion text", () => {
		render(<RitualScreen {...defaultProps} />);

		expect(screen.getByText(/Talk about what you're expecting/i)).toBeInTheDocument();
	});
});
