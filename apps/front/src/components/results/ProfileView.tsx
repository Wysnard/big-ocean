import type { FacetName, FacetResult, OceanCode5, TraitName, TraitResult } from "@workspace/domain";
import type { ReactNode } from "react";
import { WaveDivider } from "../home/WaveDivider";
import { ArchetypeHeroSection } from "./ArchetypeHeroSection";
import { TraitScoresSection } from "./TraitScoresSection";

interface ProfileViewProps {
	archetypeName: string;
	oceanCode5: OceanCode5;
	description: string;
	dominantTrait: TraitName;
	traits: readonly TraitResult[];
	facets: readonly FacetResult[];
	expandedTraits?: Set<string>;
	onToggleTrait?: (trait: string) => void;
	onViewEvidence?: (facetName: FacetName) => void;
	overallConfidence?: number;
	isCurated?: boolean;
	/** When set, shows the profile owner's name instead of "Your" */
	displayName?: string | null;
	children?: ReactNode;
}

export function ProfileView({
	archetypeName,
	oceanCode5,
	description,
	dominantTrait,
	traits,
	facets,
	expandedTraits,
	onToggleTrait,
	onViewEvidence,
	overallConfidence,
	isCurated,
	displayName,
	children,
}: ProfileViewProps) {
	return (
		<div className="min-h-screen">
			{/* Depth Zone: Surface — Hero */}
			<div className="bg-[var(--depth-surface)]">
				<ArchetypeHeroSection
					archetypeName={archetypeName}
					oceanCode5={oceanCode5}
					archetypeDescription={description}
					overallConfidence={overallConfidence}
					isCurated={isCurated}
					dominantTrait={dominantTrait}
					displayName={displayName}
				/>
			</div>

			{/* Wave transition: surface → shallows */}
			<WaveDivider fromColor="var(--depth-surface)" className="text-[var(--depth-shallows)]" />

			{/* Depth Zone: Shallows — Trait scores */}
			<div className="bg-[var(--depth-shallows)]">
				<TraitScoresSection
					traits={traits}
					facets={facets}
					expandedTraits={expandedTraits}
					onToggleTrait={onToggleTrait}
					onViewEvidence={onViewEvidence}
					displayName={displayName}
				/>
			</div>

			{/* Page-specific sections */}
			{children}
		</div>
	);
}
