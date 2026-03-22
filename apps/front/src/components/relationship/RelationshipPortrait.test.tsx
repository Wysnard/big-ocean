/**
 * RelationshipPortrait Component Tests (Story 35-3)
 *
 * Tests for the relationship analysis display component that renders
 * analysis content using the Portrait Spine Renderer pattern.
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RelationshipPortrait } from "./RelationshipPortrait";

const SAMPLE_CONTENT = `# Your Relationship Dynamic

## 🌊 Shared Currents — *Where you flow together*

You both share a deep appreciation for novelty and exploration. When Alice describes her creative process, it mirrors Bob's approach to problem-solving.

## 🔥 Creative Tension — *Where friction becomes fuel*

Alice's natural introversion meets Bob's social energy in ways that can spark or strain.`;

describe("RelationshipPortrait", () => {
	const defaultProps = {
		content: SAMPLE_CONTENT,
		userAName: "Alice",
		userBName: "Bob",
		isLatestVersion: true,
	};

	it("renders both user names in the header", () => {
		render(<RelationshipPortrait {...defaultProps} />);

		expect(screen.getByText("Alice & Bob")).toBeInTheDocument();
	});

	it("renders markdown content sections", () => {
		render(<RelationshipPortrait {...defaultProps} />);

		expect(screen.getByText("Your Relationship Dynamic")).toBeInTheDocument();
		expect(screen.getByText(/Shared Currents/)).toBeInTheDocument();
		expect(screen.getByText(/Creative Tension/)).toBeInTheDocument();
	});

	it("renders section body content", () => {
		render(<RelationshipPortrait {...defaultProps} />);

		expect(screen.getByText(/deep appreciation for novelty/)).toBeInTheDocument();
	});

	it("does NOT show previous version badge when isLatestVersion is true", () => {
		render(<RelationshipPortrait {...defaultProps} isLatestVersion={true} />);

		expect(screen.queryByText("Previous version")).not.toBeInTheDocument();
	});

	it("shows previous version badge when isLatestVersion is false", () => {
		render(<RelationshipPortrait {...defaultProps} isLatestVersion={false} />);

		expect(screen.getByText("Previous version")).toBeInTheDocument();
	});

	it("has correct data-testid attribute", () => {
		render(<RelationshipPortrait {...defaultProps} />);

		expect(screen.getByTestId("relationship-portrait")).toBeInTheDocument();
	});

	it("renders raw content when no markdown headers present", () => {
		render(
			<RelationshipPortrait {...defaultProps} content="Just plain text content without headers." />,
		);

		expect(screen.getByText("Just plain text content without headers.")).toBeInTheDocument();
	});
});
