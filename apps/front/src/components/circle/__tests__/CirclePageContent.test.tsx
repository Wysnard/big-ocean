// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockUseRelationshipAnalysesList } = vi.hoisted(() => ({
	mockUseRelationshipAnalysesList: vi.fn(),
}));

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

vi.mock("@/hooks/useRelationshipAnalysesList", () => ({
	useRelationshipAnalysesList: (...args: unknown[]) => mockUseRelationshipAnalysesList(...args),
}));

import { InviteCeremonyProvider } from "@/components/invite/InviteCeremonyProvider";
import { CirclePageContent } from "../CirclePageContent";

function renderWithInviteCeremony(ui: ReactElement) {
	const qc = new QueryClient({
		defaultOptions: {
			queries: { retry: false },
			mutations: { retry: false },
		},
	});
	return render(
		<QueryClientProvider client={qc}>
			<InviteCeremonyProvider>{ui}</InviteCeremonyProvider>
		</QueryClientProvider>,
	);
}

describe("CirclePageContent", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders the exact empty-state copy when no relationships exist", () => {
		mockUseRelationshipAnalysesList.mockReturnValue({
			data: [],
			isLoading: false,
			isError: false,
			refetch: vi.fn(),
		});

		renderWithInviteCeremony(<CirclePageContent />);

		expect(
			screen.getByText(
				"Big Ocean is made for the few people you care about. This is where they'll live.",
			),
		).toBeInTheDocument();
		expect(screen.queryByText(/connections/i)).not.toBeInTheDocument();
		expect(screen.queryByText(/followers/i)).not.toBeInTheDocument();
	});

	it("renders cards in oldest-first order without aggregate count copy", () => {
		mockUseRelationshipAnalysesList.mockReturnValue({
			data: [
				{
					analysisId: "analysis-newer",
					userAName: "Self",
					userBName: "River",
					partnerName: "River",
					partnerArchetypeName: "The Beacon",
					partnerOceanCode: "OCEAN",
					isLatestVersion: true,
					hasContent: true,
					createdAt: "2026-03-20T00:00:00.000Z",
					contentCompletedAt: "2026-03-22T00:00:00.000Z",
				},
				{
					analysisId: "analysis-older",
					userAName: "Self",
					userBName: "Sol",
					partnerName: "Sol",
					partnerArchetypeName: "The Lantern",
					partnerOceanCode: "OCBAV",
					isLatestVersion: true,
					hasContent: false,
					createdAt: "2026-03-10T00:00:00.000Z",
					contentCompletedAt: null,
				},
			],
			isLoading: false,
			isError: false,
			refetch: vi.fn(),
		});

		renderWithInviteCeremony(<CirclePageContent />);

		const headings = screen.getAllByRole("heading", { level: 2 });
		expect(headings[0]).toHaveTextContent("Sol");
		expect(headings[1]).toHaveTextContent("River");
		expect(screen.queryByText(/connections/i)).not.toBeInTheDocument();
		expect(screen.queryByText(/followers/i)).not.toBeInTheDocument();
		expect(screen.getAllByTestId("circle-person-dynamic-link")[0]).toHaveAttribute(
			"href",
			"/relationship/analysis-older",
		);
	});

	it("shows the same error copy as the Me Circle preview when the list fails", () => {
		mockUseRelationshipAnalysesList.mockReturnValue({
			data: undefined,
			isLoading: false,
			isError: true,
			refetch: vi.fn(),
		});

		renderWithInviteCeremony(<CirclePageContent />);

		expect(screen.getByText("Your Circle is taking a moment to load.")).toBeInTheDocument();
	});
});
