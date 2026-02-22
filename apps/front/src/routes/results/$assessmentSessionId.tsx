import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import type { FacetName, TraitName } from "@workspace/domain";
import { Button } from "@workspace/ui/components/button";
import { Schema as S } from "effect";
import { BookOpen, Loader2, MessageCircle } from "lucide-react";
import { startTransition, useCallback, useEffect, useMemo, useState } from "react";
import { ResultsAuthGate } from "@/components/ResultsAuthGate";
import { DetailZone } from "@/components/results/DetailZone";
import { PortraitReadingView } from "@/components/results/PortraitReadingView";
import { ProfileView } from "@/components/results/ProfileView";
import { QuickActionsCard } from "@/components/results/QuickActionsCard";
import { ShareProfileSection } from "@/components/results/ShareProfileSection";
import { useTraitEvidence } from "@/components/results/useTraitEvidence";
import {
	getResultsQueryOptions,
	isAssessmentApiError,
	useGetResults,
} from "@/hooks/use-assessment";
import { useAuth } from "@/hooks/use-auth";
import { useToggleVisibility } from "@/hooks/use-profile";
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

	const [isGateExpired, setIsGateExpired] = useState(false);
	const [shareState, setShareState] = useState<{
		publicProfileId: string;
		shareableUrl: string;
		isPublic: boolean;
	} | null>(null);
	const [copied, setCopied] = useState(false);

	// Trait selection state
	const [selectedTrait, setSelectedTrait] = useState<TraitName | null>(null);

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

	// Story 7.18: Portrait-first reading view
	if (view === "portrait" && results.personalDescription) {
		return (
			<PortraitReadingView
				personalDescription={results.personalDescription}
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
			selectedTrait={selectedTrait}
			messageCount={results.messageCount}
			detailZone={
				selectedTraitData && (
					<DetailZone
						trait={selectedTraitData}
						facetDetails={facetDetails ?? []}
						isOpen={!!selectedTrait}
						onClose={handleCloseDetailZone}
						isLoading={evidenceLoading}
					/>
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

					{/* Action CTAs — full-width */}
					<div className="col-span-full flex flex-wrap justify-center gap-3 py-4">
						{results.personalDescription && (
							<Button
								data-testid="results-read-portrait"
								asChild
								variant="outline"
								className="min-h-11"
							>
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
	);
}
