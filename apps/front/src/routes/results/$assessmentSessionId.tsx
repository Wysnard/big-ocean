import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import type { FacetName, TraitName } from "@workspace/domain";
import { Button } from "@workspace/ui/components/button";
import { useTheme } from "@workspace/ui/hooks/use-theme";
import { Schema as S } from "effect";
import { BookOpen, Loader2, MessageCircle } from "lucide-react";
import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FinalizationWaitScreen } from "@/components/finalization-wait-screen";
import { ResultsAuthGate } from "@/components/ResultsAuthGate";
import { RelationshipAnalysesList } from "@/components/relationship/RelationshipAnalysesList";
import { RelationshipCard } from "@/components/relationship/RelationshipCard";
import { DetailZone } from "@/components/results/DetailZone";
import { EvidencePanel } from "@/components/results/EvidencePanel";
import { PortraitReadingView } from "@/components/results/PortraitReadingView";
import { ProfileView } from "@/components/results/ProfileView";
import { PwywModal } from "@/components/results/PwywModal";
import { QuickActionsCard } from "@/components/results/QuickActionsCard";
import { RelationshipCreditsSection } from "@/components/results/RelationshipCreditsSection";
import { ShareProfileSection } from "@/components/results/ShareProfileSection";
import { useTraitEvidence } from "@/components/results/useTraitEvidence";
import { ArchetypeShareCard } from "@/components/sharing/archetype-share-card";
import {
	getResultsQueryOptions,
	isAssessmentApiError,
	useGetResults,
} from "@/hooks/use-assessment";
import { useAuth } from "@/hooks/use-auth";
import { useFacetEvidence } from "@/hooks/use-evidence";
import { useToggleVisibility } from "@/hooks/use-profile";
import { useShareFlow } from "@/hooks/use-share-flow";
import { usePortraitStatus } from "@/hooks/usePortraitStatus";
import { createThemedCheckoutEmbed } from "@/lib/polar-checkout";
import {
	clearPendingResultsGateSession,
	persistPendingResultsGateSession,
	readPendingResultsGateSession,
} from "@/lib/results-auth-gate-storage";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

/** Server function that checks auth by forwarding cookies from the incoming request */
const checkAuthSession = createServerFn({ method: "GET" }).handler(async () => {
	try {
		const cookie = getRequestHeader("cookie") ?? "";
		const response = await fetch(`${API_URL}/api/auth/get-session`, {
			headers: { "Content-Type": "application/json", cookie },
		});
		if (!response.ok) return { isAuthenticated: false as const };
		const session = await response.json();
		return { isAuthenticated: !!session?.session?.id };
	} catch {
		return { isAuthenticated: false as const };
	}
});

const SessionResultsSearchParams = S.Struct({
	view: S.optional(S.String),
});

export const Route = createFileRoute("/results/$assessmentSessionId")({
	validateSearch: (search) => S.decodeUnknownSync(SessionResultsSearchParams)(search),
	beforeLoad: async () => {
		try {
			return await checkAuthSession();
		} catch {
			return { isAuthenticated: false };
		}
	},
	loader: async ({ params, context }) => {
		if (!context.isAuthenticated) return;
		try {
			await context.queryClient.ensureQueryData(getResultsQueryOptions(params.assessmentSessionId));
		} catch {
			// Graceful degradation: client-side useGetResults will retry
		}
	},
	pendingComponent: ResultsLoading,
	component: ResultsSessionPage,
});

function ResultsLoading() {
	return <FinalizationWaitScreen status="analyzing" progress={20} />;
}

/** Determine the dominant (highest-scoring) trait from results */
function getDominantTrait(traits: readonly { name: TraitName; score: number }[]): TraitName {
	if (traits.length === 0) return "openness";
	const sorted = [...traits].sort((a, b) => b.score - a.score);
	return sorted[0].name;
}

