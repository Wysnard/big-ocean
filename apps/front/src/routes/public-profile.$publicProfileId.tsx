/**
 * Public Profile Route — Story 15-1 Redesign
 *
 * 5-section "Story Scroll" layout for shareable personality profiles.
 * No auth required to view. Auth state determines CTA variant.
 * Route: /public-profile/:publicProfileId
 */

import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import type { GetPublicProfileResponse } from "@workspace/contracts";
import type { FacetName, FacetResult, TraitLevel, TraitName, TraitResult } from "@workspace/domain";
import {
	BIG_FIVE_TRAITS,
	FACET_TO_TRAIT,
	getTraitColor,
	TRAIT_LETTER_MAP,
	TRAIT_TO_FACETS,
} from "@workspace/domain";
import { Loader2, Lock, ShieldAlert } from "lucide-react";
import type { ReactNode } from "react";
import { OceanCircle } from "@/components/ocean-shapes/OceanCircle";
import { OceanDiamond } from "@/components/ocean-shapes/OceanDiamond";
import { OceanHalfCircle } from "@/components/ocean-shapes/OceanHalfCircle";
import { OceanRectangle } from "@/components/ocean-shapes/OceanRectangle";
import { OceanTriangle } from "@/components/ocean-shapes/OceanTriangle";
import { ArchetypeDescriptionSection } from "@/components/results/ArchetypeDescriptionSection";
import { ArchetypeHeroSection } from "@/components/results/ArchetypeHeroSection";
import { PersonalityRadarChart } from "@/components/results/PersonalityRadarChart";
import { PsychedelicBackground } from "@/components/results/PsychedelicBackground";
import type { AuthState } from "@/components/results/PublicProfileCTA";
import { PublicProfileCTA } from "@/components/results/PublicProfileCTA";
import { TraitBand } from "@/components/results/TraitBand";
import { useGetPublicProfile } from "../hooks/use-profile";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const FALLBACK_TITLE = "Personality Profile | big-ocean";
const FALLBACK_DESCRIPTION = "Discover your personality archetype with big-ocean.";

// ---------------------------------------------------------------------------
// Server Functions
// ---------------------------------------------------------------------------

