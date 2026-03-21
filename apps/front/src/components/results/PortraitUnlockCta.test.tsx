// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PortraitUnlockCta } from "./PortraitUnlockCta";

describe("PortraitUnlockCta", () => {
	it("renders the unlock button", () => {
		render(<PortraitUnlockCta onUnlock={vi.fn()} />);
		const button = screen.getByTestId("portrait-unlock-cta");
		expect(button).toBeInTheDocument();
		expect(button).toHaveTextContent(/unlock your portrait/i);
	});

	it("calls onUnlock when clicked", () => {
		const onUnlock = vi.fn();
		render(<PortraitUnlockCta onUnlock={onUnlock} />);
		fireEvent.click(screen.getByTestId("portrait-unlock-cta"));
		expect(onUnlock).toHaveBeenCalledTimes(1);
	});

	it("has the breathing animation class with motion-safe prefix", () => {
		render(<PortraitUnlockCta onUnlock={vi.fn()} />);
		const button = screen.getByTestId("portrait-unlock-cta");
		expect(button.className).toContain("motion-safe:animate-pulse");
	});

	it("renders descriptive text about what the portrait is", () => {
		render(<PortraitUnlockCta onUnlock={vi.fn()} />);
		expect(
			screen.getByText(/nerin.*letter/i),
		).toBeInTheDocument();
	});
});
