// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockGenerateToken, mockFetchTokenStatus } = vi.hoisted(() => ({
	mockGenerateToken: vi.fn(),
	mockFetchTokenStatus: vi.fn(),
}));

vi.mock("@/lib/qr-token-api", () => ({
	generateToken: (...args: unknown[]) => mockGenerateToken(...args),
	fetchTokenStatus: (...args: unknown[]) => mockFetchTokenStatus(...args),
}));

import { InviteCeremonyCard } from "../InviteCeremonyCard";
import { InviteCeremonyProvider } from "../InviteCeremonyProvider";

function createWrapper() {
	const qc = new QueryClient({
		defaultOptions: {
			queries: { retry: false },
			mutations: { retry: false },
		},
	});
	return ({ children }: { children: React.ReactNode }) => (
		<QueryClientProvider client={qc}>
			<InviteCeremonyProvider>{children}</InviteCeremonyProvider>
		</QueryClientProvider>
	);
}

describe("InviteCeremonyCard", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockGenerateToken.mockResolvedValue({
			token: "card-test-token",
			shareUrl: "https://app.example/relationship/qr/card-test-token",
			expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
		});
		mockFetchTokenStatus.mockResolvedValue({ status: "valid" as const });
	});

	it("renders with stable test id and accessible name", () => {
		render(<InviteCeremonyCard placement="circle-bottom" />, { wrapper: createWrapper() });
		const card = screen.getByTestId("invite-ceremony-card");
		expect(card).toHaveAttribute("data-placement", "circle-bottom");
		expect(card).toHaveAccessibleName(/Invite someone you care about into your Circle/i);
	});

	it("opens invite ceremony dialog when activated", async () => {
		const user = userEvent.setup();
		render(<InviteCeremonyCard placement="me-section" />, { wrapper: createWrapper() });
		await user.click(screen.getByTestId("invite-ceremony-card"));
		await waitFor(() => {
			expect(screen.getByTestId("invite-ceremony-dialog")).toBeInTheDocument();
		});
	});
});
