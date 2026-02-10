/**
 * Results Route
 *
 * Displays assessment results with archetype card and share functionality.
 * Route: /results?sessionId=xxx
 */

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { FacetName } from "@workspace/domain";
import { Button } from "@workspace/ui/components/button";
import {
	Check,
	ChevronDown,
	ChevronUp,
	Copy,
	Eye,
	EyeOff,
	FileText,
	Handshake,
	Heart,
	Lightbulb,
	Loader2,
	MessageCircle,
	Share2,
	TrendingUp,
	Waves,
	Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { EvidencePanel } from "../components/EvidencePanel";
import { useGetResults } from "../hooks/use-assessment";
import { useFacetEvidence } from "../hooks/use-evidence";
import { useShareProfile, useToggleVisibility } from "../hooks/use-profile";

export const Route = createFileRoute("/results")({
	validateSearch: (search: Record<string, unknown>) => {
		return {
			sessionId: (search.sessionId as string) || "",
			scrollToFacet: (search.scrollToFacet as string) || undefined,
		};
	},
	component: ResultsPage,
});

const TRAIT_CONFIG: Record<
	string,
	{ label: string; icon: React.ReactNode; color: string; barColor: string }
> = {
	openness: {
		label: "Openness",
		icon: <Lightbulb className="w-5 h-5" />,
		color: "text-amber-400",
		barColor: "bg-amber-400",
	},
	conscientiousness: {
		label: "Conscientiousness",
		icon: <Zap className="w-5 h-5" />,
		color: "text-blue-400",
		barColor: "bg-blue-400",
	},
	extraversion: {
		label: "Extraversion",
		icon: <Heart className="w-5 h-5" />,
		color: "text-rose-400",
		barColor: "bg-rose-400",
	},
	agreeableness: {
		label: "Agreeableness",
		icon: <Handshake className="w-5 h-5" />,
		color: "text-green-400",
		barColor: "bg-green-400",
	},
	neuroticism: {
		label: "Neuroticism",
		icon: <TrendingUp className="w-5 h-5" />,
		color: "text-purple-400",
		barColor: "bg-purple-400",
	},
};

function ResultsPage() {
	const { sessionId, scrollToFacet } = Route.useSearch();
	const navigate = useNavigate();
	const { data: results, isLoading, error } = useGetResults(sessionId);
	const shareProfile = useShareProfile();
	const toggleVisibility = useToggleVisibility();

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
		evidencePanelOpen,
	);

	// Handle scrollToFacet search param
	useEffect(() => {
		if (scrollToFacet && results) {
			// Find which trait contains this facet
			const facet = results.facets.find(
				(f) => f.name.toLowerCase().replace(/ /g, "_") === scrollToFacet,
			);
			if (facet) {
				// Expand the trait
				setExpandedTraits((prev) => new Set(prev).add(facet.traitName));
				// Optionally scroll to the facet (using setTimeout to ensure DOM is updated)
				setTimeout(() => {
					const element = document.getElementById(`facet-${scrollToFacet}`);
					element?.scrollIntoView({ behavior: "smooth", block: "center" });
				}, 100);
			}
		}
	}, [scrollToFacet, results]);

	const handleShare = async () => {
		setShareError(null);
		try {
			const result = await shareProfile.mutateAsync(sessionId);
			setShareState(result);
		} catch (err) {
			setShareError(err instanceof Error ? err.message : "Failed to create shareable profile");
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

	if (!sessionId) {
		return (
			<div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-6">
				<div className="text-center">
					<h1 className="text-2xl font-bold text-white mb-4">No Session Found</h1>
					<p className="text-gray-400 mb-6">Start an assessment to see your results.</p>
					<Button
						onClick={() => navigate({ to: "/chat", search: { sessionId: undefined } })}
						className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
					>
						Start Assessment
					</Button>
				</div>
			</div>
		);
	}

	if (isLoading) {
		return (
			<div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
				<div className="text-center">
					<Loader2 className="h-12 w-12 animate-spin text-blue-400 mx-auto mb-4" />
					<p className="text-gray-400">Calculating your personality profile...</p>
				</div>
			</div>
		);
	}

	if (error || !results) {
		return (
			<div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-6">
				<div className="text-center">
					<h1 className="text-2xl font-bold text-white mb-4">Could Not Load Results</h1>
					<p className="text-gray-400 mb-6">
						{error?.message || "Your assessment may not be complete yet."}
					</p>
					<Button
						onClick={() => navigate({ to: "/chat", search: { sessionId } })}
						className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
					>
						<MessageCircle className="w-4 h-4 mr-2" />
						Continue Assessment
					</Button>
				</div>
			</div>
		);
	}

	const traitOrder = [
		"openness",
		"conscientiousness",
		"extraversion",
		"agreeableness",
		"neuroticism",
	] as const;
	const maxTraitScore = 120;

	return (
		<div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 py-8 px-4 md:px-6">
			<div className="max-w-2xl mx-auto">
				{/* Archetype Header */}
				<div className="text-center mb-8">
					<div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center bg-blue-500/20">
						<Waves className="w-10 h-10 text-blue-400" />
					</div>
					<p className="text-sm text-slate-400 uppercase tracking-wider mb-2">
						Your Personality Archetype
					</p>
					<h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{results.archetypeName}</h1>
					<p className="text-sm font-mono text-slate-400">OCEAN Code: {results.oceanCode}</p>
				</div>

				{/* Trait Scores with Facets */}
				<div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-8">
					<h2 className="text-xl font-bold text-white mb-6">Your Trait Scores</h2>
					<div className="space-y-5">
						{traitOrder.map((trait) => {
							const config = TRAIT_CONFIG[trait];
							const traitData = results.traits.find((t) => t.name === trait);
							if (!config || !traitData) return null;

							const percentage = Math.round((traitData.score / maxTraitScore) * 100);
							const traitFacets = results.facets.filter((f) => f.traitName === trait);
							const isExpanded = expandedTraits.has(trait);

							return (
								<div key={trait} className="border border-slate-700 rounded-lg p-4">
									{/* Trait Header - Clickable to expand */}
									<button onClick={() => toggleTrait(trait)} className="w-full text-left" type="button">
										<div className="flex items-center justify-between mb-2">
											<div className={`flex items-center gap-2 ${config.color}`}>
												{config.icon}
												<span className="text-sm font-medium text-gray-300">{config.label}</span>
												{isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
											</div>
											<span className="text-sm font-semibold text-gray-100">{percentage}%</span>
										</div>
										<div className="w-full bg-slate-700 rounded-full h-2.5">
											<div
												className={`h-2.5 rounded-full transition-all duration-500 ${config.barColor}`}
												style={{ width: `${percentage}%` }}
											/>
										</div>
									</button>

									{/* Facets - Shown when expanded */}
									{isExpanded && (
										<div className="mt-4 space-y-3 pl-2 border-l-2 border-slate-600">
											{traitFacets.map((facet) => {
												const facetPercentage = Math.round((facet.score / 20) * 100);
												const facetId = facet.name.toLowerCase().replace(/ /g, "_");
												return (
													<div key={facet.name} id={`facet-${facetId}`} className="pl-4">
														<div className="flex items-center justify-between mb-1">
															<span className="text-xs text-gray-400">{facet.name}</span>
															<div className="flex items-center gap-2">
																<span className="text-xs text-gray-400">
																	{facet.score}/20 ({facet.confidence}%)
																</span>
																<Button
																	onClick={() => handleViewEvidence(facetId as FacetName)}
																	size="sm"
																	variant="ghost"
																	className="h-7 px-2 text-xs hover:bg-slate-700"
																>
																	<FileText className="w-3 h-3 mr-1" />
																	Evidence
																</Button>
															</div>
														</div>
														<div className="w-full bg-slate-700 rounded-full h-1.5">
															<div
																className={`h-1.5 rounded-full ${config.barColor} opacity-70`}
																style={{ width: `${facetPercentage}%` }}
															/>
														</div>
													</div>
												);
											})}
										</div>
									)}
								</div>
							);
						})}
					</div>
				</div>

				{/* Share Profile Section */}
				<div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-8">
					<div className="flex items-center gap-2 mb-4">
						<Share2 className="w-5 h-5 text-slate-400" />
						<h2 className="text-lg font-semibold text-white">Share Your Profile</h2>
					</div>

					{!shareState ? (
						<div>
							<p className="text-gray-400 text-sm mb-4">
								Generate a shareable link so others can see your personality archetype.
							</p>
							{shareError && <p className="text-red-400 text-sm mb-4">{shareError}</p>}
							<Button
								onClick={handleShare}
								disabled={shareProfile.isPending}
								className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
							>
								{shareProfile.isPending ? (
									<>
										<Loader2 className="w-4 h-4 mr-2 animate-spin" />
										Generating...
									</>
								) : (
									<>
										<Share2 className="w-4 h-4 mr-2" />
										Generate Shareable Link
									</>
								)}
							</Button>
						</div>
					) : (
						<div className="space-y-4">
							{/* Link display */}
							<div className="flex items-center gap-2 bg-slate-900/50 rounded-lg p-3">
								<code className="text-sm text-blue-400 flex-1 truncate">{shareState.shareableUrl}</code>
								<Button
									onClick={handleCopyLink}
									size="sm"
									variant="outline"
									className="border-slate-600 text-gray-300 hover:bg-slate-700 hover:text-white shrink-0"
								>
									{copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
								</Button>
							</div>

							{/* Visibility toggle */}
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									{shareState.isPublic ? (
										<Eye className="w-4 h-4 text-green-400" />
									) : (
										<EyeOff className="w-4 h-4 text-slate-400" />
									)}
									<span className="text-sm text-gray-300">
										{shareState.isPublic ? "Profile is public" : "Profile is private"}
									</span>
								</div>
								<Button
									onClick={handleToggleVisibility}
									size="sm"
									variant="outline"
									disabled={toggleVisibility.isPending}
									className="border-slate-600 text-gray-300 hover:bg-slate-700 hover:text-white"
								>
									{toggleVisibility.isPending ? (
										<Loader2 className="w-4 h-4 animate-spin" />
									) : shareState.isPublic ? (
										"Make Private"
									) : (
										"Make Public"
									)}
								</Button>
							</div>

							{!shareState.isPublic && (
								<p className="text-xs text-slate-500">
									Your profile link has been created but is private. Toggle to public so others can view it.
								</p>
							)}
						</div>
					)}
				</div>

				{/* Actions */}
				<div className="flex flex-wrap gap-3 justify-center">
					<Button
						onClick={() => navigate({ to: "/chat", search: { sessionId } })}
						variant="outline"
						className="border-slate-600 text-gray-300 hover:bg-slate-700 hover:text-white"
					>
						<MessageCircle className="w-4 h-4 mr-2" />
						Continue Chat
					</Button>
					<Button
						onClick={() => navigate({ to: "/chat", search: { sessionId: undefined } })}
						className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
					>
						Start New Assessment
					</Button>
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
		</div>
	);
}