const checkPublicProfileAuth = createServerFn({ method: "GET" }).handler(async () => {
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

const checkHasCompletedAssessment = createServerFn({ method: "GET" }).handler(async () => {
	try {
		const cookie = getRequestHeader("cookie") ?? "";
		const response = await fetch(`${API_URL}/api/assessment/sessions`, {
			headers: { "Content-Type": "application/json", cookie },
		});
		if (!response.ok) return { hasCompleted: false };
		const data = await response.json();
		const hasCompleted = (data.sessions ?? []).some(
			(s: { status: string }) => s.status === "completed",
		);
		return { hasCompleted };
	} catch {
		return { hasCompleted: false };
	}
});

// ---------------------------------------------------------------------------
// Route Definition
// ---------------------------------------------------------------------------

export const Route = createFileRoute("/public-profile/$publicProfileId")({
	loader: async ({ params }) => {
		// 1. Fetch public profile (no auth needed)
		let profile: GetPublicProfileResponse | null = null;
		try {
			const response = await fetch(`${API_URL}/api/public-profile/${params.publicProfileId}`, {
				headers: { "Content-Type": "application/json" },
			});
			if (response.ok) {
				profile = await response.json();
			}
		} catch {
			/* profile stays null */
		}

		// 2. Auth check
		const authResult = await checkPublicProfileAuth().catch(() => ({
			isAuthenticated: false,
		}));

		// 3. Assessment completion (only if authenticated)
		let authState: AuthState = "unauthenticated";
		if (authResult.isAuthenticated) {
			const completionResult = await checkHasCompletedAssessment().catch(() => ({
				hasCompleted: false,
			}));
			authState = completionResult.hasCompleted
				? "authenticated-assessed"
				: "authenticated-no-assessment";
		}

		return { profile, authState };
	},
	head: ({ loaderData, params }) => {
		const profile = loaderData?.profile;
		const title = profile ? `${profile.archetypeName} | big-ocean` : FALLBACK_TITLE;
		const description = profile?.description || FALLBACK_DESCRIPTION;
		const canonicalUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/public-profile/${params.publicProfileId}`;
		const ogImageUrl = `${API_URL}/api/og/public-profile/${params.publicProfileId}`;

		return {
			meta: [
				{ title },
				{ name: "description", content: description },
				{ property: "og:title", content: title },
				{ property: "og:description", content: description },
				{ property: "og:url", content: canonicalUrl },
				{ property: "og:type", content: "profile" },
				{ property: "og:site_name", content: "big-ocean" },
				{ property: "og:image", content: ogImageUrl },
				{ property: "og:image:width", content: "1200" },
				{ property: "og:image:height", content: "630" },
				{ name: "twitter:card", content: "summary_large_image" },
				{ name: "twitter:title", content: title },
				{ name: "twitter:description", content: description },
				{ name: "twitter:image", content: ogImageUrl },
			],
		};
	},
	pendingComponent: ProfileLoading,
	component: ProfilePage,
});

// ---------------------------------------------------------------------------
// Data helpers
// ---------------------------------------------------------------------------

type ApiFacets = Record<string, { score: number; confidence: number }>;

function toFacetData(facets: ApiFacets): FacetResult[] {
	return Object.entries(facets).map(([name, { score, confidence }]) => ({
		name: name as FacetName,
		traitName: FACET_TO_TRAIT[name as FacetName] ?? "openness",
		score,
		confidence,
	}));
}

function deriveTraitData(facets: ApiFacets, traitSummary: Record<string, string>): TraitResult[] {
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
			level: (traitSummary[trait] ?? TRAIT_LETTER_MAP[trait][1]) as TraitLevel,
			confidence: count > 0 ? Math.round(totalConfidence / count) : 0,
		};
	});
}

function getDominantTrait(traits: TraitResult[]): TraitName {
	if (traits.length === 0) return "openness";
	const sorted = [...traits].sort((a, b) => b.score - a.score);
	return sorted[0].name;
}

function getSecondaryTrait(traits: TraitResult[]): TraitName {
	if (traits.length < 2) return "conscientiousness";
	const sorted = [...traits].sort((a, b) => b.score - a.score);
	return sorted[1].name;
}

// ---------------------------------------------------------------------------
// Inline Components
// ---------------------------------------------------------------------------

const TRAIT_SHAPE: Record<TraitName, (props: { size?: number; color?: string }) => ReactNode> = {
	openness: OceanCircle,
	conscientiousness: OceanHalfCircle,
	extraversion: OceanRectangle,
	agreeableness: OceanTriangle,
	neuroticism: OceanDiamond,
};

const TRAIT_LABELS: Record<TraitName, string> = {
	openness: "Openness",
	conscientiousness: "Conscientiousness",
	extraversion: "Extraversion",
	agreeableness: "Agreeableness",
	neuroticism: "Neuroticism",
};

function TraitLegendRow() {
	return (
		<div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-6" aria-hidden="true">
			{BIG_FIVE_TRAITS.map((traitName) => {
				const color = getTraitColor(traitName);
				const ShapeComponent = TRAIT_SHAPE[traitName];
				return (
					<div key={traitName} className="flex items-center gap-1.5 text-sm" style={{ color }}>
						<ShapeComponent size={14} color={color} />
						<span>{TRAIT_LABELS[traitName]}</span>
					</div>
				);
			})}
		</div>
	);
}

function ProfileLoading() {
	return (
		<div
			data-slot="profile-loading"
			className="min-h-screen bg-background flex items-center justify-center"
		>
			<div className="text-center">
				<Loader2 className="h-12 w-12 motion-safe:animate-spin text-primary mx-auto mb-4" />
				<p className="text-muted-foreground">Loading profile...</p>
			</div>
		</div>
	);
}

function ProfileErrorState({ error }: { error?: Error }) {
	const errorMessage = error?.message ?? "";
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
						<h1 className="text-2xl font-bold font-heading text-foreground mb-2">Something Went Wrong</h1>
						<p className="text-muted-foreground mb-6">
							{errorMessage || "An unexpected error occurred."}
						</p>
					</>
				)}
			</div>
		</div>
	);
}

// ---------------------------------------------------------------------------
// Page Component — 5-Section Story Scroll
// ---------------------------------------------------------------------------

function ProfilePage() {
	const { publicProfileId } = Route.useParams();
	const loaderData = Route.useLoaderData();
	const authState = (loaderData?.authState as AuthState) ?? "unauthenticated";

	// Client-side data (SSR pre-fetched in loader, this provides reactivity + fallback)
	const { data: hookProfile, isLoading, error } = useGetPublicProfile(publicProfileId);
	const profile = loaderData?.profile ?? hookProfile;

	if (isLoading && !profile) return <ProfileLoading />;
	if (error && !profile) return <ProfileErrorState error={error} />;
	if (!profile) return <ProfileErrorState />;

	const traits = deriveTraitData(profile.facets, profile.traitSummary);
	const facets = toFacetData(profile.facets);
	const dominantTrait = getDominantTrait(traits);
	const secondaryTrait = getSecondaryTrait(traits);
	const displayName = profile.displayName ?? "This person";

	return (
		<div data-slot="public-profile" className="min-h-screen bg-depth-surface">
			{/* Section 1: Archetype Hero */}
			<ArchetypeHeroSection
				archetypeName={profile.archetypeName}
				oceanCode5={profile.oceanCode}
				dominantTrait={dominantTrait}
				displayName={displayName}
				subtitle={`${displayName}\u2019s Personality`}
				showScrollIndicator
			/>

			{/* Section 2: The Shape — oversized radar with psychedelic bg */}
			<section
				data-slot="personality-shape"
				className="relative min-h-[70vh] sm:min-h-[80vh] flex flex-col items-center justify-center py-12"
			>
				<PsychedelicBackground intensity="subtle" />
				<div className="relative z-10 text-center w-full">
					<h2 className="font-display text-2xl text-muted-foreground mb-8">Personality Shape</h2>
					<PersonalityRadarChart
						traits={traits}
						width={400}
						height={400}
						showExternalLabels
						standalone
					/>
					<TraitLegendRow />
				</div>
			</section>

			{/* Section 3: Trait Strata — 5 colored bands */}
			<section
				data-slot="trait-strata"
				className="max-w-[1120px] mx-auto px-5 py-10 flex flex-col gap-[1px]"
			>
				{BIG_FIVE_TRAITS.map((traitName) => {
					const traitData = traits.find((t) => t.name === traitName);
					if (!traitData) return null;
					const traitFacets = facets.filter((f) => f.traitName === traitName);
					return <TraitBand key={traitName} trait={traitData} facets={traitFacets} />;
				})}
			</section>

			{/* Section 4: Archetype Description */}
			<ArchetypeDescriptionSection
				archetypeName={profile.archetypeName}
				description={profile.description}
				oceanCode={profile.oceanCode}
				dominantTrait={dominantTrait}
				secondaryTrait={secondaryTrait}
			/>

			{/* Section 5: CTA */}
			<PublicProfileCTA
				displayName={displayName}
				publicProfileId={publicProfileId}
				authState={authState}
			/>
		</div>
	);
}
