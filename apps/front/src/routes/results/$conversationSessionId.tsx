import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import type { FacetName, TraitName } from "@workspace/domain";
import { Button } from "@workspace/ui/components/button";
import { Schema as S } from "effect";
import { BookOpen, Loader2, MessageCircle } from "lucide-react";
import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FinalizationWaitScreen } from "@/components/finalization-wait-screen";
import { NotFound } from "@/components/NotFound";
import { PageMain } from "@/components/PageMain";
import { ResultsAuthGate } from "@/components/ResultsAuthGate";
import { RelationshipAnalysesList } from "@/components/relationship/RelationshipAnalysesList";
import { RelationshipCard } from "@/components/relationship/RelationshipCard";
import { DetailZone } from "@/components/results/DetailZone";
import { EvidencePanel } from "@/components/results/EvidencePanel";
import { PortraitReadingView } from "@/components/results/PortraitReadingView";
import { ProfileView } from "@/components/results/ProfileView";
import { ShareProfileSection } from "@/components/results/ShareProfileSection";
import { useTraitEvidence } from "@/components/results/useTraitEvidence";
import { ArchetypeShareCard } from "@/components/sharing/archetype-share-card";
import { useAuth } from "@/hooks/use-auth";
import {
	getResultsQueryOptions,
	isConversationApiError,
	useGetResults,
} from "@/hooks/use-conversation";
import { useFacetEvidence } from "@/hooks/use-evidence";
import { useToggleVisibility } from "@/hooks/use-profile";
import { useShareFlow } from "@/hooks/use-share-flow";
import { usePortraitStatus } from "@/hooks/usePortraitStatus";
import { getSession } from "@/lib/auth-client";
import {
	clearPendingResultsGateSession,
	persistPendingResultsGateSession,
	readPendingResultsGateSession,
} from "@/lib/results-auth-gate-storage";

const SessionResultsSearchParams = S.Struct({
	view: S.optional(S.String),
});

export const Route = createFileRoute("/results/$conversationSessionId")({
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
		try {
			await context.queryClient.ensureQueryData(getResultsQueryOptions(params.conversationSessionId));
		} catch (error) {
			if (isConversationApiError(error) && error.status === 404) throw notFound();
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
	const toggleVisibility = useToggleVisibility();

	// Story 13.3: Poll portrait status when authenticated
	const { data: portraitStatusData, refetch: refetchPortraitStatus } = usePortraitStatus(
		canLoadResults ? conversationSessionId : "",
	);

	const portraitStatus = portraitStatusData?.status;

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

	const handleAuthSuccess = () => {
		clearPendingResultsGateSession(conversationSessionId);
		void navigate({
			to: "/results/$conversationSessionId",
			params: { conversationSessionId: conversationSessionId },
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
				to: "/results/$conversationSessionId",
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
					sessionId={conversationSessionId}
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

	if (view === "portrait") {
		// Full portrait available → full reading view
		const fullContent = portraitStatusData?.portrait?.content;
		if (fullContent) {
			return (
				<PageMain className="bg-background">
					<PortraitReadingView content={fullContent} onViewFullProfile={handleBackToProfile} />
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
				onRetryPortrait={() => void refetchPortraitStatus()}
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
										to="/results/$conversationSessionId"
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
				</div>
			</ProfileView>
		</PageMain>
	);
}
