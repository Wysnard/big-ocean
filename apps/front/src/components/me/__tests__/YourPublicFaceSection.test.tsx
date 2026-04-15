// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { GetResultsResponse } from "@workspace/contracts";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockMutateAsync, mockToastSuccess } = vi.hoisted(() => ({
	mockMutateAsync: vi.fn().mockResolvedValue({ isPublic: true }),
	mockToastSuccess: vi.fn(),
}));

vi.mock("@/hooks/use-profile", () => ({
	useToggleVisibility: () => ({
		mutateAsync: mockMutateAsync,
		isPending: false,
	}),
}));

vi.mock("@/components/sharing/archetype-share-card", () => ({
	ArchetypeShareCard: ({ publicProfileId }: { publicProfileId: string }) => (
		<div data-testid="archetype-share-card">{publicProfileId}</div>
	),
}));

vi.mock("sonner", () => ({
	toast: {
		success: mockToastSuccess,
	},
}));

import { YourPublicFaceSection } from "../YourPublicFaceSection";

const baseResults: GetResultsResponse = {
	oceanCode5: "OCEAR" as GetResultsResponse["oceanCode5"],
	oceanCode4: "OCEA" as GetResultsResponse["oceanCode4"],
	archetypeName: "The Deep Current",
	archetypeDescription: "A calm, observant presence with depth.",
	archetypeColor: "#3B82F6",
	isCurated: true,
	traits: [
		{ name: "openness", score: 90, level: "O", confidence: 85 },
		{ name: "conscientiousness", score: 65, level: "S", confidence: 70 },
		{ name: "extraversion", score: 40, level: "I", confidence: 75 },
		{ name: "agreeableness", score: 80, level: "A", confidence: 80 },
		{ name: "neuroticism", score: 30, level: "R", confidence: 65 },
	],
	facets: [],
	overallConfidence: 75,
	messageCount: 24,
	publicProfileId: "profile-123",
	shareableUrl: "https://bigocean.dev/public-profile/profile-123",
	isPublic: true,
	isLatestVersion: true,
};

describe("YourPublicFaceSection", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		Object.defineProperty(navigator, "share", {
			value: undefined,
			writable: true,
			configurable: true,
		});
		Object.defineProperty(navigator, "clipboard", {
			value: { writeText: vi.fn().mockResolvedValue(undefined) },
			writable: true,
			configurable: true,
		});
	});

	it("renders the public-face preview with archetype name", () => {
		render(<YourPublicFaceSection results={baseResults} />);

		expect(screen.getByText("The Deep Current")).toBeInTheDocument();
		expect(screen.getByTestId("archetype-share-card")).toHaveTextContent("profile-123");
	});

	it("copies the public profile link and shows a Sonner confirmation", async () => {
		render(<YourPublicFaceSection results={baseResults} />);

		fireEvent.click(screen.getByTestId("share-copy-btn"));

		await waitFor(() => {
			expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
				"https://bigocean.dev/public-profile/profile-123",
			);
		});
		expect(mockToastSuccess).toHaveBeenCalled();
	});

	it("copies the link while the profile is private without opening the visibility prompt (product 1A)", async () => {
		render(<YourPublicFaceSection results={{ ...baseResults, isPublic: false }} />);

		fireEvent.click(screen.getByTestId("share-copy-btn"));

		await waitFor(() => {
			expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
				"https://bigocean.dev/public-profile/profile-123",
			);
		});
		expect(mockToastSuccess).toHaveBeenCalled();
		expect(screen.queryByTestId("visibility-prompt-accept")).not.toBeInTheDocument();
	});

	it("prompts before sharing a private profile, then makes it public and shares with copy fallback", async () => {
		render(<YourPublicFaceSection results={{ ...baseResults, isPublic: false }} />);

		fireEvent.click(screen.getByTestId("share-share-btn"));
		expect(screen.getByTestId("visibility-prompt-accept")).toBeInTheDocument();

		fireEvent.click(screen.getByTestId("visibility-prompt-accept"));

		await waitFor(() => {
			expect(mockMutateAsync).toHaveBeenCalledWith({
				publicProfileId: "profile-123",
				isPublic: true,
			});
		});
		expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
			"https://bigocean.dev/public-profile/profile-123",
		);
		expect(mockToastSuccess).toHaveBeenCalled();
	});
});
