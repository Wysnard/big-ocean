// @vitest-environment jsdom
/**
 * QrAcceptScreen Component Tests (Story 34-3)
 *
 * Tests for the QR accept screen UI states:
 * - Loading state
 * - Valid token with initiator archetype and credit info
 * - Expired token
 * - Already accepted token
 * - Accept/Refuse button interactions
 * - Error states
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { QrAcceptScreen } from "./QrAcceptScreen";

// Mock ArchetypeCard to avoid Recharts/SVG complexity in unit tests
vi.mock("../results/ArchetypeCard", () => ({
	ArchetypeCard: ({ archetypeName }: { archetypeName: string }) => (
		<div data-testid="archetype-card">{archetypeName}</div>
	),
}));

// Mock ConfidenceRingCard to avoid Recharts in unit tests
vi.mock("../results/ConfidenceRingCard", () => ({
	ConfidenceRingCard: ({ confidence }: { confidence: number }) => (
		<div data-testid="confidence-ring">{Math.round(confidence * 100)}%</div>
	),
}));

const validDetails = {
	tokenStatus: "valid" as const,
	initiator: {
		name: "Alice",
		archetypeName: "The Compass",
		oceanCode4: "MSBD",
		oceanCode5: "MSBDV",
		description: "A thoughtful navigator",
		color: "#3B82F6",
		isCurated: true,
		overallConfidence: 72,
	},
	acceptor: {
		overallConfidence: 65,
		availableCredits: 2,
		hasCompletedAssessment: true,
	},
};

describe("QrAcceptScreen", () => {
	it("renders loading state", () => {
		render(
			<QrAcceptScreen
				details={null}
				isLoading={true}
				error={null}
				onAccept={vi.fn()}
				onRefuse={vi.fn()}
				isAccepting={false}
				isRefusing={false}
				acceptError={null}
			/>,
		);

		expect(screen.getByTestId("qr-accept-loading")).toBeInTheDocument();
	});

	it("renders valid accept screen with initiator info", () => {
		render(
			<QrAcceptScreen
				details={validDetails}
				isLoading={false}
				error={null}
				onAccept={vi.fn()}
				onRefuse={vi.fn()}
				isAccepting={false}
				isRefusing={false}
				acceptError={null}
			/>,
		);

		expect(screen.getByTestId("qr-accept-screen")).toBeInTheDocument();
		expect(screen.getByText(/Discover your dynamic with Alice/)).toBeInTheDocument();
		expect(screen.getByTestId("archetype-card")).toHaveTextContent("The Compass");
		expect(screen.getByTestId("qr-accept-credit-balance")).toHaveTextContent("2 available");
		expect(screen.getByTestId("qr-accept-button")).toBeInTheDocument();
		expect(screen.getByTestId("qr-refuse-button")).toBeInTheDocument();
	});

	it("renders confidence rings for both users", () => {
		render(
			<QrAcceptScreen
				details={validDetails}
				isLoading={false}
				error={null}
				onAccept={vi.fn()}
				onRefuse={vi.fn()}
				isAccepting={false}
				isRefusing={false}
				acceptError={null}
			/>,
		);

		expect(screen.getByTestId("qr-accept-initiator-confidence")).toBeInTheDocument();
		expect(screen.getByTestId("qr-accept-acceptor-confidence")).toBeInTheDocument();
	});

	it("renders expired token state", () => {
		const expiredDetails = { ...validDetails, tokenStatus: "expired" as const };
		render(
			<QrAcceptScreen
				details={expiredDetails}
				isLoading={false}
				error={null}
				onAccept={vi.fn()}
				onRefuse={vi.fn()}
				isAccepting={false}
				isRefusing={false}
				acceptError={null}
			/>,
		);

		expect(screen.getByTestId("qr-accept-expired")).toBeInTheDocument();
		expect(screen.getByText("QR Code Expired")).toBeInTheDocument();
	});

	it("renders already-accepted state", () => {
		const acceptedDetails = { ...validDetails, tokenStatus: "accepted" as const };
		render(
			<QrAcceptScreen
				details={acceptedDetails}
				isLoading={false}
				error={null}
				onAccept={vi.fn()}
				onRefuse={vi.fn()}
				isAccepting={false}
				isRefusing={false}
				acceptError={null}
			/>,
		);

		expect(screen.getByTestId("qr-accept-already-accepted")).toBeInTheDocument();
	});

	it("calls onAccept when accept button is clicked", async () => {
		const onAccept = vi.fn();
		const user = userEvent.setup();

		render(
			<QrAcceptScreen
				details={validDetails}
				isLoading={false}
				error={null}
				onAccept={onAccept}
				onRefuse={vi.fn()}
				isAccepting={false}
				isRefusing={false}
				acceptError={null}
			/>,
		);

		await user.click(screen.getByTestId("qr-accept-button"));
		expect(onAccept).toHaveBeenCalledOnce();
	});

	it("calls onRefuse when refuse button is clicked", async () => {
		const onRefuse = vi.fn();
		const user = userEvent.setup();

		render(
			<QrAcceptScreen
				details={validDetails}
				isLoading={false}
				error={null}
				onAccept={vi.fn()}
				onRefuse={onRefuse}
				isAccepting={false}
				isRefusing={false}
				acceptError={null}
			/>,
		);

		await user.click(screen.getByTestId("qr-refuse-button"));
		expect(onRefuse).toHaveBeenCalledOnce();
	});

	it("disables buttons while accepting", () => {
		render(
			<QrAcceptScreen
				details={validDetails}
				isLoading={false}
				error={null}
				onAccept={vi.fn()}
				onRefuse={vi.fn()}
				isAccepting={true}
				isRefusing={false}
				acceptError={null}
			/>,
		);

		expect(screen.getByTestId("qr-accept-button")).toBeDisabled();
		expect(screen.getByTestId("qr-refuse-button")).toBeDisabled();
		expect(screen.getByText("Accepting...")).toBeInTheDocument();
	});

	it("renders error state for network errors", () => {
		render(
			<QrAcceptScreen
				details={null}
				isLoading={false}
				error={new Error("Network error")}
				onAccept={vi.fn()}
				onRefuse={vi.fn()}
				isAccepting={false}
				isRefusing={false}
				acceptError={null}
			/>,
		);

		expect(screen.getByTestId("qr-accept-error")).toBeInTheDocument();
	});
});
