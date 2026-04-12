// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PortraitSection } from "./PortraitSection";

const SAMPLE_CONTENT = `# The Architect of Certainty

An opening paragraph.

## The Architecture — *what you've built*

Body text here.`;

describe("PortraitSection", () => {
	describe("None State (portrait is free, auto-generated)", () => {
		it("renders empty section when status is 'none'", () => {
			const { container } = render(<PortraitSection status="none" />);
			const section = container.querySelector("[data-testid='portrait-section']");
			expect(section).toBeInTheDocument();
			// No unlock CTA — portrait is free
			expect(section?.children.length).toBe(0);
		});
	});

	describe("AC2: Generating State (Skeleton Pulse)", () => {
		it("renders skeleton with 'Nerin is writing...' when status is 'generating'", () => {
			render(<PortraitSection status="generating" />);
			expect(screen.getByTestId("portrait-generating")).toBeInTheDocument();
			expect(screen.getByText(/nerin is writing/i)).toBeInTheDocument();
		});
	});

	describe("AC3: Ready State (Portrait Content)", () => {
		it("renders PersonalPortrait with content when status is 'ready'", () => {
			render(<PortraitSection status="ready" content={SAMPLE_CONTENT} />);
			expect(screen.getByText(/The Architect of Certainty/)).toBeInTheDocument();
		});

		it("renders portrait card with data-slot 'personal-portrait'", () => {
			const { container } = render(<PortraitSection status="ready" content={SAMPLE_CONTENT} />);
			expect(container.querySelector("[data-slot='personal-portrait']")).toBeInTheDocument();
		});
	});

	describe("AC4: Failed State (Retry Button)", () => {
		it("renders retry button when status is 'failed'", () => {
			render(<PortraitSection status="failed" onRetry={vi.fn()} />);
			expect(screen.getByTestId("portrait-failed")).toBeInTheDocument();
			expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
		});

		it("calls onRetry when retry button is clicked", () => {
			const onRetry = vi.fn();
			render(<PortraitSection status="failed" onRetry={onRetry} />);
			fireEvent.click(screen.getByRole("button", { name: /retry/i }));
			expect(onRetry).toHaveBeenCalledTimes(1);
		});

		it("shows error message that is non-blocking", () => {
			render(<PortraitSection status="failed" onRetry={vi.fn()} />);
			expect(screen.getByText(/portrait generation failed/i)).toBeInTheDocument();
		});
	});

	describe("displayName prop", () => {
		it("passes displayName to PersonalPortrait when ready", () => {
			render(<PortraitSection status="ready" content={SAMPLE_CONTENT} displayName="Alice" />);
			expect(screen.getByText(/Alice\u2019s Personality Portrait/)).toBeInTheDocument();
		});
	});
});
