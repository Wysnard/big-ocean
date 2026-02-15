/**
 * Public Profile Route
 *
 * Displays a shared personality profile with psychedelic brand identity.
 * No auth required. Shows archetype, trait scores, and expandable facet breakdowns.
 * Conversations and evidence are not exposed.
 * Route: /profile/:publicProfileId
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import type { GetPublicProfileResponse } from "@workspace/contracts";
import type { FacetName, TraitName } from "@workspace/domain";
import {
	BIG_FIVE_TRAITS,
	FACET_TO_TRAIT,
	TRAIT_LETTER_MAP,
	TRAIT_TO_FACETS,
} from "@workspace/domain";
import { Button } from "@workspace/ui/components/button";
import { Check, Copy, Loader2, Lock, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { WaveDivider } from "@/components/home/WaveDivider";
import { ProfileView } from "@/components/results/ProfileView";
import type { FacetData, TraitData } from "@/components/results/TraitScoresSection";
import { useGetPublicProfile } from "../hooks/use-profile";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const FALLBACK_TITLE = "Personality Profile | big-ocean";
const FALLBACK_DESCRIPTION = "Discover your personality archetype with big-ocean.";

export const Route = createFileRoute("/profile/$publicProfileId")({
	loader: async ({ params }) => {
		try {
			const response = await fetch(`${API_URL}/api/profile/${params.publicProfileId}`, {
				headers: { "Content-Type": "application/json" },
			});
			if (!response.ok) return { profile: null };
			const profile: GetPublicProfileResponse = await response.json();
			return { profile };
		} catch {
			return { profile: null };
		}
	},
	head: ({ loaderData, params }) => {
		const profile = loaderData?.profile;
		const title = profile ? `${profile.archetypeName} | big-ocean` : FALLBACK_TITLE;
		const description = profile?.description || FALLBACK_DESCRIPTION;
		const canonicalUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/profile/${params.publicProfileId}`;

		return {
			meta: [
				{ title },
				{ name: "description", content: description },
				{ property: "og:title", content: title },
				{ property: "og:description", content: description },
				{ property: "og:url", content: canonicalUrl },
				{ property: "og:type", content: "profile" },
				{ property: "og:site_name", content: "big-ocean" },
				{ name: "twitter:card", content: "summary" },
				{ name: "twitter:title", content: title },
				{ name: "twitter:description", content: description },
			],
		};
	},
	component: ProfilePage,
});

type ApiFacets = Record<string, { score: number; confidence: number }>;

/** Convert API facet record to FacetData[] for TraitScoresSection */
function toFacetData(facets: ApiFacets): FacetData[] {
	return Object.entries(facets).map(([name, { score, confidence }]) => ({
		name,
		traitName: FACET_TO_TRAIT[name as FacetName] ?? "openness",
		score,
		confidence,
	}));
}

/** Derive TraitData[] by aggregating facet scores per trait */
function deriveTraitData(facets: ApiFacets, traitSummary: Record<string, string>): TraitData[] {
	return BIG_FIVE_TRAITS.map((trait) => {
		const traitFacets = TRAIT_TO_FACETS[trait];
		let totalScore = 0;
		let totalConfidence = 0;
		let count = 0;

		for (const facetName of traitFacets) {
			const facet = facets[facetName];
			if (facet) {
				totalScore += facet.score;
				totalConfidence += facet.confidence;
				count++;
			}
		}

		return {
			name: trait,
			score: totalScore,
			level: traitSummary[trait] ?? TRAIT_LETTER_MAP[trait][1],
			confidence: count > 0 ? Math.round(totalConfidence / count) : 0,
		};
	});
}

/** Derive dominant trait from trait scores (highest score, first in OCEAN order for ties) */
function getDominantTrait(traits: TraitData[]): TraitName {
	if (traits.length === 0) return "openness";
	const sorted = [...traits].sort((a, b) => b.score - a.score);
	return sorted[0].name as TraitName;
}

