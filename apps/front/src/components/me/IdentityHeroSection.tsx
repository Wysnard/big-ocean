import type { GetResultsResponse } from "@workspace/contracts";
import { ArchetypeHeroSection } from "@/components/results/ArchetypeHeroSection";
import { ConfidenceRingCard } from "@/components/results/ConfidenceRingCard";
import { OceanCodeStrand } from "@/components/results/OceanCodeStrand";
import { PersonalityRadarChart } from "@/components/results/PersonalityRadarChart";
import { getDominantTrait } from "@/lib/trait-utils";

interface IdentityHeroSectionProps {
	/**
	 * Full results object from useGetResults — no duplicate fetch.
	 * overallConfidence is on a 0-100 scale from the API; we divide by 100
	 * before passing to ArchetypeHeroSection and ConfidenceRingCard which
	 * both expect a 0-1 input.
	 */
	results: GetResultsResponse;
}

export function IdentityHeroSection({ results }: IdentityHeroSectionProps) {
	const dominantTrait = getDominantTrait([...results.traits]);

	// API returns overallConfidence on 0-100 scale (e.g. 68).
	// ArchetypeHeroSection and ConfidenceRingCard both do `confidence * 100`
	// internally, so we normalise to 0-1 here.
	const confidenceNormalised = results.overallConfidence / 100;

	return (
		<div className="overflow-hidden -m-6 sm:-m-8">
			{/* ArchetypeHeroSection renders its own <section> element.
			    MePageSection owns the outer <section> landmark (aria-label="Identity Hero"),
			    so we deliberately omit sectionLabel here to avoid duplicate landmarks. */}
			<ArchetypeHeroSection
				archetypeName={results.archetypeName}
				oceanCode5={results.oceanCode5}
				dominantTrait={dominantTrait}
				description={results.archetypeDescription}
				overallConfidence={confidenceNormalised}
				isCurated={results.isCurated}
				containerElement="div"
				/* No displayName — this is the user's own page ("Your Personality Archetype") */
				/* No showScrollIndicator — only for the results hero */
				/* No sectionLabel — MePageSection owns the landmark */
			/>

			{/* OceanCodeStrand — full width */}
			<div className="px-6 pb-6 pt-4 space-y-5 sm:px-8 sm:pb-8">
				<OceanCodeStrand oceanCode5={results.oceanCode5} />

				{/* PersonalityRadarChart + ConfidenceRingCard — side-by-side on sm+ */}
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
					<PersonalityRadarChart traits={results.traits} />
					<ConfidenceRingCard confidence={confidenceNormalised} messageCount={results.messageCount} />
				</div>
			</div>
		</div>
	);
}
