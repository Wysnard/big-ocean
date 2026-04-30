import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import type { FacetName, TraitName } from "@workspace/domain";
import { Button } from "@workspace/ui/components/button";
import { Effect, Schema as S } from "effect";
import { BookOpen, Loader2, MessageCircle, RefreshCw } from "lucide-react";
import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { FinalizationWaitScreen } from "@/components/finalization-wait-screen";
import { ReturnSeedSection } from "@/components/me/ReturnSeedSection";
import { NotFound } from "@/components/NotFound";
import { PageMain } from "@/components/PageMain";
import { ResultsAuthGate } from "@/components/ResultsAuthGate";
import { RelationshipAnalysesList } from "@/components/relationship/RelationshipAnalysesList";
import { RelationshipCard } from "@/components/relationship/RelationshipCard";
import { DetailZone } from "@/components/results/DetailZone";
import { EvidencePanel } from "@/components/results/EvidencePanel";
import { PortraitGeneratingState } from "@/components/results/PortraitGeneratingState";
import { PortraitReadingView } from "@/components/results/PortraitReadingView";
import { ProfileView } from "@/components/results/ProfileView";
import { ShareProfileSection } from "@/components/results/ShareProfileSection";
import { useTraitEvidence } from "@/components/results/useTraitEvidence";
import { ArchetypeShareCard } from "@/components/sharing/archetype-share-card";
import {
	completeFirstVisit,
	fetchFirstVisitState,
	scheduleFirstDailyPrompt,
} from "@/hooks/use-account";
import { useActivateExtension } from "@/hooks/use-activate-extension";
import { useAuth } from "@/hooks/use-auth";
import {
	generateResultsForSession,
	getResultsQueryOptions,
	isConversationApiError,
	useGetResults,
} from "@/hooks/use-conversation";
import { useFacetEvidence } from "@/hooks/use-evidence";
import { useToggleVisibility } from "@/hooks/use-profile";
import { syncPushSubscription } from "@/hooks/use-push-subscription-sync";
import { useShareFlow } from "@/hooks/use-share-flow";
import { useSubscriptionState } from "@/hooks/use-subscription-state";
import { usePortraitStatus } from "@/hooks/usePortraitStatus";
import { makeApiClient } from "@/lib/api-client";
import { getSession } from "@/lib/auth-client";
import {
	clearPendingResultsGateSession,
	persistPendingResultsGateSession,
	readPendingResultsGateSession,
} from "@/lib/results-auth-gate-storage";

const SessionResultsSearchParams = S.Struct({
	view: S.optional(S.String),
});

export const Route = createFileRoute("/me/$conversationSessionId")({
	ssr: false,
	validateSearch: (search) => S.decodeUnknownSync(SessionResultsSearchParams)(search),
	beforeLoad: async () => {
		try {
			const { data: session } = await getSession();
			return { isAuthenticated: !!session?.user };
		} catch {
			return { isAuthenticated: false };
		}
	},
	loader: async ({ params, context }) => {
		if (!context.isAuthenticated) return;
		const queryOptions = getResultsQueryOptions(params.conversationSessionId);
		try {
			await context.queryClient.ensureQueryData(queryOptions);
		} catch (error) {
			if (isConversationApiError(error) && error.status === 404) throw notFound();
			if (isConversationApiError(error) && error.status === 409) {
				try {
					await generateResultsForSession(params.conversationSessionId);
					await context.queryClient.fetchQuery(queryOptions);
				} catch (finalizationError) {
					if (isConversationApiError(finalizationError) && finalizationError.status === 404) {
						throw notFound();
					}
				}
			}
			// Graceful degradation: client-side useGetResults will retry
		}
	},
	notFoundComponent: ResultsNotFound,
	pendingComponent: ResultsLoading,
	component: ResultsSessionPage,
});

function ResultsLoading() {
	return (
		<PageMain title="Loading your results" className="bg-background">
			<FinalizationWaitScreen status="analyzing" progress={20} />
		</PageMain>
	);
}

function ResultsNotFound() {
	const { conversationSessionId } = Route.useParams();
	return (
		<PageMain className="bg-background">
			<NotFound
				title="Assessment not found"
				description={`The assessment session ${conversationSessionId} doesn't exist or you don't have access to it.`}
			/>
		</PageMain>
	);
}

/** Determine the dominant (highest-scoring) trait from results */
function getDominantTrait(traits: readonly { name: TraitName; score: number }[]): TraitName {
	if (traits.length === 0) return "openness";
	const sorted = [...traits].sort((a, b) => b.score - a.score);
	return sorted[0].name;
}

