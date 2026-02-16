import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import type { FacetName, TraitName } from "@workspace/domain";
import { Button } from "@workspace/ui/components/button";
import { Schema as S } from "effect";
import { Loader2, MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { EvidencePanel } from "@/components/EvidencePanel";
import { WaveDivider } from "@/components/home/WaveDivider";
import { ResultsAuthGate } from "@/components/ResultsAuthGate";
import { ProfileView } from "@/components/results/ProfileView";
import { ShareProfileSection } from "@/components/results/ShareProfileSection";
import type { TraitData } from "@/components/results/TraitScoresSection";
import { isAssessmentApiError, useGetResults } from "@/hooks/use-assessment";
import { useAuth } from "@/hooks/use-auth";
import { useFacetEvidence } from "@/hooks/use-evidence";
import { useShareProfile, useToggleVisibility } from "@/hooks/use-profile";
import {
	clearPendingResultsGateSession,
	persistPendingResultsGateSession,
	readPendingResultsGateSession,
} from "@/lib/results-auth-gate-storage";

const SessionResultsSearchParams = S.Struct({});

export const Route = createFileRoute("/results/$assessmentSessionId")({
	validateSearch: (search) => S.decodeUnknownSync(SessionResultsSearchParams)(search),
	component: ResultsSessionPage,
});

/** Determine the dominant (highest-scoring) trait from results */
function getDominantTrait(traits: readonly { name: TraitName; score: number }[]): TraitName {
	if (traits.length === 0) return "openness";
	const sorted = [...traits].sort((a, b) => b.score - a.score);
	return sorted[0].name;
}

function ResultsSessionPage() {
	const { assessmentSessionId } = Route.useParams();
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
	const shareProfile = useShareProfile();
	const toggleVisibility = useToggleVisibility();

	const [isGateExpired, setIsGateExpired] = useState(false);
	const [shareState, setShareState] = useState<{
		publicProfileId: string;
		shareableUrl: string;
		isPublic: boolean;
	} | null>(null);
	const [copied, setCopied] = useState(false);
	const [shareError, setShareError] = useState<string | null>(null);

	// Evidence panel state
	const [selectedFacet, setSelectedFacet] = useState<FacetName | null>(null);
	const [evidencePanelOpen, setEvidencePanelOpen] = useState(false);

	// Expanded traits state
	const [expandedTraits, setExpandedTraits] = useState<Set<string>>(new Set());

	// Fetch evidence for selected facet
	const { data: facetEvidence, isLoading: evidenceLoading } = useFacetEvidence(
		assessmentSessionId,
		selectedFacet,
		evidencePanelOpen && canLoadResults,
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

	const handleShare = async () => {
		setShareError(null);
		try {
			const result = await shareProfile.mutateAsync(assessmentSessionId);
			setShareState(result);
		} catch (shareErr) {
			setShareError(
				shareErr instanceof Error ? shareErr.message : "Failed to create shareable profile",
			);
		}
	};

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

	const handleViewEvidence = (facetName: FacetName) => {
		setSelectedFacet(facetName);
		setEvidencePanelOpen(true);
	};

	const handleCloseEvidence = () => {
		setEvidencePanelOpen(false);
		setSelectedFacet(null);
	};

	const toggleTrait = (trait: string) => {
		setExpandedTraits((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(trait)) {
				newSet.delete(trait);
			} else {
				newSet.add(trait);
			}
			return newSet;
		});
	};

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
		return (
			<div className="min-h-screen bg-background flex items-center justify-center">
				<div className="text-center">
					<Loader2 className="h-12 w-12 motion-safe:animate-spin text-primary mx-auto mb-4" />
					<p className="text-muted-foreground">Calculating your personality profile...</p>
				</div>
			</div>
		);
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

	return (
		<ProfileView
			archetypeName={results.archetypeName}
			oceanCode5={results.oceanCode5}
			description={results.archetypeDescription}
			dominantTrait={dominantTrait}
			traits={results.traits as TraitData[]}
			facets={results.facets}
			expandedTraits={expandedTraits}
			onToggleTrait={toggleTrait}
			onViewEvidence={handleViewEvidence}
			overallConfidence={results.overallConfidence}
			isCurated={results.isCurated}
		>
			{/* Wave transition: shallows → mid */}
			<WaveDivider fromColor="var(--depth-shallows)" className="text-[var(--depth-mid)]" />

			{/* Depth Zone: Mid — Share profile */}
			<div className="bg-[var(--depth-mid)]">
				<ShareProfileSection
					shareState={shareState}
					shareError={shareError}
					copied={copied}
					isSharePending={shareProfile.isPending}
					isTogglePending={toggleVisibility.isPending}
					archetypeName={results.archetypeName}
					onShare={handleShare}
					onCopyLink={handleCopyLink}
					onToggleVisibility={handleToggleVisibility}
				/>
			</div>

			{/* Wave transition: mid → deep */}
			<WaveDivider fromColor="var(--depth-mid)" className="text-[var(--depth-deep)]" />

			{/* Depth Zone: Deep — Actions */}
			<div className="bg-[var(--depth-deep)] px-6 py-12">
				<div className="flex flex-wrap gap-3 justify-center">
					<Button data-testid="results-continue-chat" asChild variant="outline" className="min-h-11">
						<Link to="/chat" search={{ sessionId: assessmentSessionId }}>
							<MessageCircle className="w-4 h-4 mr-2" />
							Continue Chat
						</Link>
					</Button>
				</div>
			</div>

			{/* Evidence Panel */}
			<EvidencePanel
				sessionId={assessmentSessionId}
				facetName={selectedFacet}
				evidence={facetEvidence}
				isLoading={evidenceLoading}
				isOpen={evidencePanelOpen}
				onClose={handleCloseEvidence}
			/>
		</ProfileView>
	);
}