function ResultsSessionPage() {
	const { assessmentSessionId } = Route.useParams();
	const { view } = Route.useSearch();
	const navigate = useNavigate();
	const { isAuthenticated, isPending: isAuthPending } = useAuth();
	const canLoadResults = isAuthenticated && !isAuthPending;
	const { data: results, isLoading, error } = useGetResults(assessmentSessionId, canLoadResults);
	const isNotFoundError = (value: unknown): boolean => {
		if (isAssessmentApiError(value)) {
			return value.status === 404;
		}

		if (typeof value === "object" && value !== null && "status" in value) {
			const status = (value as { status?: unknown }).status;
			if (status === 404) {
				return true;
			}
		}

		if (value instanceof Error) {
			return value.message.includes("404") || value.message.includes("SessionNotFound");
		}

		return false;
	};

	const shouldRedirectDeniedSession = isAuthenticated && error != null && isNotFoundError(error);
	const toggleVisibility = useToggleVisibility();

	// Story 12.3: Track whether we're waiting for portrait unlock after checkout
	const [waitingForUnlock, setWaitingForUnlock] = useState(false);

	// Story 13.3: Poll portrait status when authenticated
	const { data: portraitStatusData, refetch: refetchPortraitStatus } = usePortraitStatus(
		canLoadResults ? assessmentSessionId : "",
		{ waitingForUnlock },
	);

	// Stop waiting once full portrait is ready
	useEffect(() => {
		if (waitingForUnlock && portraitStatusData?.status === "ready") {
			setWaitingForUnlock(false);
		}
	}, [waitingForUnlock, portraitStatusData?.status]);

	// Story 3.4: PWYW modal state
	const [showPwywModal, setShowPwywModal] = useState(false);
	const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
	const { appTheme } = useTheme();
	const pwywAutoOpenRef = useRef(false);

	// Story 3.4: Auto-open PWYW modal ~2.5s after first visit when portrait not unlocked
	useEffect(() => {
		if (!canLoadResults || !results) return;
		if (pwywAutoOpenRef.current) return;

		const portraitStatus = portraitStatusData?.status;
		// Don't auto-open if portrait is already unlocked, generating, or failed
		if (portraitStatus === "ready" || portraitStatus === "generating" || portraitStatus === "failed")
			return;

		// Check sessionStorage to avoid re-opening on page refresh
		const storageKey = `pwyw-modal-shown-${assessmentSessionId}`;
		if (typeof window !== "undefined" && sessionStorage.getItem(storageKey)) return;

		const timer = setTimeout(() => {
			pwywAutoOpenRef.current = true;
			setShowPwywModal(true);
			if (typeof window !== "undefined") {
				sessionStorage.setItem(storageKey, "1");
			}
		}, 2500);

		return () => clearTimeout(timer);
	}, [canLoadResults, results, portraitStatusData?.status, assessmentSessionId]);

	// Story 3.4: Handle Polar checkout for portrait unlock
	const handlePwywCheckout = useCallback(async () => {
		setIsCheckoutLoading(true);
		try {
			const checkout = await createThemedCheckoutEmbed("portrait-unlock", appTheme);
			// Hide our modal so it doesn't show behind the Polar checkout overlay
			setShowPwywModal(false);
			setIsCheckoutLoading(false);
			checkout.addEventListener("success", (event) => {
				event.preventDefault();
				setWaitingForUnlock(true);
			});
			checkout.addEventListener("close", () => {
				// User dismissed Polar checkout — they already read the founder's letter,
				// so land them on results page with the inline "Unlock" button visible
			});
		} catch {
			setIsCheckoutLoading(false);
		}
	}, [appTheme]);

	// Story 3.4: Callback to reopen PWYW modal from the unlock CTA button
	const handleUnlockPortrait = useCallback(() => {
		setShowPwywModal(true);
	}, []);

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
		assessmentSessionId,
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
		assessmentSessionId,
		selectedTrait,
		facetScoreMap,
		facetConfidenceMap,
		canLoadResults,
	);

	// Track 24-hour auth-gate session persistence
	useEffect(() => {
		if (isAuthenticated) {
			clearPendingResultsGateSession(assessmentSessionId);
			setIsGateExpired(false);
			return;
		}

		const pending = readPendingResultsGateSession();
		if (pending && pending.sessionId === assessmentSessionId) {
			setIsGateExpired(pending.expired);
			return;
		}

		persistPendingResultsGateSession(assessmentSessionId);
		setIsGateExpired(false);
	}, [isAuthenticated, assessmentSessionId]);

	useEffect(() => {
		if (!shouldRedirectDeniedSession) {
			return;
		}

		void navigate({ to: "/404" });
	}, [navigate, shouldRedirectDeniedSession]);

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
	const handleFacetClick = useCallback((facetName: FacetName) => {
		setSelectedFacet((prev) => (prev === facetName ? null : facetName));
	}, []);

	const handleCloseEvidencePanel = useCallback(() => {
		setSelectedFacet(null);
	}, []);

	const handleAuthSuccess = () => {
		clearPendingResultsGateSession(assessmentSessionId);
		void navigate({
			to: "/results/$assessmentSessionId",
			params: { assessmentSessionId: assessmentSessionId },
			replace: true,
		});
	};

	const handleStartFresh = () => {
		clearPendingResultsGateSession();
		void navigate({ to: "/chat", search: { sessionId: undefined } });
	};

	// Story 7.18 + 13.3: Back to profile from reading view
	const handleBackToProfile = useCallback(
		() =>
			navigate({
				to: "/results/$assessmentSessionId",
				params: { assessmentSessionId },
				search: {},
			}),
		[navigate, assessmentSessionId],
	);

	if (isAuthPending) {
		return (
			<div className="min-h-[calc(100dvh-3.5rem)] bg-background flex items-center justify-center px-6">
				<div className="text-center">
					<Loader2 className="h-10 w-10 motion-safe:animate-spin text-primary mx-auto mb-3" />
					<p className="text-sm text-muted-foreground">Checking your session...</p>
				</div>
			</div>
		);
	}

	if (!isAuthenticated) {
		return (
			<ResultsAuthGate
				sessionId={assessmentSessionId}
				expired={isGateExpired}
				onAuthSuccess={handleAuthSuccess}
				onStartFresh={handleStartFresh}
			/>
		);
	}

	if (isLoading) {
		return <ResultsLoading />;
	}

	if (shouldRedirectDeniedSession) {
		return null;
	}

	if (error || !results) {
		return (
			<div className="min-h-screen bg-background flex items-center justify-center px-6">
				<div className="text-center">
					<h1 className="text-2xl font-bold text-foreground mb-4">Could Not Load Results</h1>
					<p className="text-muted-foreground mb-6">
						{error?.message || "Your assessment may not be complete yet."}
					</p>
					<Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
						<Link to="/chat" search={{ sessionId: assessmentSessionId }}>
							<MessageCircle className="w-4 h-4 mr-2" />
							Continue Assessment
						</Link>
					</Button>
				</div>
			</div>
		);
	}

	const dominantTrait = getDominantTrait(results.traits);
	const selectedTraitData = selectedTrait
		? results.traits.find((t) => t.name === selectedTrait)
		: null;

	if (view === "portrait") {
		// Full portrait available → full reading view
		const fullContent = portraitStatusData?.portrait?.content;
		if (fullContent) {
			return <PortraitReadingView content={fullContent} onViewFullProfile={handleBackToProfile} />;
		}
	}

	return (
		<>
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
				fullPortraitStatus={portraitStatusData?.status}
				onRetryPortrait={() => void refetchPortraitStatus()}
				onUnlockPortrait={
					portraitStatusData?.status !== "ready" &&
					portraitStatusData?.status !== "generating" &&
					portraitStatusData?.status !== "failed"
						? handleUnlockPortrait
						: undefined
				}
				selectedTrait={selectedTrait}
				messageCount={results.messageCount}
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
								/>
							)}
						</>
					)
				}
				quickActions={
					<QuickActionsCard
						sessionId={assessmentSessionId}
						publicProfileId={shareState?.publicProfileId}
					/>
				}
			>
				{/* Grid children: Share + Continue Chat */}
				<div className="mx-auto max-w-[1120px] px-5 pb-10">
					<div className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-5">
						<ShareProfileSection
							shareState={shareState}
							copied={shareFlow.copied}
							isTogglePending={toggleVisibility.isPending}
							onToggleVisibility={handleToggleVisibility}
							onShareAction={() => void shareFlow.initiateShare()}
							promptNeeded={shareFlow.promptNeeded}
							onAcceptPrompt={() => void shareFlow.acceptAndShare()}
							onDeclinePrompt={shareFlow.declineShare}
							isShareToggling={shareFlow.isToggling}
						/>

						<RelationshipCard />
						<RelationshipAnalysesList />
						<RelationshipCreditsSection />

						{shareState?.publicProfileId && (
							<ArchetypeShareCard
								publicProfileId={shareState.publicProfileId}
								archetypeName={results.archetypeName}
							/>
						)}

						{/* Action CTAs — full-width */}
						<div className="col-span-full flex flex-wrap justify-center gap-3 py-4">
							{/* Show "Read portrait" button if full portrait content is available */}
							{portraitStatusData?.portrait?.content && (
								<Button data-testid="results-read-portrait" asChild variant="outline" className="min-h-11">
									<Link
										to="/results/$assessmentSessionId"
										params={{ assessmentSessionId }}
										search={{ view: "portrait" }}
									>
										<BookOpen className="w-4 h-4 mr-2" />
										Read your portrait again
									</Link>
								</Button>
							)}
							<Button data-testid="results-continue-chat" asChild variant="outline" className="min-h-11">
								<Link to="/chat" search={{ sessionId: assessmentSessionId }}>
									<MessageCircle className="w-4 h-4 mr-2" />
									Continue Chat
								</Link>
							</Button>
						</div>
					</div>
				</div>
			</ProfileView>

			{/* Story 3.4: PWYW Modal */}
			<PwywModal
				open={showPwywModal}
				onOpenChange={setShowPwywModal}
				onCheckout={() => void handlePwywCheckout()}
				isCheckoutLoading={isCheckoutLoading}
			/>
		</>
	);
}
