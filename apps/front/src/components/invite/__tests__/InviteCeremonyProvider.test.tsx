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

import { InviteCeremonyProvider, useInviteCeremony } from "../InviteCeremonyProvider";

function OpenButton() {
	const { openCeremony } = useInviteCeremony();
	return (
		<button type="button" onClick={() => openCeremony()}>
			Open invite
		</button>
	);
}

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

describe("InviteCeremonyProvider", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockGenerateToken.mockResolvedValue({
			token: "provider-test-token",
			shareUrl: "https://app.example/relationship/qr/provider-test-token",
			expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
		});
		mockFetchTokenStatus.mockResolvedValue({ status: "valid" as const });
	});

	it("opens QR drawer content when openCeremony is called", async () => {
		const user = userEvent.setup();
		render(<OpenButton />, { wrapper: createWrapper() });
		await user.click(screen.getByRole("button", { name: /open invite/i }));
		await waitFor(() => {
			expect(screen.getByTestId("invite-qr-drawer")).toBeInTheDocument();
		});
		await waitFor(() => {
			expect(screen.getByTestId("qr-drawer-code")).toBeInTheDocument();
		});
	});
});
