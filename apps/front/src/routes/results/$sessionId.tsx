import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { FacetName, TraitName } from "@workspace/domain";
import { Button } from "@workspace/ui/components/button";
import { Loader2, MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { EvidencePanel } from "@/components/EvidencePanel";
import { WaveDivider } from "@/components/home/WaveDivider";
import { ResultsAuthGate } from "@/components/ResultsAuthGate";
import { ArchetypeHeroSection } from "@/components/results/ArchetypeHeroSection";
import { ShareProfileSection } from "@/components/results/ShareProfileSection";
import { TraitScoresSection } from "@/components/results/TraitScoresSection";
import { isAssessmentApiError, useGetResults } from "@/hooks/use-assessment";
import { useAuth } from "@/hooks/use-auth";
import { useFacetEvidence } from "@/hooks/use-evidence";
import { useShareProfile, useToggleVisibility } from "@/hooks/use-profile";
import {
	clearPendingResultsGateSession,
	persistPendingResultsGateSession,
	readPendingResultsGateSession,
} from "@/lib/results-auth-gate-storage";

export const Route = createFileRoute("/results/$sessionId")({
	validateSearch: (search: Record<string, unknown>) => {
		return {
			scrollToFacet: (search.scrollToFacet as string) || undefined,
		};
	},
	component: ResultsSessionPage,
});

/** Determine the dominant (highest-scoring) trait from results */
function getDominantTrait(traits: { name: string; score: number }[]): TraitName {
	if (traits.length === 0) return "openness";
	const sorted = [...traits].sort((a, b) => b.score - a.score);
	return sorted[0].name as TraitName;
}

function ResultsSessionPage() {
	const { sessionId } = Route.useParams();
	const { scrollToFacet } = Route.useSearch();
	const navigate = useNavigate();
	const { isAuthenticated, isPending: isAuthPending } = useAuth();
	const canLoadResults = isAuthenticated && !isAuthPending;
	const { data: results, isLoading, error } = useGetResults(sessionId, canLoadResults);
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
		sessionId,
		selectedFacet,
		evidencePanelOpen && canLoadResults,
	);

	// Track 24-hour auth-gate session persistence
	useEffect(() => {
		if (isAuthenticated) {
			clearPendingResultsGateSession(sessionId);
			setIsGateExpired(false);
			return;
		}

		const pending = readPendingResultsGateSession();
		if (pending && pending.sessionId === sessionId) {
			setIsGateExpired(pending.expired);
			return;
		}

		persistPendingResultsGateSession(sessionId);
		setIsGateExpired(false);
	}, [isAuthenticated, sessionId]);

	// Handle scrollToFacet search param
	useEffect(() => {
		if (!results || !scrollToFacet) {
			return;
		}

		const facet = results.facets.find(
			(f) => f.name.toLowerCase().replace(/ /g, "_") === scrollToFacet,
		);
		if (facet) {
			setExpandedTraits((prev) => new Set(prev).add(facet.traitName));
			setTimeout(() => {
				const element = document.getElementById(`facet-${scrollToFacet}`);
				element?.scrollIntoView({ behavior: "smooth", block: "center" });
			}, 100);
		}
	}, [scrollToFacet, results]);

	useEffect(() => {
		if (!shouldRedirectDeniedSession) {
			return;
		}

		void navigate({ to: "/404" });
	}, [navigate, shouldRedirectDeniedSession]);

	const handleShare = async () => {
		setShareError(null);
		try {
			const result = await shareProfile.mutateAsync(sessionId);
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
		clearPendingResultsGateSession(sessionId);
		void navigate({
			to: "/results/$sessionId",
			params: { sessionId },
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
				sessionId={sessionId}
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
					<Button
						onClick={() => navigate({ to: "/chat", search: { sessionId } })}
						className="bg-primary text-primary-foreground hover:bg-primary/90"
					>
						<MessageCircle className="w-4 h-4 mr-2" />
						Continue Assessment
					</Button>
				</div>
			</div>
		);
	}

	console.log("[BigOcean] Results loaded", {
		sessionId,
		oceanCode5: results.oceanCode5,
		archetypeName: results.archetypeName,
		overallConfidence: results.overallConfidence,
		traits: results.traits.map((t) => ({
			name: t.name,
			score: t.score,
			level: t.level,
			confidence: t.confidence,
		})),
		facetsWithSignal: results.facets
			.filter((f) => f.confidence > 0)
			.map((f) => ({ name: f.name, score: f.score, confidence: f.confidence })),
	});

	const dominantTrait = getDominantTrait(results.traits);

	return (
		<div className="min-h-screen">
			{/* Depth Zone: Surface — Hero (maximum psychedelic) */}
			<div className="bg-[var(--depth-surface)]">
				<ArchetypeHeroSection
					archetypeName={results.archetypeName}
					oceanCode5={results.oceanCode5}
					archetypeDescription={results.archetypeDescription}
					overallConfidence={results.overallConfidence}
					isCurated={results.isCurated}
					dominantTrait={dominantTrait}
				/>
			</div>

			{/* Wave transition: surface → shallows */}
			<WaveDivider fromColor="var(--depth-surface)" className="text-[var(--depth-shallows)]" />

			{/* Depth Zone: Shallows — Trait overview (balanced) */}
			<div className="bg-[var(--depth-shallows)]">
				<TraitScoresSection
					traits={results.traits}
					facets={results.facets}
					expandedTraits={expandedTraits}
					onToggleTrait={toggleTrait}
					onViewEvidence={handleViewEvidence}
				/>
			</div>

			{/* Wave transition: shallows → mid */}
			<WaveDivider fromColor="var(--depth-shallows)" className="text-[var(--depth-mid)]" />

			{/* Depth Zone: Mid — Share profile (scientific) */}
			<div className="bg-[var(--depth-mid)]">
				<ShareProfileSection
					shareState={shareState}
					shareError={shareError}
					copied={copied}
					isSharePending={shareProfile.isPending}
					isTogglePending={toggleVisibility.isPending}
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
					<Button
						onClick={() => navigate({ to: "/chat", search: { sessionId } })}
						variant="outline"
						className="min-h-11"
					>
						<MessageCircle className="w-4 h-4 mr-2" />
						Continue Chat
					</Button>
					<Button
						onClick={() => navigate({ to: "/chat", search: { sessionId: undefined } })}
						className="bg-primary text-primary-foreground hover:bg-primary/90 min-h-11"
					>
						Start New Assessment
					</Button>
				</div>
			</div>

			{/* Evidence Panel */}
			<EvidencePanel
				sessionId={sessionId}
				facetName={selectedFacet}
				evidence={facetEvidence}
				isLoading={evidenceLoading}
				isOpen={evidencePanelOpen}
				onClose={handleCloseEvidence}
			/>
		</div>
	);
}
