/**
 * QrDrawer Component Tests (Story 34-2)
 *
 * Tests for the QR drawer UI states:
 * - Loading state with skeleton
 * - Ready state with QR code and share URL
 * - Accepted state with success message
 * - Error state
 * - Copy to clipboard functionality
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { QrDrawerContent } from "./QrDrawer";

describe("QrDrawerContent", () => {
	it("renders loading skeleton when isLoading is true", () => {
		render(
			<QrDrawerContent
				isLoading={true}
				token={null}
				shareUrl={null}
				status="idle"
				error={null}
				onClose={vi.fn()}
			/>,
		);

		expect(screen.getByTestId("qr-drawer-loading")).toBeInTheDocument();
	});

	it("renders QR code when token is available", () => {
		render(
			<QrDrawerContent
				isLoading={false}
				token="test-token-123"
				shareUrl="http://localhost:3000/relationship/qr/test-token-123"
				status="valid"
				error={null}
				onClose={vi.fn()}
			/>,
		);

		expect(screen.getByTestId("qr-drawer-code")).toBeInTheDocument();
		expect(screen.getByTestId("qr-drawer-share-url")).toBeInTheDocument();
		expect(screen.getByTestId("qr-drawer-copy-button")).toBeInTheDocument();
	});

	it("renders accepted state when token is accepted", () => {
		render(
			<QrDrawerContent
				isLoading={false}
				token="test-token-123"
				shareUrl="http://localhost:3000/relationship/qr/test-token-123"
				status="accepted"
				error={null}
				onClose={vi.fn()}
			/>,
		);

		expect(screen.getByTestId("qr-drawer-accepted")).toBeInTheDocument();
	});

	it("renders error state", () => {
		const onClose = vi.fn();
		render(
			<QrDrawerContent
				isLoading={false}
				token={null}
				shareUrl={null}
				status="idle"
				error="Failed to generate QR code. Please try again."
				onClose={onClose}
			/>,
		);

		expect(screen.getByTestId("qr-drawer-error")).toBeInTheDocument();
		expect(screen.getByText("Failed to generate QR code. Please try again.")).toBeInTheDocument();
	});

	it("copies share URL to clipboard on button click", async () => {
		const user = userEvent.setup();
		const writeText = vi.fn().mockResolvedValue(undefined);
		vi.stubGlobal("navigator", {
			...navigator,
			clipboard: { writeText },
		});

		render(
			<QrDrawerContent
				isLoading={false}
				token="test-token-123"
				shareUrl="http://localhost:3000/relationship/qr/test-token-123"
				status="valid"
				error={null}
				onClose={vi.fn()}
			/>,
		);

		const copyButton = screen.getByTestId("qr-drawer-copy-button");
		await user.click(copyButton);

		expect(writeText).toHaveBeenCalledWith("http://localhost:3000/relationship/qr/test-token-123");
	});

	it("shows share URL text", () => {
		render(
			<QrDrawerContent
				isLoading={false}
				token="test-token-123"
				shareUrl="http://localhost:3000/relationship/qr/test-token-123"
				status="valid"
				error={null}
				onClose={vi.fn()}
			/>,
		);

		const urlElement = screen.getByTestId("qr-drawer-share-url");
		expect(urlElement.textContent).toContain("localhost:3000/relationship/qr/test-token-123");
	});

	it("has proper accessible title and description", () => {
		render(
			<QrDrawerContent
				isLoading={false}
				token="test-token-123"
				shareUrl="http://localhost:3000/relationship/qr/test-token-123"
				status="valid"
				error={null}
				onClose={vi.fn()}
			/>,
		);

		expect(screen.getByText("Invite Someone")).toBeInTheDocument();
		expect(screen.getByText(/Share this QR code/)).toBeInTheDocument();
	});
});
