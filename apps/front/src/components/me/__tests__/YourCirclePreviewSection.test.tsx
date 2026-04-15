// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockUseRelationshipAnalysesList } = vi.hoisted(() => ({
	mockUseRelationshipAnalysesList: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
	Link: ({ children, to, ...props }: Record<string, unknown> & { children?: ReactNode }) => (
		<a href={to as string} {...props}>
			{children}
		</a>
	),
}));

vi.mock("@/hooks/useRelationshipAnalysesList", () => ({
	useRelationshipAnalysesList: (...args: unknown[]) => mockUseRelationshipAnalysesList(...args),
}));

import { InviteCeremonyProvider } from "@/components/invite/InviteCeremonyProvider";
import { YourCirclePreviewSection } from "../YourCirclePreviewSection";

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

describe("YourCirclePreviewSection", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("does not show a relationship count while loading or when the list is empty", () => {
		mockUseRelationshipAnalysesList.mockReturnValue({
			data: undefined,
			isLoading: true,
			isError: false,
			refetch: vi.fn(),
		});

		renderWithInviteCeremony(<YourCirclePreviewSection />);

		expect(screen.queryByText(/connections/)).not.toBeInTheDocument();
	});

	it("renders the exact empty-state copy when the user has no circle yet", () => {
		mockUseRelationshipAnalysesList.mockReturnValue({
			data: [],
			isLoading: false,
			isError: false,
			refetch: vi.fn(),
		});

		renderWithInviteCeremony(<YourCirclePreviewSection />);

		expect(screen.getByTestId("me-circle-preview")).toBeInTheDocument();
		expect(
			screen.getByText("Big Ocean is made for the few people you care about"),
		).toBeInTheDocument();
		expect(screen.queryByText(/connections/)).not.toBeInTheDocument();
		expect(screen.getByTestId("me-circle-view-all-link")).toHaveAttribute("href", "/circle");
		expect(screen.getByTestId("me-circle-invite")).toBeInTheDocument();
		expect(screen.getByTestId("invite-ceremony-card")).toBeInTheDocument();
	});

	it("renders partner archetype names, relationship count, and the view-all link", () => {
		mockUseRelationshipAnalysesList.mockReturnValue({
			data: [
				{
					analysisId: "analysis-1",
					userAName: "Alice",
					userBName: "Bob",
					partnerName: "Bob",
					partnerArchetypeName: "The Beacon",
					partnerOceanCode: "OCEAN",
					isLatestVersion: true,
					hasContent: true,
					createdAt: "2026-03-20T00:00:00.000Z",
					contentCompletedAt: "2026-03-20T12:00:00.000Z",
				},
				{
					analysisId: "analysis-2",
					userAName: "Alice",
					userBName: "Charlie",
					partnerName: "Charlie",
					partnerArchetypeName: "The Lantern",
					partnerOceanCode: "OCEAN",
					isLatestVersion: true,
					hasContent: true,
					createdAt: "2026-03-19T00:00:00.000Z",
					contentCompletedAt: "2026-03-19T08:00:00.000Z",
				},
				{
					analysisId: "analysis-3",
					userAName: "Alice",
					userBName: "Dana",
					partnerName: "Dana",
					partnerArchetypeName: "The Compass",
					partnerOceanCode: "OCBAV",
					isLatestVersion: false,
					hasContent: false,
					createdAt: "2026-03-18T00:00:00.000Z",
					contentCompletedAt: null,
				},
				{
					analysisId: "analysis-4",
					userAName: "Alice",
					userBName: "Evan",
					partnerName: "Evan",
					partnerArchetypeName: "The Hearth",
					partnerOceanCode: "OCEAN",
					isLatestVersion: true,
					hasContent: true,
					createdAt: "2026-03-17T00:00:00.000Z",
					contentCompletedAt: "2026-03-17T10:00:00.000Z",
				},
			],
			isLoading: false,
			isError: false,
			refetch: vi.fn(),
		});

		renderWithInviteCeremony(<YourCirclePreviewSection />);

		expect(screen.getByText("4 connections")).toBeInTheDocument();
		expect(screen.getByText("The Beacon")).toBeInTheDocument();
		expect(screen.getByText("The Lantern")).toBeInTheDocument();
		expect(screen.getByText("The Compass")).toBeInTheDocument();
		expect(screen.getByText("+1")).toBeInTheDocument();
		expect(screen.getByTestId("me-circle-view-all-link")).toHaveAttribute("href", "/circle");
	});
});
