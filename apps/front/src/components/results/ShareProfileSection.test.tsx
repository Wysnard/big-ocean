// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ShareProfileSection } from "./ShareProfileSection";

const defaultShareState = {
	publicProfileId: "profile-123",
	shareableUrl: "https://bigocean.dev/public-profile/profile-123",
	isPublic: true,
};

const defaultProps = {
	shareState: defaultShareState,
	copied: false,
	isTogglePending: false,
	onToggleVisibility: () => {},
	onShareAction: () => {},
	promptNeeded: false,
	onAcceptPrompt: () => {},
	onDeclinePrompt: () => {},
	isShareToggling: false,
};

describe("ShareProfileSection", () => {
	beforeEach(() => {
		// Reset navigator mocks
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

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("renders null when shareState is null", () => {
		const { container } = render(<ShareProfileSection {...defaultProps} shareState={null} />);
		expect(container.innerHTML).toBe("");
	});

	it("renders the share section with URL", () => {
		render(<ShareProfileSection {...defaultProps} />);
		expect(screen.getByTestId("share-url")).toHaveTextContent(defaultShareState.shareableUrl);
	});

	it("shows 'Share' button when Web Share API is available", () => {
		Object.defineProperty(navigator, "share", {
			value: vi.fn(),
			writable: true,
			configurable: true,
		});

		render(<ShareProfileSection {...defaultProps} />);
		expect(screen.getByTestId("share-copy-btn")).toHaveTextContent("Share");
	});

	it("shows 'Copy' button when Web Share API is not available", () => {
		render(<ShareProfileSection {...defaultProps} />);
		expect(screen.getByTestId("share-copy-btn")).toHaveTextContent("Copy");
	});

	it("calls onShareAction when share button is clicked", () => {
		const onShareAction = vi.fn();
		render(<ShareProfileSection {...defaultProps} onShareAction={onShareAction} />);
		fireEvent.click(screen.getByTestId("share-copy-btn"));
		expect(onShareAction).toHaveBeenCalledOnce();
	});

	it("shows 'Copied!' when copied is true", () => {
		render(<ShareProfileSection {...defaultProps} copied={true} />);
		expect(screen.getByTestId("share-copy-btn")).toHaveTextContent("Copied!");
	});

	it("does not call onShareAction when copied is true", () => {
		const onShareAction = vi.fn();
		render(<ShareProfileSection {...defaultProps} copied={true} onShareAction={onShareAction} />);
		fireEvent.click(screen.getByTestId("share-copy-btn"));
		expect(onShareAction).not.toHaveBeenCalled();
	});

	it("has data-slot attribute", () => {
		const { container } = render(<ShareProfileSection {...defaultProps} />);
		expect(container.querySelector("[data-slot='share-profile-section']")).toBeInTheDocument();
	});

	it("renders PublicVisibilityPrompt when promptNeeded is true", () => {
		render(<ShareProfileSection {...defaultProps} promptNeeded={true} />);
		expect(screen.getByText(/make your profile public so friends can see/i)).toBeInTheDocument();
	});

	it("does not render PublicVisibilityPrompt when promptNeeded is false", () => {
		render(<ShareProfileSection {...defaultProps} promptNeeded={false} />);
		expect(
			screen.queryByText(/make your profile public so friends can see/i),
		).not.toBeInTheDocument();
	});

	it("calls onAcceptPrompt when Accept is clicked in prompt", () => {
		const onAcceptPrompt = vi.fn();
		render(
			<ShareProfileSection {...defaultProps} promptNeeded={true} onAcceptPrompt={onAcceptPrompt} />,
		);
		fireEvent.click(screen.getByTestId("visibility-prompt-accept"));
		expect(onAcceptPrompt).toHaveBeenCalledOnce();
	});

	it("calls onDeclinePrompt when Decline is clicked in prompt", () => {
		const onDeclinePrompt = vi.fn();
		render(
			<ShareProfileSection {...defaultProps} promptNeeded={true} onDeclinePrompt={onDeclinePrompt} />,
		);
		fireEvent.click(screen.getByTestId("visibility-prompt-decline"));
		expect(onDeclinePrompt).toHaveBeenCalledOnce();
	});
});
