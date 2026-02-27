/**
 * Invitation HTTP Hooks (Story 14.3)
 *
 * React hooks for invitation operations using TanStack Query.
 * Uses direct HTTP calls following the same fetchApi pattern as use-assessment.ts.
 */

import { useMutation, useQuery } from "@tanstack/react-query";
import type {
	AcceptInvitationResponse,
	InvitationDetailResponse,
	RefuseInvitationResponse,
} from "@workspace/contracts";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export class InvitationApiError extends Error {
	readonly status: number;
	readonly details: unknown;

	constructor(status: number, message: string, details: unknown) {
		super(message);
		this.name = "InvitationApiError";
		this.status = status;
		this.details = details;
	}
}

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
	const response = await fetch(`${API_URL}${endpoint}`, {
		...options,
		headers: {
			"Content-Type": "application/json",
			...options?.headers,
		},
		credentials: "include",
	});

	if (!response.ok) {
		const error = await response.json().catch(() => null);
		const message =
			typeof error === "object" && error !== null && "message" in error
				? String((error as { message: unknown }).message)
				: `HTTP ${response.status}: ${response.statusText}`;
		throw new InvitationApiError(response.status, message, error);
	}

	return response.json();
}

/**
 * Fetch invitation details by token (public endpoint)
 */
export function useGetInvitationByToken(token: string) {
	return useQuery({
		queryKey: ["invitation", token],
		queryFn: () =>
			fetchApi<InvitationDetailResponse>(`/api/relationship/public/invitations/${token}`),
		retry: false,
	});
}

/**
 * Claim invitation cookie (public endpoint)
 */
export function useClaimInvitation() {
	return useMutation({
		mutationKey: ["invitation", "claim"],
		mutationFn: (token: string) =>
			fetchApi<{ ok: true }>(`/api/relationship/public/invitations/${token}/claim`, {
				method: "POST",
			}),
	});
}

/**
 * Accept invitation (authenticated endpoint)
 */
export function useAcceptInvitation() {
	return useMutation({
		mutationKey: ["invitation", "accept"],
		mutationFn: (token: string) =>
			fetchApi<AcceptInvitationResponse>(`/api/relationship/invitations/${token}/accept`, {
				method: "POST",
			}),
	});
}

/**
 * Refuse invitation (authenticated endpoint)
 */
export function useRefuseInvitation() {
	return useMutation({
		mutationKey: ["invitation", "refuse"],
		mutationFn: (token: string) =>
			fetchApi<RefuseInvitationResponse>(`/api/relationship/invitations/${token}/refuse`, {
				method: "POST",
			}),
	});
}
