// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useShareFlow } from "./use-share-flow";

describe("useShareFlow", () => {
	const defaultShareState = {
		publicProfileId: "profile-123",
		shareableUrl: "https://bigocean.dev/public-profile/profile-123",
		isPublic: true,
	};

	const privateShareState = {
		...defaultShareState,
		isPublic: false,
	};

	let mockToggleVisibility: ReturnType<typeof vi.fn>;
	let mockOnShareStateChange: ReturnType<typeof vi.fn>;
	let mockOnCopied: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		mockToggleVisibility = vi.fn().mockResolvedValue({ isPublic: true });
		mockOnShareStateChange = vi.fn();
		mockOnCopied = vi.fn();
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
		vi.useRealTimers();
	});

	it("triggers share immediately when profile is public", async () => {
		Object.defineProperty(navigator, "share", {
			value: vi.fn().mockResolvedValue(undefined),
			writable: true,
			configurable: true,
		});

		const { result } = renderHook(() =>
			useShareFlow({
				shareState: defaultShareState,
				archetypeName: "The Explorer",
				toggleVisibility: mockToggleVisibility,
				onShareStateChange: mockOnShareStateChange,
				onCopied: mockOnCopied,
			}),
		);

		await act(async () => {
			await result.current.initiateShare();
		});

		expect(navigator.share).toHaveBeenCalledOnce();
		expect(result.current.promptNeeded).toBe(false);
	});

	it("copies to clipboard when Web Share API unavailable and profile is public", async () => {
		const { result } = renderHook(() =>
			useShareFlow({
				shareState: defaultShareState,
				archetypeName: "The Explorer",
				toggleVisibility: mockToggleVisibility,
				onShareStateChange: mockOnShareStateChange,
				onCopied: mockOnCopied,
			}),
		);

		await act(async () => {
			await result.current.initiateShare();
		});

		expect(navigator.clipboard.writeText).toHaveBeenCalledWith(defaultShareState.shareableUrl);
		expect(result.current.copied).toBe(true);
		expect(mockOnCopied).toHaveBeenCalledWith(defaultShareState.shareableUrl);
	});

	it("copies the link directly when copyLink is called", async () => {
		const { result } = renderHook(() =>
			useShareFlow({
				shareState: defaultShareState,
				archetypeName: "The Explorer",
				toggleVisibility: mockToggleVisibility,
				onShareStateChange: mockOnShareStateChange,
				onCopied: mockOnCopied,
			}),
		);

		await act(async () => {
			await result.current.copyLink();
		});

		expect(navigator.clipboard.writeText).toHaveBeenCalledWith(defaultShareState.shareableUrl);
		expect(result.current.copied).toBe(true);
		expect(mockOnCopied).toHaveBeenCalledWith(defaultShareState.shareableUrl);
	});

	it("shows prompt when profile is private", async () => {
		const { result } = renderHook(() =>
			useShareFlow({
				shareState: privateShareState,
				archetypeName: "The Explorer",
				toggleVisibility: mockToggleVisibility,
				onShareStateChange: mockOnShareStateChange,
				onCopied: mockOnCopied,
			}),
		);

		await act(async () => {
			await result.current.initiateShare();
		});

		expect(result.current.promptNeeded).toBe(true);
		expect(mockToggleVisibility).not.toHaveBeenCalled();
	});

	it("acceptAndShare toggles visibility then shares", async () => {
		const { result } = renderHook(() =>
			useShareFlow({
				shareState: privateShareState,
				archetypeName: "The Explorer",
				toggleVisibility: mockToggleVisibility,
				onShareStateChange: mockOnShareStateChange,
				onCopied: mockOnCopied,
			}),
		);

		// First, initiate share to show prompt
		await act(async () => {
			await result.current.initiateShare();
		});
		expect(result.current.promptNeeded).toBe(true);

		// Accept the prompt
		await act(async () => {
			await result.current.acceptAndShare();
		});

		expect(mockToggleVisibility).toHaveBeenCalledWith({
			publicProfileId: "profile-123",
			isPublic: true,
		});
		expect(mockOnShareStateChange).toHaveBeenCalledWith({ isPublic: true });
		expect(result.current.promptNeeded).toBe(false);
		// Should have triggered copy since Web Share API is unavailable
		expect(navigator.clipboard.writeText).toHaveBeenCalledWith(privateShareState.shareableUrl);
		expect(mockOnCopied).toHaveBeenCalledWith(privateShareState.shareableUrl);
	});

	it("declineShare resets prompt state", async () => {
		const { result } = renderHook(() =>
			useShareFlow({
				shareState: privateShareState,
				archetypeName: "The Explorer",
				toggleVisibility: mockToggleVisibility,
				onShareStateChange: mockOnShareStateChange,
				onCopied: mockOnCopied,
			}),
		);

		await act(async () => {
			await result.current.initiateShare();
		});
		expect(result.current.promptNeeded).toBe(true);

		act(() => {
			result.current.declineShare();
		});
		expect(result.current.promptNeeded).toBe(false);
		expect(mockToggleVisibility).not.toHaveBeenCalled();
	});

	it("copied state resets after 2 seconds", async () => {
		vi.useFakeTimers();

		const { result } = renderHook(() =>
			useShareFlow({
				shareState: defaultShareState,
				archetypeName: "The Explorer",
				toggleVisibility: mockToggleVisibility,
				onShareStateChange: mockOnShareStateChange,
				onCopied: mockOnCopied,
			}),
		);

		await act(async () => {
			await result.current.initiateShare();
		});
		expect(result.current.copied).toBe(true);

		act(() => {
			vi.advanceTimersByTime(2000);
		});
		expect(result.current.copied).toBe(false);
	});

	it("does nothing when shareState is null", async () => {
		const { result } = renderHook(() =>
			useShareFlow({
				shareState: null,
				archetypeName: "The Explorer",
				toggleVisibility: mockToggleVisibility,
				onShareStateChange: mockOnShareStateChange,
				onCopied: mockOnCopied,
			}),
		);

		await act(async () => {
			await result.current.initiateShare();
		});

		expect(result.current.promptNeeded).toBe(false);
		expect(result.current.copied).toBe(false);
	});
});
