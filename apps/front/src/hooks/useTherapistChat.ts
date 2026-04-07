import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { SendMessageRequest } from "@workspace/contracts";
import { Effect } from "effect";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { makeApiClient } from "../lib/api-client";
import { AssessmentApiError, useResumeSession } from "./use-assessment";

interface Message {
	id: string;
	role: "user" | "assistant";
	content: string;
	timestamp: Date;
}

interface TraitScores {
	openness: number;
	conscientiousness: number;
	extraversion: number;
	agreeableness: number;
	neuroticism: number;
}

/** Shape of a single message inside the resume query cache */
interface CacheMessage {
	role: "user" | "assistant";
	content: string;
	timestamp: unknown; // DateTimeUtc — string or { epochMillis }
}

/** Shape of the resume query cache data */
interface ResumeCache {
	messages: CacheMessage[];
	confidence: TraitScores;
	freeTierMessageThreshold: number;
	status: "active" | "paused" | "finalizing" | "completed";
}

/**
 * Parses API error responses into user-friendly messages.
 * Maps known HTTP status codes and error tags to actionable messages.
 */
function parseApiError(error: unknown): {
	message: string;
	type: "session" | "budget" | "rate-limit" | "limit-reached" | "network" | "generic";
} {
	if (error instanceof AssessmentApiError) {
		if (error.status === 403) {
			return {
				message: "You've reached the message limit. View your results!",
				type: "limit-reached",
			};
		}
		if (error.status === 404) {
			return { message: "Session not found. Starting a new session...", type: "session" };
		}
		if (error.status === 503) {
			return {
				message: "Assessment paused — daily budget reached. You can resume tomorrow.",
				type: "budget",
			};
		}
		if (error.status === 429) {
			return {
				message: "You've already started an assessment today. Come back tomorrow!",
				type: "rate-limit",
			};
		}
		if (error.status >= 500) {
			return { message: "Connection lost. Check your internet and try again.", type: "network" };
		}

		return { message: error.message, type: "generic" };
	}

	if (error instanceof Error) {
		const msg = error.message;

		if (msg.includes("404") || msg.includes("SessionNotFound")) {
			return { message: "Session not found. Starting a new session...", type: "session" };
		}
		if (msg.includes("503") || msg.includes("BudgetPaused") || msg.includes("CostLimit")) {
			return {
				message: "Assessment paused — daily budget reached. You can resume tomorrow.",
				type: "budget",
			};
		}
		if (msg.includes("429") || msg.includes("RateLimit")) {
			return {
				message: "You've already started an assessment today. Come back tomorrow!",
				type: "rate-limit",
			};
		}
		if (msg.includes("Failed to fetch") || msg.includes("NetworkError") || msg.includes("ERR_")) {
			return { message: "Connection lost. Check your internet and try again.", type: "network" };
		}

		return { message: msg, type: "generic" };
	}

	return { message: "Something went wrong. Please try again.", type: "generic" };
}

/** Convert a cache message timestamp to a Date */
function toDate(ts: unknown): Date {
	if (ts instanceof Date) return ts;
	if (typeof ts === "string") return new Date(ts);
	if (ts && typeof ts === "object" && "epochMillis" in ts) {
		return new Date((ts as { epochMillis: number }).epochMillis);
	}
	return new Date();
}

/** Map server messages to local Message type */
function mapCacheMessages(cacheMessages: CacheMessage[]): Message[] {
	return cacheMessages.map((msg, index) => ({
		id: `msg-${index}`,
		role: msg.role,
		content: msg.content,
		timestamp: toDate(msg.timestamp),
	}));
}

/**
 * Hook for managing the therapist chat conversation with real API integration.
 *
 * Messages are derived from the React Query cache (single source of truth).
 * Optimistic updates are applied via queryClient.setQueryData; on error the
 * cache is rolled back to the snapshot taken in onMutate.
 */
