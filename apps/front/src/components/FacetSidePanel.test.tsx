// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FacetSidePanel } from "./FacetSidePanel";

const mockNavigate = vi.fn();

vi.mock("@tanstack/react-router", () => ({
	useNavigate: () => mockNavigate,
}));

describe("FacetSidePanel", () => {
	it("navigates through /results query route for canonical redirect handling", () => {
		render(
			<FacetSidePanel
				sessionId="session-123"
				messageId="msg-1"
				isOpen
				isLoading={false}
				onClose={() => {}}
				evidence={[
					{
						id: "evidence-1",
						assessmentMessageId: "msg-1",
						facetName: "ideas",
						score: 12,
						confidence: 88,
						quote: "sample",
						highlightRange: { start: 0, end: 6 },
						createdAt: "2026-01-01T00:00:00.000Z",
					},
				]}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: /ideas/i }));

		expect(mockNavigate).toHaveBeenCalledWith({
			to: "/results",
			search: { sessionId: "session-123", scrollToFacet: "ideas" },
		});
	});
});
