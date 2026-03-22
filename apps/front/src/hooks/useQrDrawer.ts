/**
 * useQrDrawer Hook (Story 34-2)
 *
 * Manages the QR drawer lifecycle:
 * - Generates a QR token on drawer open
 * - Exposes pollNow() for status checking (component sets up interval)
 * - Auto-regenerates token when near expiry (< 55 min remaining)
 * - Cleans up on close or unmount
 *
 * Uses Effect HttpApiClient with @workspace/contracts for type-safe API calls.
 */

import { Effect } from "effect";
import { useCallback, useEffect, useRef, useState } from "react";
import { makeApiClient } from "../lib/api-client";

export const POLL_INTERVAL_MS = 60_000;
const REGENERATE_THRESHOLD_MS = 55 * 60 * 1000; // Regenerate when < 55 min remaining

type QrStatus = "idle" | "valid" | "accepted" | "expired";

interface QrDrawerState {
	isOpen: boolean;
	token: string | null;
	shareUrl: string | null;
	expiresAt: string | null;
	status: QrStatus;
	isLoading: boolean;
	error: string | null;
}

const initialState: QrDrawerState = {
	isOpen: false,
	token: null,
	shareUrl: null,
	expiresAt: null,
	status: "idle",
	isLoading: false,
	error: null,
};

async function generateToken(): Promise<{
	token: string;
	shareUrl: string;
	expiresAt: string;
}> {
	const result = await Effect.gen(function* () {
		const client = yield* makeApiClient;
		return yield* client.qrToken.generateQrToken({});
	}).pipe(Effect.runPromise);

	return {
		token: result.token,
		shareUrl: result.shareUrl,
		expiresAt: String(result.expiresAt),
	};
}

async function fetchTokenStatus(
	token: string,
): Promise<{ status: "valid" | "accepted" | "expired" }> {
	return Effect.gen(function* () {
		const client = yield* makeApiClient;
		return yield* client.qrToken.getQrTokenStatus({ path: { token } });
	}).pipe(Effect.runPromise);
}

export function useQrDrawer() {
	const [state, setState] = useState<QrDrawerState>(initialState);
	const isMountedRef = useRef(true);
	const stateRef = useRef(state);
	stateRef.current = state;

	const close = useCallback(() => {
		setState(initialState);
	}, []);

	const pollNow = useCallback(async () => {
		const current = stateRef.current;
		if (!current.token || !current.expiresAt || !isMountedRef.current) return;

		try {
			// Check if token is near expiry — regenerate if so
			const timeRemaining = new Date(current.expiresAt).getTime() - Date.now();
			if (timeRemaining < REGENERATE_THRESHOLD_MS) {
				const fresh = await generateToken();
				if (!isMountedRef.current) return;
				setState((prev) => ({
					...prev,
					token: fresh.token,
					shareUrl: fresh.shareUrl,
					expiresAt: fresh.expiresAt,
					status: "valid",
				}));
				return;
			}

			const result = await fetchTokenStatus(current.token);
			if (!isMountedRef.current) return;

			setState((prev) => ({ ...prev, status: result.status }));
		} catch {
			// Polling errors are non-fatal — will retry next interval
		}
	}, []);

	const open = useCallback(async () => {
		setState((prev) => ({ ...prev, isOpen: true, isLoading: true, error: null }));

		try {
			const data = await generateToken();
			if (!isMountedRef.current) return;

			setState({
				isOpen: true,
				token: data.token,
				shareUrl: data.shareUrl,
				expiresAt: data.expiresAt,
				status: "valid",
				isLoading: false,
				error: null,
			});
		} catch {
			if (!isMountedRef.current) return;
			setState({
				...initialState,
				error: "Failed to generate QR code. Please try again.",
			});
		}
	}, []);

	// Auto-poll when drawer is open with a valid/non-terminal status
	useEffect(() => {
		if (!state.isOpen || !state.token || state.status === "accepted" || state.status === "expired") {
			return;
		}

		const intervalId = setInterval(() => {
			pollNow();
		}, POLL_INTERVAL_MS);

		return () => clearInterval(intervalId);
	}, [state.isOpen, state.token, state.status, pollNow]);

	// Cleanup on unmount
	useEffect(() => {
		isMountedRef.current = true;
		return () => {
			isMountedRef.current = false;
		};
	}, []);

	return {
		isOpen: state.isOpen,
		token: state.token,
		shareUrl: state.shareUrl,
		status: state.status,
		isLoading: state.isLoading,
		error: state.error,
		open,
		close,
		pollNow,
	};
}