export function useTherapistChat(sessionId: string) {
	const queryClient = useQueryClient();

	// Story 7.18: Farewell transition state — set by mutation onSuccess or resume derivation
	const [isFarewellReceived, setIsFarewellReceived] = useState(false);

	// Greeting stagger — only for new sessions, controlled by visible count
	const hasStaggeredRef = useRef(false);
	const staggerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const [staggerVisibleCount, setStaggerVisibleCount] = useState<number | null>(null);

	// Session resumption
	const {
		data: resumeData,
		isLoading: isResuming,
		error: resumeError,
	} = useResumeSession(sessionId);
	const isResumeSessionNotFound =
		resumeError instanceof AssessmentApiError
			? resumeError.status === 404
			: resumeError instanceof Error &&
				(resumeError.message.includes("404") || resumeError.message.includes("SessionNotFound"));

	// ── Send message mutation with optimistic cache updates ──────────────

	const sendMessageMutation = useMutation({
		mutationKey: ["assessment", "sendMessage"],
		mutationFn: (input: SendMessageRequest) =>
			Effect.gen(function* () {
				const client = yield* makeApiClient;
				return yield* client.assessment.sendMessage({ payload: input });
			}).pipe(Effect.runPromise),

		onMutate: async ({ message }) => {
			// Flush stagger immediately when user sends during greeting
			if (staggerVisibleCount !== null) {
				setStaggerVisibleCount(null);
				if (staggerTimerRef.current) {
					clearTimeout(staggerTimerRef.current);
					staggerTimerRef.current = null;
				}
			}

			// Cancel in-flight resume refetches so they can't overwrite optimistic data
			const queryKey = ["assessment", "session", sessionId];
			await queryClient.cancelQueries({ queryKey });

			// Snapshot for rollback
			const previousData = queryClient.getQueryData<ResumeCache>(queryKey);

			// Optimistic update: append user message to the query cache
			queryClient.setQueryData<ResumeCache>(queryKey, (old) => {
				if (!old) return old;
				return {
					...old,
					messages: [
						...old.messages,
						{ role: "user" as const, content: message, timestamp: new Date().toISOString() },
					],
				};
			});

			return { previousData };
		},

		onSuccess: (data) => {
			// Append assistant response(s) to the query cache
			queryClient.setQueryData<ResumeCache>(["assessment", "session", sessionId], (old) => {
				if (!old) return old;
				const newMessages: CacheMessage[] = [
					{
						role: "assistant" as const,
						content: data.response,
						timestamp: new Date().toISOString(),
					},
				];

				// Beat 2: Surfacing message (only on final turn)
				if (data.surfacingMessage) {
					newMessages.push({
						role: "assistant" as const,
						content: data.surfacingMessage,
						timestamp: new Date().toISOString(),
					});
				}

				return { ...old, messages: [...old.messages, ...newMessages] };
			});

			// Story 7.18: Handle final turn — trigger farewell transition
			if (data.isFinalTurn) {
				setIsFarewellReceived(true);
			}
		},

		onError: (error, variables, context) => {
			// Roll back to pre-mutation cache snapshot
			if (context?.previousData) {
				queryClient.setQueryData(["assessment", "session", sessionId], context.previousData);
			}

			const parsed = parseApiError(error);
			const isRetryable = parsed.type === "network" || parsed.type === "generic";
			const isPersistent = parsed.type === "budget" || parsed.type === "rate-limit";

			toast.error(parsed.message, {
				duration: isPersistent ? Number.POSITIVE_INFINITY : 5000,
				action: isRetryable
					? {
							label: "Retry",
							onClick: () => sendMessageMutation.mutate(variables),
						}
					: undefined,
			});
		},

		onSettled: () => {
			// Refetch from server to ensure cache reflects truth
			queryClient.invalidateQueries({ queryKey: ["assessment", "session", sessionId] });
		},
	});

	// ── Derived state from query cache ───────────────────────────────────

	const traits: TraitScores = useMemo(() => {
		if (!resumeData) {
			return { openness: 0, conscientiousness: 0, extraversion: 0, agreeableness: 0, neuroticism: 0 };
		}
		return {
			openness: resumeData.confidence.openness,
			conscientiousness: resumeData.confidence.conscientiousness,
			extraversion: resumeData.confidence.extraversion,
			agreeableness: resumeData.confidence.agreeableness,
			neuroticism: resumeData.confidence.neuroticism,
		};
	}, [resumeData]);

	// Derive messages from query cache (single source of truth)
	const allMessages: Message[] = useMemo(() => {
		if (!resumeData) return [];
		return mapCacheMessages(resumeData.messages as CacheMessage[]);
	}, [resumeData]);

	// Greeting stagger for new sessions — show messages one at a time
	useEffect(() => {
		if (!resumeData || hasStaggeredRef.current) return;

		const isNewSession =
			resumeData.messages.length === 2 && resumeData.messages.every((m) => m.role === "assistant");

		if (!isNewSession) {
			setStaggerVisibleCount(null);
			return;
		}

		const prefersReducedMotion =
			typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

		if (prefersReducedMotion) {
			setStaggerVisibleCount(null);
			return;
		}

		hasStaggeredRef.current = true;
		setStaggerVisibleCount(1);

		staggerTimerRef.current = setTimeout(() => {
			setStaggerVisibleCount(null);
			staggerTimerRef.current = null;
		}, 800);

		return () => {
			if (staggerTimerRef.current) {
				clearTimeout(staggerTimerRef.current);
				staggerTimerRef.current = null;
			}
		};
	}, [resumeData]);

	// Re-derive farewell state from resumed data (lost on post-auth navigation re-mount)
	useEffect(() => {
		if (!resumeData) return;
		const threshold = resumeData.freeTierMessageThreshold ?? 25;
		const userCount = resumeData.messages.filter((m) => m.role === "user").length;
		if (userCount >= threshold) {
			setIsFarewellReceived(true);
		}
	}, [resumeData]);

	// Apply stagger: limit visible messages for new session greeting
	const messages: Message[] = useMemo(() => {
		if (staggerVisibleCount === null) return allMessages;
		return allMessages.slice(0, staggerVisibleCount);
	}, [allMessages, staggerVisibleCount]);

	// ── Actions ──────────────────────────────────────────────────────────

	const sendMessage = useCallback(
		async (userMessage?: string) => {
			if (!sessionId || !userMessage) return;
			sendMessageMutation.mutate({ sessionId, message: userMessage });
		},
		[sessionId, sendMessageMutation],
	);

	// ── Progress tracking ────────────────────────────────────────────────

	const FREE_TIER_THRESHOLD = resumeData?.freeTierMessageThreshold ?? 25;
	const userMessageCount = messages.filter((m) => m.role === "user").length;
	const progressPercent = Math.min(Math.round((userMessageCount / FREE_TIER_THRESHOLD) * 100), 100);
	const isConfidenceReady = userMessageCount >= FREE_TIER_THRESHOLD;

	return {
		messages,
		traits,
		isLoading: sendMessageMutation.isPending,
		isCompleted: resumeData?.status === "completed",
		sendMessage,
		isResuming,
		resumeError,
		isResumeSessionNotFound,
		isConfidenceReady,
		progressPercent,
		freeTierMessageThreshold: FREE_TIER_THRESHOLD,
		// Story 7.18: Farewell transition state
		isFarewellReceived,
		portraitWaitMinMs: undefined as number | undefined,
	};
}
