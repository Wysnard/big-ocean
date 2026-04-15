// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-router", () => ({
	Link: ({
		children,
		to,
		params,
		...props
	}: {
		children?: ReactNode;
		to: string;
		params?: { analysisId?: string };
	}) => {
		const href =
			typeof to === "string" && params?.analysisId
				? to.replace("$analysisId", params.analysisId)
				: String(to);
		return (
			<a href={href} {...props}>
				{children}
			</a>
		);
	},
}));

vi.mock("@workspace/ui/components/geometric-signature", () => ({
	GeometricSignature: ({ oceanCode5 }: { oceanCode5: string }) => (
		<div data-testid="circle-test-geometric-signature" data-ocean-code={oceanCode5} />
	),
}));

import type { RelationshipAnalysisListItem } from "@workspace/contracts/http/groups/relationship";
import { CirclePersonCard } from "../CirclePersonCard";
import { UNKNOWN_PARTNER_OCEAN_CODE } from "../circle-relationship-copy";

const baseItem: RelationshipAnalysisListItem = {
	analysisId: "analysis-uuid-1",
	userAName: "Self",
	userBName: "Pat",
	partnerName: "Pat",
	partnerArchetypeName: "The Beacon",
	partnerOceanCode: "OCEAN",
	isLatestVersion: true,
	hasContent: true,
	createdAt: "2025-06-10T08:00:00.000Z",
	contentCompletedAt: "2025-06-12T10:00:00.000Z",
};

describe("CirclePersonCard", () => {
	it("renders partner, archetype, duration, last shared, and relationship link", () => {
		render(<CirclePersonCard item={baseItem} />);

		expect(screen.getByText("Pat")).toBeInTheDocument();
		expect(screen.getByText("The Beacon")).toBeInTheDocument();
		expect(screen.getByText("OCEAN")).toBeInTheDocument();
		expect(screen.getByTestId("circle-test-geometric-signature")).toHaveAttribute(
			"data-ocean-code",
			"OCEAN",
		);
		expect(screen.getByText(/Understanding each other since/)).toBeInTheDocument();
		expect(screen.getByText(/Last shared:/)).toBeInTheDocument();

		const link = screen.getByTestId("circle-person-dynamic-link");
		expect(link).toHaveAttribute("href", "/relationship/analysis-uuid-1");
		expect(link).toHaveTextContent("View your dynamic");
	});

	it("shows generating line when letter is not ready", () => {
		const item: RelationshipAnalysisListItem = {
			...baseItem,
			hasContent: false,
			contentCompletedAt: null,
		};
		render(<CirclePersonCard item={item} />);

		expect(screen.getByText("Letter still opening…")).toBeInTheDocument();
		expect(screen.queryByText(/Last shared:/)).not.toBeInTheDocument();
	});

	it("does not render geometric signature when partner OCEAN is the unknown placeholder", () => {
		render(<CirclePersonCard item={{ ...baseItem, partnerOceanCode: UNKNOWN_PARTNER_OCEAN_CODE }} />);

		expect(screen.queryByTestId("circle-test-geometric-signature")).not.toBeInTheDocument();
		expect(screen.getByText(UNKNOWN_PARTNER_OCEAN_CODE)).toBeInTheDocument();
	});

	it("does not render connection counts", () => {
		render(<CirclePersonCard item={baseItem} />);
		expect(screen.queryByText(/connections/i)).not.toBeInTheDocument();
		expect(screen.queryByText(/followers/i)).not.toBeInTheDocument();
	});
});
