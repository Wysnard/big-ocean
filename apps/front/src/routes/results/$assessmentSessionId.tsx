import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import type { FacetName, TraitName } from "@workspace/domain";
import { Button } from "@workspace/ui/components/button";
import { Schema as S } from "effect";
import { BookOpen, Loader2, MessageCircle, X } from "lucide-react";
import { startTransition, useCallback, useEffect, useMemo, useState } from "react";
import { ResultsAuthGate } from "@/components/ResultsAuthGate";
import { ConversationTranscript } from "@/components/results/ConversationTranscript";
import { DetailZone } from "@/components/results/DetailZone";
import { EvidencePanel, type HighlightRange } from "@/components/results/EvidencePanel";
import { PortraitReadingView } from "@/components/results/PortraitReadingView";
import { ProfileView } from "@/components/results/ProfileView";
import { QuickActionsCard } from "@/components/results/QuickActionsCard";
import { RelationshipCreditsSection } from "@/components/results/RelationshipCreditsSection";
import { ShareProfileSection } from "@/components/results/ShareProfileSection";
import { useTraitEvidence } from "@/components/results/useTraitEvidence";
import { ArchetypeShareCard } from "@/components/sharing/archetype-share-card";
import {
	getResultsQueryOptions,
	isAssessmentApiError,
	useConversationTranscript,
	useGetResults,
} from "@/hooks/use-assessment";
import { useAuth } from "@/hooks/use-auth";
import { useFacetEvidence } from "@/hooks/use-evidence";
import { useToggleVisibility } from "@/hooks/use-profile";
import { usePortraitStatus } from "@/hooks/usePortraitStatus";
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
	return (
		<div className="min-h-screen bg-background flex items-center justify-center">
			<div className="text-center">
				<Loader2 className="h-12 w-12 motion-safe:animate-spin text-primary mx-auto mb-4" />
				<p className="text-muted-foreground">Loading your results...</p>
			</div>
		</div>
	);
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

	// Story 13.3: Poll portrait status when authenticated
	const { data: portraitStatusData, refetch: refetchPortraitStatus } = usePortraitStatus(
		canLoadResults ? assessmentSessionId : "",
	);

	const [isGateExpired, setIsGateExpired] = useState(false);
	const [shareState, setShareState] = useState<{
		publicProfileId: string;
		shareableUrl: string;
		isPublic: boolean;
	} | null>(null);
	const [copied, setCopied] = useState(false);

	// Trait selection state
	const [selectedTrait, setSelectedTrait] = useState<TraitName | null>(null);

	// Story 12.2: Evidence highlighting state
	const [selectedFacet, setSelectedFacet] = useState<FacetName | null>(null);
	const [scrollToMessageId, setScrollToMessageId] = useState<string | null>(null);
	const [showTranscript, setShowTranscript] = useState(false);
	const [activeHighlight, setActiveHighlight] = useState<{
		messageId: string;
		range: HighlightRange;
		color: string;
		confidence: number;
	} | null>(null);

	// Transcript data
	const { data: transcriptData } = useConversationTranscript(
		assessmentSessionId,
		canLoadResults && showTranscript,
	);

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

	const handleCopyLink = async () => {
		if (!shareState) return;
		try {
			await navigator.clipboard.writeText(shareState.shareableUrl);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			const textarea = document.createElement("textarea");
			textarea.value = shareState.shareableUrl;
			document.body.appendChild(textarea);
			textarea.select();
			document.execCommand("copy");
			document.body.removeChild(textarea);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		}
	};

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

	// Story 12.2: Jump to message in transcript
	const handleJumpToMessage = useCallback(
		(messageId: string, range: HighlightRange, color: string, confidence: number) => {
			setShowTranscript(true);
			setScrollToMessageId(messageId);
			setActiveHighlight({ messageId, range, color, confidence });
		},
		[],
	);

	const handleScrollComplete = useCallback(() => {
		setScrollToMessageId(null);
		// Clear highlight after brief delay so user can see it
		setTimeout(() => setActiveHighlight(null), 2000);
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

	// Story 7.18 + 13.3: Portrait-first reading view
	// Use full portrait content when available, fall back to teaser personalDescription
	const portraitContentForReading =
		portraitStatusData?.portrait?.content ?? results.personalDescription;
	if (view === "portrait" && portraitContentForReading) {
		return (
			<PortraitReadingView
				personalDescription={portraitContentForReading}
				onViewFullProfile={() =>
					navigate({
						to: "/results/$assessmentSessionId",
						params: { assessmentSessionId },
						search: {},
					})
				}
			/>
		);
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
				personalDescription={results.personalDescription}
				fullPortraitContent={portraitStatusData?.portrait?.content}
				fullPortraitStatus={portraitStatusData?.status}
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
									onJumpToMessage={handleJumpToMessage}
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
							copied={copied}
							isTogglePending={toggleVisibility.isPending}
							onCopyLink={handleCopyLink}
							onToggleVisibility={handleToggleVisibility}
						/>

						<RelationshipCreditsSection />

						{shareState?.publicProfileId && (
							<ArchetypeShareCard
								publicProfileId={shareState.publicProfileId}
								archetypeName={results.archetypeName}
							/>
						)}

						{/* Action CTAs — full-width */}
						<div className="col-span-full flex flex-wrap justify-center gap-3 py-4">
							{/* Show "Read portrait" button if teaser OR full portrait content is available */}
							{(results.personalDescription || portraitStatusData?.portrait?.content) && (
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
							<Button
								data-testid="results-view-conversation"
								variant="outline"
								className="min-h-11"
								onClick={() => setShowTranscript((prev) => !prev)}
							>
								<MessageCircle className="w-4 h-4 mr-2" />
								{showTranscript ? "Hide Conversation" : "View Conversation"}
							</Button>
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

			{/* Story 12.2: Conversation transcript side panel */}
			{showTranscript && (
				<>
					{/* Mobile: full-screen overlay */}
					<button
						type="button"
						tabIndex={0}
						className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
						onClick={() => setShowTranscript(false)}
						onKeyDown={(e) => {
							if (e.key === "Escape" || e.key === "Enter") setShowTranscript(false);
						}}
					/>
					<div
						data-testid="transcript-panel"
						className="fixed right-0 top-0 z-50 h-full w-full max-w-md bg-card border-l shadow-xl motion-safe:animate-in motion-safe:slide-in-from-right"
					>
						<div className="flex items-center justify-between border-b px-4 py-3">
							<h3 className="text-sm font-semibold text-foreground">Conversation Transcript</h3>
							<button
								type="button"
								onClick={() => setShowTranscript(false)}
								className="rounded-full p-1.5 hover:bg-muted motion-safe:transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
								aria-label="Close transcript"
							>
								<X className="w-4 h-4 text-muted-foreground" />
							</button>
						</div>
						{transcriptData?.messages ? (
							<ConversationTranscript
								messages={transcriptData.messages.map((m) => ({
									...m,
									timestamp: String(m.timestamp),
								}))}
								scrollToMessageId={scrollToMessageId}
								activeHighlight={activeHighlight}
								onScrollComplete={handleScrollComplete}
							/>
						) : (
							<div className="flex items-center justify-center h-32">
								<Loader2 className="h-6 w-6 motion-safe:animate-spin text-muted-foreground" />
							</div>
						)}
					</div>
				</>
			)}
		</>
	);
}