function ResultsSessionPage() {
	const { conversationSessionId } = Route.useParams();
	const { view } = Route.useSearch();
	const navigate = useNavigate();
	const { isAuthenticated, isPending: isAuthPending } = useAuth();
	const canLoadResults = isAuthenticated && !isAuthPending;
	const { data: results, isLoading, error } = useGetResults(conversationSessionId, canLoadResults);
	const subscriptionQueryForExtend = useSubscriptionState(canLoadResults);
	const activateExtensionMutation = useActivateExtension();
	const toggleVisibility = useToggleVisibility();
	const [firstVisitCompleted, setFirstVisitCompleted] = useState<boolean | null>(null);
	const [keepReturnSeedVisible, setKeepReturnSeedVisible] = useState(false);
	const returnSeedCompletionAttemptedRef = useRef(false);

	// Story 13.3: Poll portrait status when authenticated
	const { data: portraitStatusData, isError: isPortraitError } = usePortraitStatus(
		canLoadResults ? conversationSessionId : "",
	);

	const portraitStatus = portraitStatusData?.status;

	// Story 2.4: Retry portrait generation via real endpoint
	const queryClient = useQueryClient();
	const retryPortrait = useMutation({
		mutationKey: ["portrait", "retry", conversationSessionId],
		mutationFn: () =>
			Effect.gen(function* () {
				const client = yield* makeApiClient;
				return yield* client.portrait.retryPortrait({
					path: { sessionId: conversationSessionId },
				});
			}).pipe(Effect.runPromise),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["portraitStatus", conversationSessionId],
			});
		},
	});

	const selectedFacetTriggerRef = useRef<HTMLElement | null>(null);

	const [isGateExpired, setIsGateExpired] = useState(false);
	const [shareState, setShareState] = useState<{
		publicProfileId: string;
		shareableUrl: string;
		isPublic: boolean;
	} | null>(null);

	// Trait selection state
	const [selectedTrait, setSelectedTrait] = useState<TraitName | null>(null);

	// Story 12.2: Evidence highlighting state
	const [selectedFacet, setSelectedFacet] = useState<FacetName | null>(null);

	// Facet evidence for the selected facet (evidence panel)
	const { data: selectedFacetEvidence } = useFacetEvidence(
		conversationSessionId,
		selectedFacet,
		canLoadResults && !!selectedFacet,
	);

	// Build facet score and confidence maps for useTraitEvidence
	const facetScoreMap = useMemo(() => {
		const map = new Map<FacetName, number>();
		if (results) {
			for (const facet of results.facets) {
				map.set(facet.name, facet.score);
			}
		}
		return map;
	}, [results]);

	const facetConfidenceMap = useMemo(() => {
		const map = new Map<FacetName, number>();
		if (results) {
			for (const facet of results.facets) {
				map.set(facet.name, facet.confidence);
			}
		}
		return map;
	}, [results]);

	// Load evidence for selected trait
	const { data: facetDetails, isLoading: evidenceLoading } = useTraitEvidence(
		conversationSessionId,
		selectedTrait,
		facetScoreMap,
		facetConfidenceMap,
		canLoadResults,
	);

	// Track 24-hour auth-gate session persistence
	useEffect(() => {
		if (isAuthenticated) {
			clearPendingResultsGateSession(conversationSessionId);
			setIsGateExpired(false);
			return;
		}

		const pending = readPendingResultsGateSession();
		if (pending && pending.sessionId === conversationSessionId) {
			setIsGateExpired(pending.expired);
			return;
		}

		persistPendingResultsGateSession(conversationSessionId);
		setIsGateExpired(false);
	}, [isAuthenticated, conversationSessionId]);

	useEffect(() => {
		if (!canLoadResults) return;

		let cancelled = false;

		void fetchFirstVisitState()
			.then((state) => {
				if (cancelled) return;
				setFirstVisitCompleted(state.firstVisitCompleted);
				if (!state.firstVisitCompleted) {
					setKeepReturnSeedVisible(true);
				}
			})
			.catch(() => {
				if (!cancelled) {
					setFirstVisitCompleted(true);
				}
			});

		return () => {
			cancelled = true;
		};
	}, [canLoadResults]);

	// Initialize share state from results data (profile created eagerly by backend)
	useEffect(() => {
		if (!results || !isAuthenticated || shareState) return;
		if (results.publicProfileId && results.shareableUrl && results.isPublic !== null) {
			setShareState({
				publicProfileId: results.publicProfileId,
				shareableUrl: results.shareableUrl,
				isPublic: results.isPublic,
			});
		}
	}, [results, isAuthenticated, shareState]);

	// Story 33-3: Share flow with visibility prompt
	const shareFlow = useShareFlow({
		shareState,
		archetypeName: results?.archetypeName ?? "Big Ocean",
		toggleVisibility: (input) => toggleVisibility.mutateAsync(input),
		onShareStateChange: (update) => setShareState((prev) => (prev ? { ...prev, ...update } : null)),
	});

	const handleToggleVisibility = async () => {
		if (!shareState) return;
		try {
			const result = await toggleVisibility.mutateAsync({
				publicProfileId: shareState.publicProfileId,
				isPublic: !shareState.isPublic,
			});
			setShareState((prev) => (prev ? { ...prev, isPublic: result.isPublic } : null));
		} catch {
			// Silently fail - user can retry
		}
	};

	const handleToggleTrait = useCallback((trait: string) => {
		startTransition(() => {
			setSelectedTrait((prev) => (prev === trait ? null : (trait as TraitName)));
		});
	}, []);

	const handleCloseDetailZone = useCallback(() => {
		setSelectedTrait(null);
		setSelectedFacet(null);
	}, []);

	// Story 12.2: Facet click handler — opens evidence panel
	const handleFacetClick = useCallback(
		(facetName: FacetName, triggerElement?: HTMLElement | null) => {
			selectedFacetTriggerRef.current = triggerElement ?? null;
			setSelectedFacet((prev) => (prev === facetName ? null : facetName));
		},
		[],
	);

	const handleCloseEvidencePanel = useCallback(() => {
		setSelectedFacet(null);
	}, []);

	const consumeFirstVisit = useCallback(async () => {
		if (firstVisitCompleted !== false) return;

		await completeFirstVisit();
		setFirstVisitCompleted(true);
	}, [firstVisitCompleted]);

	useEffect(() => {
		if (!results || view === "portrait" || firstVisitCompleted !== false) return;
		if (returnSeedCompletionAttemptedRef.current) return;

		returnSeedCompletionAttemptedRef.current = true;

		void consumeFirstVisit().catch((visitError) => {
			console.warn("Failed to mark first return-seed visit complete", visitError);
			// Do not reset the ref — retrying indefinitely on persistent failure
			// would create an unbounded loop. The user can still interact with the
			// return-seed section, which also calls consumeFirstVisit on accept/decline.
		});
	}, [consumeFirstVisit, firstVisitCompleted, results, view]);

	const handleReturnSeedDecline = useCallback(() => {
		void consumeFirstVisit().catch(() => {
			// Keep the current page usable even if the account update fails.
		});
	}, [consumeFirstVisit]);

	const handleReturnSeedPermissionGranted = useCallback(
		async (scheduledFor: Date) => {
			await consumeFirstVisit().catch(() => {
				// The results page should stay usable even if the visit flag update races.
			});
			await syncPushSubscription({ respectSessionCache: false });
			await scheduleFirstDailyPrompt({ scheduledFor: scheduledFor.toISOString() });
		},
		[consumeFirstVisit],
	);

	const handleAuthSuccess = () => {
		clearPendingResultsGateSession(conversationSessionId);
		void navigate({
			to: "/me/$conversationSessionId",
			params: { conversationSessionId: conversationSessionId },
			replace: true,
		});
	};

	const handleStartFresh = () => {
		clearPendingResultsGateSession();
		void navigate({ to: "/chat", search: { sessionId: undefined } });
	};

	// Story 2.2: Track if user saw generating state for fade-in transition
	const sawGeneratingRef = useRef(false);
	useEffect(() => {
		if (view !== "portrait") {
			sawGeneratingRef.current = false;
			return;
		}
		if (portraitStatus === "generating") {
			sawGeneratingRef.current = true;
		}
	}, [view, portraitStatus]);

	// Story 7.18 + 13.3: Back to profile from reading view
	const handleBackToProfile = useCallback(
		() =>
			navigate({
				to: "/me/$conversationSessionId",
				params: { conversationSessionId },
				search: {},
			}),
		[navigate, conversationSessionId],
	);

	if (isAuthPending) {
		return (
			<PageMain
				title="Checking your session"
				className="min-h-[calc(100dvh-3.5rem)] bg-background flex items-center justify-center px-6"
			>
				<div className="text-center">
					<Loader2 className="h-10 w-10 motion-safe:animate-spin text-primary mx-auto mb-3" />
					<p className="text-sm text-muted-foreground">Checking your session...</p>
				</div>
			</PageMain>
		);
	}

	if (!isAuthenticated) {
		return (
			<PageMain className="bg-background">
				<ResultsAuthGate
					expired={isGateExpired}
					onAuthSuccess={handleAuthSuccess}
					onStartFresh={handleStartFresh}
				/>
			</PageMain>
		);
	}

	if (isLoading) {
		return <ResultsLoading />;
	}

	if (error && isConversationApiError(error) && error.status === 404) {
		return (
			<PageMain className="bg-background">
				<NotFound
					title="Assessment not found"
					description={`The assessment session ${conversationSessionId} doesn't exist or you don't have access to it.`}
				/>
			</PageMain>
		);
	}

	if (error || !results) {
		return (
			<PageMain className="min-h-screen bg-background flex items-center justify-center px-6">
				<div className="text-center">
					<h1 className="text-2xl font-bold text-foreground mb-4">Could Not Load Results</h1>
					<p className="text-muted-foreground mb-6">
						{error?.message || "Your assessment may not be complete yet."}
					</p>
					<Button asChild>
						<Link to="/chat" search={{ sessionId: conversationSessionId }}>
							<MessageCircle className="w-4 h-4 mr-2" />
							Continue Assessment
						</Link>
					</Button>
				</div>
			</PageMain>
		);
	}

	const dominantTrait = getDominantTrait(results.traits);
	const selectedTraitData = selectedTrait
		? results.traits.find((t) => t.name === selectedTrait)
		: null;
	const showReturnSeed = keepReturnSeedVisible || firstVisitCompleted === false;

	const showResultsExtensionCta =
		results.isLatestVersion &&
		!subscriptionQueryForExtend.isPending &&
		subscriptionQueryForExtend.data?.isEntitledToConversationExtension === true;

	const handleResultsExtendConversation = () => {
		activateExtensionMutation.mutate(undefined, {
			onSuccess: (data) => {
				void navigate({
					to: "/chat",
					search: { sessionId: data.sessionId },
				});
			},
			onError: (err: unknown) => {
				if (isConversationApiError(err) && err.status === 404) {
					toast.error("No completed assessment is ready to extend yet.");
					return;
				}
				if (isConversationApiError(err) && err.status === 403) {
					toast.error("A subscription is required to extend your conversation.");
					return;
				}
				toast.error(err instanceof Error ? err.message : "Could not start your extension");
			},
		});
	};

	const conversationExtensionStrip = showResultsExtensionCta ? (
		<div
			className="mx-auto max-w-[1120px] border-b border-border/40 bg-depth-surface px-5 pb-6 pt-2"
			data-testid="results-extend-conversation-strip"
		>
			<h2 className="mb-1 text-lg font-medium text-foreground">Go deeper with Nerin</h2>
			<p className="mb-4 max-w-prose text-sm text-muted-foreground">
				Pick up where you left off — 15 more exchanges, one continuing thread.
			</p>
			<Button
				type="button"
				variant="default"
				className="rounded-full"
				data-testid="results-extend-conversation-cta"
				disabled={activateExtensionMutation.isPending}
				onClick={handleResultsExtendConversation}
			>
				{activateExtensionMutation.isPending ? (
					<>
						<Loader2 className="mr-2 h-4 w-4 motion-safe:animate-spin" aria-hidden />
						Starting…
					</>
				) : (
					"Continue conversation"
				)}
			</Button>
		</div>
	) : undefined;

	if (view === "portrait") {
		// Story 2.4: Failed state with retry button
		if (portraitStatus === "failed") {
			return (
				<PageMain className="bg-background">
					<div className="min-h-[calc(100dvh-3.5rem)] bg-background">
						<article className="mx-auto max-w-[65ch] px-6 py-12 sm:py-16">
							<div className="text-center">
								<p className="text-base leading-[1.7] text-foreground/80 mb-8">
									Something went wrong while writing your letter. I'd like to try again — these things
									happen, and your portrait deserves another attempt.
								</p>
								<button
									type="button"
									data-testid="portrait-retry-btn"
									onClick={() => retryPortrait.mutate()}
									disabled={retryPortrait.isPending}
									className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-heading text-base disabled:opacity-50"
								>
									<RefreshCw
										className={`w-4 h-4 ${retryPortrait.isPending ? "motion-safe:animate-spin" : ""}`}
									/>
									{retryPortrait.isPending ? "Retrying..." : "Try again"}
								</button>
								{retryPortrait.isError && (
									<p className="mt-4 text-sm text-muted-foreground">
										That didn't work either. Please try again in a moment.
									</p>
								)}
								<div className="mt-8">
									<button
										type="button"
										onClick={handleBackToProfile}
										className="text-sm text-muted-foreground hover:text-primary transition-colors"
									>
										Back to your profile
									</button>
								</div>
							</div>
						</article>
					</div>
				</PageMain>
			);
		}

		// Full portrait available → full reading view
		const fullContent = portraitStatusData?.portrait?.content;
		if (fullContent) {
			return (
				<PageMain className="bg-background">
					<div
						className={
							sawGeneratingRef.current
								? "motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:duration-500"
								: undefined
						}
					>
						<PortraitReadingView content={fullContent} sessionId={conversationSessionId} />
					</div>
				</PageMain>
			);
		}

		// Story 2.2: Fall back to profile if portrait status is "none" or query errored
		if (portraitStatus === "none" || isPortraitError) {
			// No portrait generation in progress — show profile instead of infinite spinner
			// Falls through to the ProfileView below
		} else {
			// Story 2.2: Generating state (catches generating or initial poll-in-progress)
			return (
				<PageMain className="bg-background">
					<PortraitGeneratingState />
				</PageMain>
			);
		}
	}

	return (
		<PageMain className="bg-depth-surface">
			<ProfileView
				archetypeName={results.archetypeName}
				oceanCode5={results.oceanCode5}
				description={results.archetypeDescription}
				dominantTrait={dominantTrait}
				traits={results.traits}
				facets={results.facets}
				onToggleTrait={handleToggleTrait}
				overallConfidence={results.overallConfidence}
				isCurated={results.isCurated}
				fullPortraitContent={portraitStatusData?.portrait?.content}
				fullPortraitStatus={portraitStatus}
				onRetryPortrait={() => retryPortrait.mutate()}
				selectedTrait={selectedTrait}
				messageCount={results.messageCount}
				conversationExtensionStrip={conversationExtensionStrip}
				detailZone={
					selectedTraitData && (
						<>
							<DetailZone
								trait={selectedTraitData}
								facetDetails={facetDetails ?? []}
								isOpen={!!selectedTrait}
								onClose={handleCloseDetailZone}
								isLoading={evidenceLoading}
								onFacetClick={handleFacetClick}
							/>
							{selectedFacet && selectedFacetEvidence && (
								<EvidencePanel
									facetName={selectedFacet}
									evidence={selectedFacetEvidence}
									onClose={handleCloseEvidencePanel}
									restoreFocusRef={selectedFacetTriggerRef}
								/>
							)}
						</>
					)
				}
			>
				{/* Grid children: share, relationships, and portrait revisit */}
				<div className="mx-auto max-w-[1120px] px-5 pb-10">
					<div className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-5">
						<ShareProfileSection
							shareState={shareState}
							copied={shareFlow.copied}
							isTogglePending={toggleVisibility.isPending}
							onToggleVisibility={handleToggleVisibility}
							onCopyAction={() => void shareFlow.copyLink()}
							onShareAction={() => void shareFlow.initiateShare()}
							promptNeeded={shareFlow.promptNeeded}
							onAcceptPrompt={() => void shareFlow.acceptAndShare()}
							onDeclinePrompt={shareFlow.declineShare}
							isShareToggling={shareFlow.isToggling}
						/>

						<RelationshipCard />
						<RelationshipAnalysesList />

						{shareState?.publicProfileId && (
							<ArchetypeShareCard
								publicProfileId={shareState.publicProfileId}
								archetypeName={results.archetypeName}
							/>
						)}

						{portraitStatusData?.portrait?.content && (
							<div className="col-span-full flex flex-wrap justify-center gap-3 py-4">
								<Button data-testid="results-read-portrait" asChild variant="outline" className="min-h-11">
									<Link
										to="/me/$conversationSessionId"
										params={{ conversationSessionId }}
										search={{ view: "portrait" }}
									>
										<BookOpen className="w-4 h-4 mr-2" />
										Read your portrait again
									</Link>
								</Button>
							</div>
						)}
					</div>

					{showReturnSeed ? (
						<div className="pt-8">
							<ReturnSeedSection
								onPermissionGranted={handleReturnSeedPermissionGranted}
								onDecline={handleReturnSeedDecline}
							/>
						</div>
					) : null}
				</div>
			</ProfileView>
		</PageMain>
	);
}
