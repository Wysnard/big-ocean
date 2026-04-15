/**
 * QR invite token lifecycle for Invite Ceremony (Story 6-2).
 * Mirrors useQrDrawer polling/TTL with isolated query keys so it does not clash with QrDrawerWithTrigger.
 *
 * Design note: token generation and TTL-refresh are handled exclusively via the mutation;
 * the status query only calls fetchTokenStatus (read-only) and signals "needs-refresh" rather than
 * mutating state itself, avoiding side-effects inside React Query's queryFn.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";
import type { QrTokenData } from "@/lib/qr-token-api";
import { fetchTokenStatus, generateToken } from "@/lib/qr-token-api";

export const INVITE_CEREMONY_POLL_INTERVAL_MS = 60_000;
const REGENERATE_THRESHOLD_MS = 55 * 60 * 1000;

export function useInviteCeremonyQrToken(isActive: boolean) {
	const [tokenData, setTokenData] = useState<QrTokenData | null>(null);
	const queryClient = useQueryClient();
	const generationEpochRef = useRef(0);

	const generateMutation = useMutation({
		mutationKey: ["inviteCeremony", "qrToken", "generate"],
		mutationFn: generateToken,
	});

	const startSession = useCallback(
		(epoch?: number) => {
			const currentEpoch = epoch ?? ++generationEpochRef.current;
			generateMutation.mutate(undefined, {
				onSuccess: (data) => {
					if (generationEpochRef.current !== currentEpoch) return;
					setTokenData(data);
					// Invalidate the status query so it re-evaluates with the new token.
					queryClient.removeQueries({ queryKey: ["inviteCeremony", "qrToken", "status"] });
				},
			});
		},
		[generateMutation, queryClient],
	);

	const resetSession = useCallback(() => {
		generationEpochRef.current += 1;
		setTokenData(null);
		generateMutation.reset();
		queryClient.removeQueries({ queryKey: ["inviteCeremony", "qrToken", "status"] });
	}, [generateMutation, queryClient]);

	const retry = useCallback(() => {
		generationEpochRef.current += 1;
		startSession(generationEpochRef.current);
	}, [startSession]);

	// Status query: read-only — never mutates state.
	// When expired or near-TTL, it returns "needs-refresh" so the caller can trigger regeneration.
	const statusQuery = useQuery({
		queryKey: ["inviteCeremony", "qrToken", "status", tokenData?.token ?? ""],
		queryFn: async () => {
			if (!tokenData) throw new Error("No token");

			const timeRemaining = new Date(tokenData.expiresAt).getTime() - Date.now();
			if (timeRemaining < REGENERATE_THRESHOLD_MS) {
				return { status: "needs-refresh" as const };
			}

			return fetchTokenStatus(tokenData.token);
		},
		enabled: isActive && !!tokenData?.token && !generateMutation.isPending,
		refetchInterval: (query) => {
			const s = query.state.data?.status;
			if (s === "accepted" || s === "needs-refresh") return false;
			return INVITE_CEREMONY_POLL_INTERVAL_MS;
		},
	});

	// When the status query signals needs-refresh, kick off a new generation.
	// This effect runs only when the status changes to needs-refresh.
	const prevStatusRef = useRef<string | undefined>(undefined);
	const statusData = statusQuery.data?.status;
	if (statusData === "needs-refresh" && prevStatusRef.current !== "needs-refresh") {
		generationEpochRef.current += 1;
		startSession(generationEpochRef.current);
	}
	prevStatusRef.current = statusData;

	// Normalize status: only "valid" once confirmed by a successful poll (or just-generated).
	const polledStatus = statusQuery.data?.status;
	const status: "idle" | "valid" | "accepted" | "expired" | "needs-refresh" =
		polledStatus && polledStatus !== "needs-refresh"
			? polledStatus
			: tokenData && !generateMutation.isPending && !generateMutation.isError
				? "valid"
				: "idle";

	// isLoading covers both initial generation and in-progress mutation (regen/retry).
	const isLoading = generateMutation.isPending;

	// Expose both mutation errors and status-query errors so the UI can react.
	const error = generateMutation.isError
		? "Failed to generate QR code. Please try again."
		: statusQuery.isError
			? "Could not check invite status. Please try again."
			: null;

	return {
		startSession: () => {
			generationEpochRef.current += 1;
			startSession(generationEpochRef.current);
		},
		resetSession,
		retry,
		token: tokenData?.token ?? null,
		shareUrl: tokenData?.shareUrl ?? null,
		status,
		isLoading,
		error,
	};
}
