// @vitest-environment jsdom

import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PwywModal } from "./PwywModal";

describe("PwywModal", () => {
	const defaultProps = {
		open: true,
		onOpenChange: vi.fn(),
		onCheckout: vi.fn(),
	};

	describe("content sections", () => {
		it("renders the founder origin story", () => {
			render(<PwywModal {...defaultProps} />);
			expect(screen.getByText(/I know, because she did it to me first/i)).toBeInTheDocument();
		});

		it("renders the founder's letter section", () => {
			render(<PwywModal {...defaultProps} />);
			expect(
				screen.getByText(/I spent years living as the person other people described/i),
			).toBeInTheDocument();
		});

		it("renders Vincent's portrait excerpt intro", () => {
			render(<PwywModal {...defaultProps} />);
			expect(screen.getByText(/this is a piece of what she wrote about me/i)).toBeInTheDocument();
		});

		it("renders the unlock CTA button", () => {
			render(<PwywModal {...defaultProps} />);
			const button = screen.getByTestId("pwyw-unlock-button");
			expect(button).toBeInTheDocument();
			expect(button).toHaveTextContent(/unlock your portrait/i);
		});

		it("renders relationship credit mention", () => {
			render(<PwywModal {...defaultProps} />);
			expect(screen.getByText(/relationship credit/i)).toBeInTheDocument();
		});
	});

	describe("accessibility", () => {
		it("has dialog role via Radix", () => {
			render(<PwywModal {...defaultProps} />);
			const dialog = screen.getByRole("dialog");
			expect(dialog).toBeInTheDocument();
		});

		it("has a dialog title for aria-labelledby", () => {
			render(<PwywModal {...defaultProps} />);
			const dialog = screen.getByRole("dialog");
			// Radix Dialog provides aria-labelledby automatically when DialogTitle is used
			expect(within(dialog).getByText(/before you see your portrait/i)).toBeInTheDocument();
		});
	});

	describe("interactions", () => {
		it("calls onCheckout when CTA button is clicked", () => {
			const onCheckout = vi.fn();
			render(<PwywModal {...defaultProps} onCheckout={onCheckout} />);
			fireEvent.click(screen.getByTestId("pwyw-unlock-button"));
			expect(onCheckout).toHaveBeenCalledTimes(1);
		});

		it("does not render when open is false", () => {
			render(<PwywModal {...defaultProps} open={false} />);
			expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
		});
	});
});
