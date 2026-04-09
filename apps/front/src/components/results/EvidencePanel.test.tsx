// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { SavedFacetEvidence } from "@workspace/contracts";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { EvidencePanel } from "./EvidencePanel";

const mockEvidence: SavedFacetEvidence[] = [
	{
		id: "ev-1",
		facetName: "imagination",
		assessmentSessionId: "session-1",
		assessmentMessageId: "msg-1",
		quote: "I love building imaginary worlds",
		confidence: 80,
		deviation: 3,
		domain: "leisure",
	},
	{
		id: "ev-2",
		facetName: "imagination",
		assessmentSessionId: "session-1",
		assessmentMessageId: "msg-2",
		quote: "Daydreaming is part of my creative process",
		confidence: 60,
		deviation: 2,
		domain: "work",
	},
];

describe("EvidencePanel", () => {
	it("renders with role='dialog'", () => {
		render(<EvidencePanel facetName="imagination" evidence={mockEvidence} onClose={vi.fn()} />);
		expect(screen.getByRole("dialog")).toBeInTheDocument();
	});

	it("has aria-labelledby pointing to the facet name heading", () => {
		render(<EvidencePanel facetName="imagination" evidence={mockEvidence} onClose={vi.fn()} />);
		const dialog = screen.getByRole("dialog");
		const labelledById = dialog.getAttribute("aria-labelledby");
		expect(labelledById).toBeTruthy();
		const heading = document.getElementById(labelledById!);
		expect(heading).toBeInTheDocument();
		expect(heading?.textContent).toContain("Imagination");
	});

	it("renders evidence quotes", () => {
		render(<EvidencePanel facetName="imagination" evidence={mockEvidence} onClose={vi.fn()} />);
		expect(screen.getByText(/I love building imaginary worlds/)).toBeInTheDocument();
		expect(screen.getByText(/Daydreaming is part of my creative process/)).toBeInTheDocument();
	});

	it("calls onClose when Escape key is pressed", () => {
		const onClose = vi.fn();
		render(<EvidencePanel facetName="imagination" evidence={mockEvidence} onClose={onClose} />);
		const dialog = screen.getByRole("dialog");
		fireEvent.keyDown(dialog, { key: "Escape" });
		expect(onClose).toHaveBeenCalledOnce();
	});

	it("calls onClose when close button is clicked", () => {
		const onClose = vi.fn();
		render(<EvidencePanel facetName="imagination" evidence={mockEvidence} onClose={onClose} />);
		const closeButton = screen.getByLabelText("Close evidence panel");
		fireEvent.click(closeButton);
		expect(onClose).toHaveBeenCalledOnce();
	});

	it("uses a 44px minimum touch target for the close button", () => {
		render(<EvidencePanel facetName="imagination" evidence={mockEvidence} onClose={vi.fn()} />);
		const closeButton = screen.getByLabelText("Close evidence panel");
		expect(closeButton.className).toMatch(/min-h-11/);
		expect(closeButton.className).toMatch(/min-w-11/);
	});

	it("restores focus to the originating facet trigger when closed", async () => {
		const triggerRef = createRef<HTMLButtonElement>();
		const onClose = vi.fn(() => {
			triggerRef.current?.focus();
		});

		render(
			<div>
				<button ref={triggerRef} type="button">
					Facet trigger
				</button>
				<EvidencePanel
					facetName="imagination"
					evidence={mockEvidence}
					onClose={onClose}
					restoreFocusRef={triggerRef}
				/>
			</div>,
		);

		fireEvent.click(screen.getByLabelText("Close evidence panel"));

		await waitFor(() => {
			expect(screen.getByRole("button", { name: "Facet trigger" })).toHaveFocus();
		});
	});

	it("keeps Tab navigation inside the panel", async () => {
		render(<EvidencePanel facetName="imagination" evidence={mockEvidence} onClose={vi.fn()} />);

		const panel = screen.getByRole("dialog");
		const closeButton = screen.getByLabelText("Close evidence panel");

		await waitFor(() => {
			expect(panel).toHaveFocus();
		});

		fireEvent.keyDown(panel, { key: "Tab" });
		expect(closeButton).toHaveFocus();

		fireEvent.keyDown(closeButton, { key: "Tab" });
		expect(closeButton).toHaveFocus();
	});

	it("renders empty state when no evidence", () => {
		render(<EvidencePanel facetName="imagination" evidence={[]} onClose={vi.fn()} />);
		expect(screen.getByText(/no evidence recorded/i)).toBeInTheDocument();
	});
});