function ProfilePage() {
	const { publicProfileId } = Route.useParams();
	const { data: profile, isLoading, error } = useGetPublicProfile(publicProfileId);
	const [copied, setCopied] = useState(false);
	const [expandedTraits, setExpandedTraits] = useState<Set<string>>(new Set());

	const handleCopyLink = async () => {
		try {
			await navigator.clipboard.writeText(window.location.href);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
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
			<div
				data-slot="profile-loading"
				className="min-h-screen bg-background flex items-center justify-center"
			>
				<div className="text-center">
					<Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
					<p className="text-muted-foreground">Loading profile...</p>
				</div>
			</div>
		);
	}

	if (error) {
		const errorMessage = error.message;
		const isPrivate = errorMessage.includes("private");
		const isNotFound = errorMessage.includes("not found") || errorMessage.includes("404");

		return (
			<div
				data-slot="profile-error"
				className="min-h-screen bg-background flex items-center justify-center px-6"
			>
				<div className="text-center max-w-md">
					{isPrivate ? (
						<>
							<Lock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
							<h1 className="text-2xl font-bold font-heading text-foreground mb-2">
								This Profile is Private
							</h1>
							<p className="text-muted-foreground mb-6">
								The owner has set this profile to private. It is not publicly viewable.
							</p>
						</>
					) : isNotFound ? (
						<>
							<ShieldAlert className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
							<h1 className="text-2xl font-bold font-heading text-foreground mb-2">Profile Not Found</h1>
							<p className="text-muted-foreground mb-6">
								This profile doesn't exist or may have been removed.
							</p>
						</>
					) : (
						<>
							<ShieldAlert className="w-16 h-16 text-destructive mx-auto mb-4" />
							<h1 className="text-2xl font-bold font-heading text-foreground mb-2">
								Something Went Wrong
							</h1>
							<p className="text-muted-foreground mb-6">{errorMessage}</p>
						</>
					)}
					<Link to="/">
						<Button
							data-slot="profile-error-cta"
							className="bg-primary text-primary-foreground hover:bg-primary/90"
						>
							Go Home
						</Button>
					</Link>
				</div>
			</div>
		);
	}

	if (!profile) return null;

	const traits = deriveTraitData(profile.facets, profile.traitSummary);
	const facets = toFacetData(profile.facets);
	const dominantTrait = getDominantTrait(traits);

	return (
		<ProfileView
			archetypeName={profile.archetypeName}
			oceanCode5={profile.oceanCode}
			description={profile.description}
			dominantTrait={dominantTrait}
			traits={traits}
			facets={facets}
			displayName={profile.displayName}
			expandedTraits={expandedTraits}
			onToggleTrait={(trait) => {
				setExpandedTraits((prev) => {
					const next = new Set(prev);
					if (next.has(trait)) next.delete(trait);
					else next.add(trait);
					return next;
				});
			}}
		>
			{/* Wave transition: shallows → mid */}
			<WaveDivider fromColor="var(--depth-shallows)" className="text-[var(--depth-mid)]" />

			{/* Depth Zone: Mid — Share actions */}
			<div className="bg-[var(--depth-mid)]">
				<section data-slot="profile-share-actions" className="px-6 py-12">
					<div className="mx-auto max-w-2xl">
						<div className="border border-border rounded-xl bg-card p-6">
							<div className="flex items-center gap-2 mb-4">
								<Copy className="w-5 h-5 text-muted-foreground" />
								<h2 className="text-lg font-semibold font-heading text-foreground">Share This Profile</h2>
							</div>
							<div className="flex flex-wrap gap-3">
								<Button
									data-slot="profile-copy-link"
									onClick={handleCopyLink}
									variant="outline"
									className="min-h-[44px]"
								>
									{copied ? (
										<>
											<Check className="w-4 h-4 mr-2 text-success" />
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
					</div>
				</section>
			</div>

			{/* Wave transition: mid → deep */}
			<WaveDivider fromColor="var(--depth-mid)" className="text-[var(--depth-deep)]" />

			{/* Depth Zone: Deep — CTA Viral Loop */}
			<div className="bg-[var(--depth-deep)] px-6 py-12">
				<div className="text-center">
					<p className="text-muted-foreground mb-4">Want to discover your own personality archetype?</p>
					<Link to="/">
						<Button
							data-slot="profile-discover-cta"
							data-testid="public-cta"
							className="bg-primary text-primary-foreground hover:bg-primary/90 min-h-[44px] px-8 text-base"
						>
							Discover Your Archetype
						</Button>
					</Link>
				</div>
			</div>
		</ProfileView>
	);
}
