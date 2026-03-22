/**
 * useQrAccept Hook (Story 34-3, updated Story 35-1)
 *
 * Manages the accept/refuse flow for QR token accept screen.
 * Uses TanStack Query mutations for accept and refuse actions.
 * After acceptance, navigates to the ritual screen before the analysis.
 */

import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useCallback } from "react";
import { acceptToken, fetchTokenDetails, refuseToken } from "@/lib/qr-token-api";

export function useQrAccept(token: string) {
	const navigate = useNavigate();

	const detailsQuery = useQuery({
		queryKey: ["qr-token", "details", token],
		queryFn: () => fetchTokenDetails(token),
		retry: 1,
		staleTime: 30_000,
	});

	const acceptMutation = useMutation({
		mutationKey: ["qr-token", "accept", token],
		mutationFn: () => acceptToken(token),
		onSuccess: (data) => {
			void navigate({
				to: "/relationship/$analysisId/ritual",
				params: { analysisId: data.analysisId },
			});
		},
	});

	const refuseMutation = useMutation({
		mutationKey: ["qr-token", "refuse", token],
		mutationFn: () => refuseToken(token),
		onSuccess: () => {
			void navigate({ to: "/" });
		},
	});

	const handleAccept = useCallback(() => {
		acceptMutation.mutate();
	}, [acceptMutation]);

	const handleRefuse = useCallback(() => {
		refuseMutation.mutate();
	}, [refuseMutation]);

	return {
		details: detailsQuery.data ?? null,
		isLoading: detailsQuery.isLoading,
		error: detailsQuery.error,
		handleAccept,
		handleRefuse,
		isAccepting: acceptMutation.isPending,
		isRefusing: refuseMutation.isPending,
		acceptError: acceptMutation.error,
		refuseError: refuseMutation.error,
	};
}
