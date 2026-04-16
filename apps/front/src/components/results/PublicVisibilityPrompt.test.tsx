// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PublicVisibilityPrompt } from "./PublicVisibilityPrompt";

describe("PublicVisibilityPrompt", () => {
	it("renders prompt text when open", () => {
		render(
			<PublicVisibilityPrompt
				open={true}
				onAccept={() => {}}
				onDecline={() => {}}
				isLoading={false}
			/>,
		);
		expect(screen.getByText(/make your profile public so friends can see/i)).toBeInTheDocument();
	});

	it("renders Accept and Decline buttons", () => {
		render(
			<PublicVisibilityPrompt
				open={true}
				onAccept={() => {}}
				onDecline={() => {}}
				isLoading={false}
			/>,
		);
		expect(screen.getByTestId("visibility-prompt-accept")).toBeInTheDocument();
		expect(screen.getByTestId("visibility-prompt-decline")).toBeInTheDocument();
	});

	it("calls onAccept when Accept is clicked", () => {
		const onAccept = vi.fn();
		render(
			<PublicVisibilityPrompt
				open={true}
				onAccept={onAccept}
				onDecline={() => {}}
				isLoading={false}
			/>,
		);
		fireEvent.click(screen.getByTestId("visibility-prompt-accept"));
		expect(onAccept).toHaveBeenCalledOnce();
	});

	it("calls onDecline when Decline is clicked", () => {
		const onDecline = vi.fn();
		render(
			<PublicVisibilityPrompt
				open={true}
				onAccept={() => {}}
				onDecline={onDecline}
				isLoading={false}
			/>,
		);
		fireEvent.click(screen.getByTestId("visibility-prompt-decline"));
		expect(onDecline).toHaveBeenCalledOnce();
	});

	it("renders nothing when closed", () => {
		const { container } = render(
			<PublicVisibilityPrompt
				open={false}
				onAccept={() => {}}
				onDecline={() => {}}
				isLoading={false}
			/>,
		);
		expect(screen.queryByText(/make your profile public/i)).not.toBeInTheDocument();
	});

	it("disables accept button when isLoading", () => {
		render(
			<PublicVisibilityPrompt open={true} onAccept={() => {}} onDecline={() => {}} isLoading={true} />,
		);
		expect(screen.getByTestId("visibility-prompt-accept")).toBeDisabled();
	});

	it("has proper aria-label on accept button", () => {
		render(
			<PublicVisibilityPrompt
				open={true}
				onAccept={() => {}}
				onDecline={() => {}}
				isLoading={false}
			/>,
		);
		expect(screen.getByTestId("visibility-prompt-accept")).toHaveTextContent(/make public/i);
	});

	it("exposes aria-modal on the dialog surface when open", () => {
		render(
			<PublicVisibilityPrompt
				open={true}
				onAccept={() => {}}
				onDecline={() => {}}
				isLoading={false}
			/>,
		);
		expect(screen.getByRole("dialog")).toHaveAttribute("aria-modal", "true");
	});

	it("uses minimum touch target height on footer actions", () => {
		render(
			<PublicVisibilityPrompt
				open={true}
				onAccept={() => {}}
				onDecline={() => {}}
				isLoading={false}
			/>,
		);
		expect(screen.getByTestId("visibility-prompt-accept").className).toMatch(/min-h-11/);
		expect(screen.getByTestId("visibility-prompt-decline").className).toMatch(/min-h-11/);
	});
});
