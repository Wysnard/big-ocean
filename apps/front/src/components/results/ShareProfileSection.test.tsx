// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ShareProfileSection } from "./ShareProfileSection";

const defaultShareState = {
	publicProfileId: "profile-123",
	shareableUrl: "https://bigocean.dev/public-profile/profile-123",
	isPublic: true,
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
		const { container } = render(
			<ShareProfileSection
				shareState={null}
				copied={false}
				isTogglePending={false}
				onCopyLink={() => {}}
				onToggleVisibility={() => {}}
				onShareLink={() => {}}
			/>,
		);
		expect(container.innerHTML).toBe("");
	});

	it("renders the share section with URL", () => {
		render(
			<ShareProfileSection
				shareState={defaultShareState}
				copied={false}
				isTogglePending={false}
				onCopyLink={() => {}}
				onToggleVisibility={() => {}}
				onShareLink={() => {}}
			/>,
		);
		expect(screen.getByTestId("share-url")).toHaveTextContent(defaultShareState.shareableUrl);
	});

	it("shows 'Share' button when Web Share API is available", () => {
		Object.defineProperty(navigator, "share", {
			value: vi.fn(),
			writable: true,
			configurable: true,
		});

		render(
			<ShareProfileSection
				shareState={defaultShareState}
				copied={false}
				isTogglePending={false}
				onCopyLink={() => {}}
				onToggleVisibility={() => {}}
				onShareLink={() => {}}
			/>,
		);
		expect(screen.getByTestId("share-action-btn")).toHaveTextContent("Share");
	});

	it("shows 'Copy' button when Web Share API is not available", () => {
		render(
			<ShareProfileSection
				shareState={defaultShareState}
				copied={false}
				isTogglePending={false}
				onCopyLink={() => {}}
				onToggleVisibility={() => {}}
				onShareLink={() => {}}
			/>,
		);
		expect(screen.getByTestId("share-action-btn")).toHaveTextContent("Copy");
	});

	it("calls onShareLink when Web Share API is available and button is clicked", () => {
		Object.defineProperty(navigator, "share", {
			value: vi.fn(),
			writable: true,
			configurable: true,
		});
		const onShareLink = vi.fn();

		render(
			<ShareProfileSection
				shareState={defaultShareState}
				copied={false}
				isTogglePending={false}
				onCopyLink={() => {}}
				onToggleVisibility={() => {}}
				onShareLink={onShareLink}
			/>,
		);
		fireEvent.click(screen.getByTestId("share-action-btn"));
		expect(onShareLink).toHaveBeenCalledOnce();
	});

	it("calls onCopyLink when Web Share API is not available and button is clicked", () => {
		const onCopyLink = vi.fn();

		render(
			<ShareProfileSection
				shareState={defaultShareState}
				copied={false}
				isTogglePending={false}
				onCopyLink={onCopyLink}
				onToggleVisibility={() => {}}
				onShareLink={() => {}}
			/>,
		);
		fireEvent.click(screen.getByTestId("share-action-btn"));
		expect(onCopyLink).toHaveBeenCalledOnce();
	});

	it("shows 'Copied!' when copied is true", () => {
		render(
			<ShareProfileSection
				shareState={defaultShareState}
				copied={true}
				isTogglePending={false}
				onCopyLink={() => {}}
				onToggleVisibility={() => {}}
				onShareLink={() => {}}
			/>,
		);
		expect(screen.getByTestId("share-action-btn")).toHaveTextContent("Copied!");
	});

	it("has data-slot attribute", () => {
		const { container } = render(
			<ShareProfileSection
				shareState={defaultShareState}
				copied={false}
				isTogglePending={false}
				onCopyLink={() => {}}
				onToggleVisibility={() => {}}
				onShareLink={() => {}}
			/>,
		);
		expect(container.querySelector("[data-slot='share-profile-section']")).toBeInTheDocument();
	});
});
