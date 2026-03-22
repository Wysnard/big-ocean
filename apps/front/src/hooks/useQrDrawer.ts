/**
 * useQrDrawer Hook (Story 34-2)
 *
 * Manages the QR drawer lifecycle using TanStack Query:
 * - useMutation for token generation
 * - useQuery with refetchInterval for status polling
 * - Auto-regenerates token when near expiry (< 55 min remaining)
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { fetchTokenStatus, generateToken, type QrTokenData } from "../lib/qr-token-api";

export const POLL_INTERVAL_MS = 60_000;
const REGENERATE_THRESHOLD_MS = 55 * 60 * 1000; // Regenerate when < 55 min remaining

export function useQrDrawer() {
	const [isOpen, setIsOpen] = useState(false);
	const [tokenData, setTokenData] = useState<QrTokenData | null>(null);
	const queryClient = useQueryClient();

	const generateMutation = useMutation({
		mutationKey: ["qrToken", "generate"],
		mutationFn: generateToken,
		onSuccess: (data) => {
			setTokenData(data);
		},
		onError: () => {
			setIsOpen(false);
		},
	});

	// Poll token status while drawer is open and token is valid
	const statusQuery = useQuery({
		queryKey: ["qrToken", "status", tokenData?.token],
		queryFn: async () => {
			if (!tokenData) throw new Error("No token");

			// Check if token is near expiry — regenerate if so
			const timeRemaining = new Date(tokenData.expiresAt).getTime() - Date.now();
			if (timeRemaining < REGENERATE_THRESHOLD_MS) {
				const fresh = await generateToken();
				setTokenData(fresh);
				return { status: "valid" as const };
			}

			return fetchTokenStatus(tokenData.token);
		},
		enabled: isOpen && !!tokenData?.token,
		refetchInterval: (query) => {
			const status = query.state.data?.status;
			if (status === "accepted" || status === "expired") return false;
			return POLL_INTERVAL_MS;
		},
	});

	const status = statusQuery.data?.status ?? (tokenData ? "valid" : "idle");

	const open = useCallback(() => {
		setIsOpen(true);
		generateMutation.mutate();
	}, [generateMutation]);

	const close = useCallback(() => {
		setIsOpen(false);
		setTokenData(null);
		generateMutation.reset();
		queryClient.removeQueries({ queryKey: ["qrToken", "status"] });
	}, [generateMutation, queryClient]);

	return {
		isOpen,
		token: tokenData?.token ?? null,
		shareUrl: tokenData?.shareUrl ?? null,
		status,
		isLoading: generateMutation.isPending,
		error: generateMutation.isError ? "Failed to generate QR code. Please try again." : null,
		open,
		close,
	};
}
