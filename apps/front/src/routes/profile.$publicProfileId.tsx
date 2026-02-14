/**
 * Public Profile Route
 *
 * Displays a shared personality profile. No auth required.
 * Route: /profile/:publicProfileId
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@workspace/ui/components/button";
import {
	Check,
	ChevronDown,
	ChevronUp,
	Copy,
	Eye,
	Handshake,
	Heart,
	Lightbulb,
	Loader2,
	Lock,
	ShieldAlert,
	TrendingUp,
	Waves,
	Zap,
} from "lucide-react";
import { useState } from "react";
import { useGetPublicProfile } from "../hooks/use-profile";

export const Route = createFileRoute("/profile/$publicProfileId")({
	component: ProfilePage,
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

const LEVEL_LABELS: Record<string, { label: string; width: string }> = {
	H: { label: "High", width: "85%" },
	M: { label: "Mid", width: "50%" },
	L: { label: "Low", width: "15%" },
};

const TRAIT_FACETS: Record<string, { facets: string[]; displayNames: Record<string, string> }> = {
	openness: {
		facets: [
			"imagination",
			"artistic_interests",
			"emotionality",
			"adventurousness",
			"intellect",
			"liberalism",
		],
		displayNames: {
			imagination: "Imagination",
			artistic_interests: "Artistic Interests",
			emotionality: "Emotionality",
			adventurousness: "Adventurousness",
			intellect: "Intellect",
			liberalism: "Liberalism",
		},
	},
	conscientiousness: {
		facets: [
			"self_efficacy",
			"orderliness",
			"dutifulness",
			"achievement_striving",
			"self_discipline",
			"cautiousness",
		],
		displayNames: {
			self_efficacy: "Self-Efficacy",
			orderliness: "Orderliness",
			dutifulness: "Dutifulness",
			achievement_striving: "Achievement Striving",
			self_discipline: "Self-Discipline",
			cautiousness: "Cautiousness",
		},
	},
	extraversion: {
		facets: [
			"friendliness",
			"gregariousness",
			"assertiveness",
			"activity_level",
			"excitement_seeking",
			"cheerfulness",
		],
		displayNames: {
			friendliness: "Friendliness",
			gregariousness: "Gregariousness",
			assertiveness: "Assertiveness",
			activity_level: "Activity Level",
			excitement_seeking: "Excitement Seeking",
			cheerfulness: "Cheerfulness",
		},
	},
	agreeableness: {
		facets: ["trust", "morality", "altruism", "cooperation", "modesty", "sympathy"],
		displayNames: {
			trust: "Trust",
			morality: "Morality",
			altruism: "Altruism",
			cooperation: "Cooperation",
			modesty: "Modesty",
			sympathy: "Sympathy",
		},
	},
	neuroticism: {
		facets: ["anxiety", "anger", "depression", "self_consciousness", "immoderation", "vulnerability"],
		displayNames: {
			anxiety: "Anxiety",
			anger: "Anger",
			depression: "Depression",
			self_consciousness: "Self-Consciousness",
			immoderation: "Immoderation",
			vulnerability: "Vulnerability",
		},
	},
};

function ProfilePage() {
	const { publicProfileId } = Route.useParams();
	const { data: profile, isLoading, error } = useGetPublicProfile(publicProfileId);
	const [copied, setCopied] = useState(false);
	const [expandedTrait, setExpandedTrait] = useState<string | null>(null);

	const handleCopyLink = async () => {
		try {
			await navigator.clipboard.writeText(window.location.href);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			// Fallback for older browsers
			const textarea = document.createElement("textarea");
			textarea.value = window.location.href;
			document.body.appendChild(textarea);
			textarea.select();
			document.execCommand("copy");
			document.body.removeChild(textarea);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		}
	};

	if (isLoading) {
		return (
			<div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
				<div className="text-center">
					<Loader2 className="h-12 w-12 animate-spin text-blue-400 mx-auto mb-4" />
					<p className="text-gray-400">Loading profile...</p>
				</div>
			</div>
		);
	}

	if (error) {
		const errorMessage = error.message;
		const isPrivate = errorMessage.includes("private");
		const isNotFound = errorMessage.includes("not found") || errorMessage.includes("404");

		return (
			<div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-6">
				<div className="text-center max-w-md">
					{isPrivate ? (
						<>
							<Lock className="w-16 h-16 text-slate-500 mx-auto mb-4" />
							<h1 className="text-2xl font-bold text-white mb-2">This Profile is Private</h1>
							<p className="text-gray-400 mb-6">
								The owner has set this profile to private. It is not publicly viewable.
							</p>
						</>
					) : isNotFound ? (
						<>
							<ShieldAlert className="w-16 h-16 text-slate-500 mx-auto mb-4" />
							<h1 className="text-2xl font-bold text-white mb-2">Profile Not Found</h1>
							<p className="text-gray-400 mb-6">This profile doesn't exist or may have been removed.</p>
						</>
					) : (
						<>
							<ShieldAlert className="w-16 h-16 text-red-400 mx-auto mb-4" />
							<h1 className="text-2xl font-bold text-white mb-2">Something Went Wrong</h1>
							<p className="text-gray-400 mb-6">{errorMessage}</p>
						</>
					)}
					<Link to="/">
						<Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
							Go Home
						</Button>
					</Link>
				</div>
			</div>
		);
	}

	if (!profile) return null;

	const traitOrder = [
		"openness",
		"conscientiousness",
		"extraversion",
		"agreeableness",
		"neuroticism",
	];

	return (
		<div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 py-8 px-4 md:px-6">
			<div className="max-w-2xl mx-auto">
				{/* Archetype Card */}
				<div
					className="rounded-2xl border border-slate-700 overflow-hidden mb-8"
					style={{ background: `linear-gradient(135deg, ${profile.color}22, ${profile.color}08)` }}
				>
					<div className="p-8 text-center">
						<div
							className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center"
							style={{ backgroundColor: `${profile.color}33` }}
						>
							<Waves className="w-10 h-10" style={{ color: profile.color }} />
						</div>
						<h1
							data-testid="public-archetype-name"
							className="text-3xl md:text-4xl font-bold text-white mb-2"
						>
							{profile.archetypeName}
						</h1>
						<p className="text-sm font-mono text-slate-400 mb-4">OCEAN Code: {profile.oceanCode}</p>
						<p className="text-gray-300 leading-relaxed max-w-lg mx-auto">{profile.description}</p>
					</div>
				</div>

				{/* Trait Summary with Facets */}
				<div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-8">
					<h2 className="text-xl font-bold text-white mb-6">Trait Summary</h2>
					<div className="space-y-5">
						{traitOrder.map((trait) => {
							const config = TRAIT_CONFIG[trait];
							const level = profile.traitSummary[trait] || "M";
							const levelInfo = LEVEL_LABELS[level] || LEVEL_LABELS.M;
							const isExpanded = expandedTrait === trait;
							const traitFacets = TRAIT_FACETS[trait];
							if (!config) return null;

							return (
								<div key={trait} className="border border-slate-700/50 rounded-lg p-4">
									<button
										type="button"
										onClick={() => setExpandedTrait(isExpanded ? null : trait)}
										className="w-full text-left"
									>
										<div className="flex items-center justify-between mb-2">
											<div className={`flex items-center gap-2 ${config.color}`}>
												{config.icon}
												<span className="text-sm font-medium text-gray-300">{config.label}</span>
												{isExpanded ? (
													<ChevronUp className="w-4 h-4 text-slate-400" />
												) : (
													<ChevronDown className="w-4 h-4 text-slate-400" />
												)}
											</div>
											<span className="text-sm font-semibold text-gray-100">{levelInfo.label}</span>
										</div>
										<div className="w-full bg-slate-700 rounded-full h-2.5">
											<div
												className={`h-2.5 rounded-full transition-all duration-500 ${config.barColor}`}
												style={{ width: levelInfo.width }}
											/>
										</div>
									</button>

									{/* Facet Insights */}
									{isExpanded && traitFacets && (
										<div className="mt-4 pt-4 border-t border-slate-700/50">
											<p className="text-xs text-slate-400 mb-3 uppercase tracking-wider">Facet Breakdown</p>
											<div className="space-y-3">
												{traitFacets.facets.map((facetKey) => {
													const facetData = profile.facets?.[facetKey];
													if (!facetData) return null;

													const percentage = Math.round((facetData.score / 20) * 100);
													const displayName = traitFacets.displayNames[facetKey] || facetKey;

													return (
														<div key={facetKey}>
															<div className="flex items-center justify-between mb-1">
																<span className="text-xs text-gray-400">{displayName}</span>
																<span className="text-xs text-gray-300 font-mono">{facetData.score}/20</span>
															</div>
															<div className="w-full bg-slate-700/50 rounded-full h-1.5">
																<div
																	className={`h-1.5 rounded-full ${config.barColor} opacity-70`}
																	style={{ width: `${percentage}%` }}
																/>
															</div>
														</div>
													);
												})}
											</div>
										</div>
									)}
								</div>
							);
						})}
					</div>
				</div>

				{/* Share Actions */}
				<div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-8">
					<div className="flex items-center gap-2 mb-4">
						<Eye className="w-5 h-5 text-slate-400" />
						<h2 className="text-lg font-semibold text-white">Share This Profile</h2>
					</div>
					<div className="flex flex-wrap gap-3">
						<Button
							data-testid="public-copy-link"
							onClick={handleCopyLink}
							variant="outline"
							className="border-slate-600 text-gray-300 hover:bg-slate-700 hover:text-white"
						>
							{copied ? (
								<>
									<Check className="w-4 h-4 mr-2 text-green-400" />
									Copied!
								</>
							) : (
								<>
									<Copy className="w-4 h-4 mr-2" />
									Copy Link
								</>
							)}
						</Button>
					</div>
				</div>

				{/* CTA */}
				<div className="text-center">
					<p className="text-gray-400 mb-4">Want to discover your own personality archetype?</p>
					<Link to="/chat" search={{ sessionId: undefined }}>
						<Button
							data-testid="public-cta"
							className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 px-8"
						>
							Take the Assessment
						</Button>
					</Link>
				</div>
			</div>
		</div>
	);
}
