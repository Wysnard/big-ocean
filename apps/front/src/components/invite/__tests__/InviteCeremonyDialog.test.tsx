// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockGenerateToken, mockFetchTokenStatus, mockToastSuccess, mockToastError, mockToastInfo } =
	vi.hoisted(() => ({
		mockGenerateToken: vi.fn(),
		mockFetchTokenStatus: vi.fn(),
		mockToastSuccess: vi.fn(),
		mockToastError: vi.fn(),
		mockToastInfo: vi.fn(),
	}));

vi.mock("@/lib/qr-token-api", () => ({
	generateToken: (...args: unknown[]) => mockGenerateToken(...args),
	fetchTokenStatus: (...args: unknown[]) => mockFetchTokenStatus(...args),
}));

vi.mock("sonner", () => ({
	toast: { success: mockToastSuccess, error: mockToastError, info: mockToastInfo },
}));

import { InviteCeremonyDialog } from "../InviteCeremonyDialog";

const TOKEN_DATA = {
	token: "test-token",
	shareUrl: "https://app.example/relationship/qr/test-token",
	expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
};

function createWrapper() {
	const qc = new QueryClient({
		defaultOptions: {
			queries: { retry: false },
			mutations: { retry: false },
		},
	});
	return ({ children }: { children: React.ReactNode }) => (
		<QueryClientProvider client={qc}>{children}</QueryClientProvider>
	);
}

describe("InviteCeremonyDialog", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockGenerateToken.mockResolvedValue(TOKEN_DATA);
		mockFetchTokenStatus.mockResolvedValue({ status: "valid" as const });
	});

	it("shows locked ceremony heading when open", async () => {
		render(<InviteCeremonyDialog open onOpenChange={() => {}} />, { wrapper: createWrapper() });
		await waitFor(() => {
			expect(screen.getByText("INVITE SOMEONE YOU CARE ABOUT")).toBeInTheDocument();
		});
	});

	it("renders locked body copy", async () => {
		render(<InviteCeremonyDialog open onOpenChange={() => {}} />, { wrapper: createWrapper() });
		await waitFor(() => {
			expect(screen.getByTestId("invite-ceremony-copy")).toHaveTextContent(
				/Discover the dynamic between you/,
			);
			expect(screen.getByTestId("invite-ceremony-copy")).toHaveTextContent(
				/the unspoken rhythms you've been navigating for years/,
			);
		});
	});

	it("pre-fills optional name from presetName", async () => {
		render(<InviteCeremonyDialog open presetName="Jordan" onOpenChange={() => {}} />, {
			wrapper: createWrapper(),
		});
		await waitFor(() => {
			expect(screen.getByTestId("invite-ceremony-name-input")).toHaveValue("Jordan");
		});
	});

	it("calls onOpenChange(false) when close button clicked (soft dismiss)", async () => {
		const user = userEvent.setup();
		const onOpenChange = vi.fn();
		render(<InviteCeremonyDialog open onOpenChange={onOpenChange} />, { wrapper: createWrapper() });
		await waitFor(() => expect(screen.getByTestId("invite-ceremony-dialog")).toBeInTheDocument());
		// shadcn DialogContent renders an X close button
		const closeBtn = screen.getByRole("button", { name: /close/i });
		await user.click(closeBtn);
		expect(onOpenChange).toHaveBeenCalledWith(false);
	});

	it("copies share URL and shows success toast", async () => {
		const user = userEvent.setup();
		const writeText = vi.fn().mockResolvedValue(undefined);
		Object.defineProperty(globalThis.navigator, "clipboard", {
			value: { writeText },
			configurable: true,
			writable: true,
		});

		render(<InviteCeremonyDialog open onOpenChange={() => {}} />, { wrapper: createWrapper() });
		await waitFor(() =>
			expect(screen.getByTestId("invite-ceremony-copy-link-button")).not.toBeDisabled(),
		);
		await user.click(screen.getByTestId("invite-ceremony-copy-link-button"));
		expect(writeText).toHaveBeenCalledWith(TOKEN_DATA.shareUrl);
		expect(mockToastSuccess).toHaveBeenCalledWith("Link copied");
	});

	it("shows inline QR view when QR button clicked", async () => {
		const user = userEvent.setup();
		render(<InviteCeremonyDialog open onOpenChange={() => {}} />, { wrapper: createWrapper() });
		await waitFor(() => expect(screen.getByTestId("invite-ceremony-qr-button")).not.toBeDisabled());
		await user.click(screen.getByTestId("invite-ceremony-qr-button"));
		// QrDrawerContent renders data-testid="qr-drawer-code" when shareUrl is set
		await waitFor(() => expect(screen.getByTestId("qr-drawer-code")).toBeInTheDocument());
	});

	it("shows Back button in QR view that returns to ceremony", async () => {
		const user = userEvent.setup();
		render(<InviteCeremonyDialog open onOpenChange={() => {}} />, { wrapper: createWrapper() });
		await waitFor(() => expect(screen.getByTestId("invite-ceremony-qr-button")).not.toBeDisabled());
		await user.click(screen.getByTestId("invite-ceremony-qr-button"));
		await waitFor(() => expect(screen.getByRole("button", { name: /Back/i })).toBeInTheDocument());
		await user.click(screen.getByRole("button", { name: /Back/i }));
		expect(screen.getByTestId("invite-ceremony-copy")).toBeInTheDocument();
	});

	it("uses native share when navigator.share is available", async () => {
		const user = userEvent.setup();
		const mockShare = vi.fn().mockResolvedValue(undefined);
		Object.defineProperty(globalThis.navigator, "share", {
			value: mockShare,
			configurable: true,
			writable: true,
		});

		render(<InviteCeremonyDialog open onOpenChange={() => {}} />, { wrapper: createWrapper() });
		await waitFor(() =>
			expect(screen.getByTestId("invite-ceremony-native-share-button")).not.toBeDisabled(),
		);
		await user.click(screen.getByTestId("invite-ceremony-native-share-button"));
		expect(mockShare).toHaveBeenCalledWith(expect.objectContaining({ url: TOKEN_DATA.shareUrl }));
	});

	it("falls back to clipboard copy with info toast when navigator.share throws non-AbortError", async () => {
		const user = userEvent.setup();
		const mockShare = vi.fn().mockRejectedValue(new Error("Permission denied"));
		const writeText = vi.fn().mockResolvedValue(undefined);
		Object.defineProperty(globalThis.navigator, "share", {
			value: mockShare,
			configurable: true,
			writable: true,
		});
		Object.defineProperty(globalThis.navigator, "clipboard", {
			value: { writeText },
			configurable: true,
			writable: true,
		});

		render(<InviteCeremonyDialog open onOpenChange={() => {}} />, { wrapper: createWrapper() });
		await waitFor(() =>
			expect(screen.getByTestId("invite-ceremony-native-share-button")).not.toBeDisabled(),
		);
		await user.click(screen.getByTestId("invite-ceremony-native-share-button"));
		await waitFor(() =>
			expect(mockToastInfo).toHaveBeenCalledWith("Share unavailable — copying link instead"),
		);
		expect(writeText).toHaveBeenCalledWith(TOKEN_DATA.shareUrl);
	});
});
