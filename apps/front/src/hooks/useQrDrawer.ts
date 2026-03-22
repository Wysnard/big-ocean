/**
 * useQrDrawer Hook (Story 34-2)
 *
 * QR drawer lifecycle using TanStack Query:
 * - Opens drawer → generates token → displays QR
 * - Polls status every 60s → if expired, auto-regenerates
 * - Token regenerates every hour (55-min threshold to avoid edge cases)
 * - On generation failure, keeps drawer open for retry
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { fetchTokenStatus, generateToken, type QrTokenData } from "../lib/qr-token-api";

export const POLL_INTERVAL_MS = 60_000;
const REGENERATE_THRESHOLD_MS = 55 * 60 * 1000; // 55 min — regenerate before 1h TTL

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
	});

	// Poll token status — auto-regenerate on expiry or near-expiry
	useQuery({
		queryKey: ["qrToken", "status", tokenData?.token],
		queryFn: async () => {
			if (!tokenData) throw new Error("No token");

			// Near expiry → regenerate preemptively
			const timeRemaining = new Date(tokenData.expiresAt).getTime() - Date.now();
			if (timeRemaining < REGENERATE_THRESHOLD_MS) {
				const fresh = await generateToken();
				setTokenData(fresh);
				return { status: "valid" as const };
			}

			const result = await fetchTokenStatus(tokenData.token);

			// Expired → auto-regenerate
			if (result.status === "expired") {
				const fresh = await generateToken();
				setTokenData(fresh);
				return { status: "valid" as const };
			}

			return result;
		},
		enabled: isOpen && !!tokenData?.token,
		refetchInterval: (query) => {
			// Stop polling once accepted (terminal state)
			if (query.state.data?.status === "accepted") return false;
			return POLL_INTERVAL_MS;
		},
	});

	const status =
		queryClient.getQueryData<{ status: string }>(["qrToken", "status", tokenData?.token])?.status ??
		(tokenData ? "valid" : "idle");

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

	const retry = useCallback(() => {
		generateMutation.mutate();
	}, [generateMutation]);

	return {
		isOpen,
		token: tokenData?.token ?? null,
		shareUrl: tokenData?.shareUrl ?? null,
		status,
		isLoading: generateMutation.isPending,
		error: generateMutation.isError ? "Failed to generate QR code. Please try again." : null,
		open,
		close,
		retry,
	};
}
