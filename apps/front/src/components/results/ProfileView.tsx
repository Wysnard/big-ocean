import type { PortraitStatus } from "@workspace/contracts";
import type { FacetResult, OceanCode5, TraitName, TraitResult } from "@workspace/domain";
import type { ReactNode, Ref } from "react";
import { ArchetypeHeroSection } from "./ArchetypeHeroSection";
import { ConfidenceRingCard } from "./ConfidenceRingCard";
import { OceanCodeStrand } from "./OceanCodeStrand";
import { PersonalityRadarChart } from "./PersonalityRadarChart";
import { PersonalPortrait } from "./PersonalPortrait";
import { PortraitUnlockCta } from "./PortraitUnlockCta";
import { TraitCard } from "./TraitCard";

/** Row 1 traits (3-up on desktop) — detail zone inserts after this row */
const ROW_1_TRAITS: TraitName[] = ["openness", "conscientiousness", "extraversion"];
/** Row 2 traits (2-up on desktop) — detail zone inserts after this row */
const ROW_2_TRAITS: TraitName[] = ["agreeableness", "neuroticism"];

interface ProfileViewProps {
	archetypeName: string;
	oceanCode5: OceanCode5;
	description?: string | null;
	dominantTrait: TraitName;
	traits: readonly TraitResult[];
	facets: readonly FacetResult[];
	onToggleTrait?: (trait: string) => void;
	overallConfidence?: number;
	isCurated?: boolean;
	/** When set, shows the profile owner's name instead of "Your" */
	displayName?: string | null;
	/** Full portrait content when available (Story 13.3) */
	fullPortraitContent?: string | null;
	/** Full portrait generation status (Story 13.3) */
	fullPortraitStatus?: PortraitStatus;
	/** Callback to retry failed portrait generation (Story 13.3) */
	onRetryPortrait?: () => void;
	/** Callback to open PWYW modal for portrait unlock (Story 3.4) */
	onUnlockPortrait?: () => void;
	/** Ref to the inline portrait unlock trigger for focus restoration */
	portraitUnlockTriggerRef?: Ref<HTMLButtonElement>;
	/** Current selected trait for DetailZone */
	selectedTrait?: TraitName | null;
	/** Total message count for confidence ring */
	messageCount?: number;
	/** Detail zone content (rendered below the correct trait row when a trait is selected) */
	detailZone?: ReactNode;
	/** Quick actions card (rendered after all trait cards + detail zone, inside the grid) */
	quickActions?: ReactNode;
	children?: ReactNode;
}

export function ProfileView({
	archetypeName,
	oceanCode5,
	description,
	dominantTrait,
	traits,
	facets,
	onToggleTrait,
	overallConfidence,
	isCurated,
	displayName,
	fullPortraitContent,
	fullPortraitStatus,
	onRetryPortrait,
	onUnlockPortrait,
	portraitUnlockTriggerRef,
	selectedTrait,
	messageCount,
	detailZone,
	quickActions,
	children,
}: ProfileViewProps) {
	const archetypeSectionLabel = displayName ? `${displayName}\u2019s archetype` : "Your archetype";
	const portraitSectionLabel = displayName ? `${displayName}\u2019s portrait` : "Your portrait";
	const traitsSectionLabel = displayName ? `${displayName}\u2019s traits` : "Your traits";

	const renderTraitCards = (traitNames: TraitName[]) =>
		traitNames.map((traitName) => {
			const traitData = traits.find((t) => t.name === traitName);
			if (!traitData) return null;
			const traitFacets = facets.filter((f) => f.traitName === traitName);
			return (
				<TraitCard
					key={traitName}
					trait={traitData}
					facets={traitFacets}
					isSelected={selectedTrait === traitName}
					onToggle={onToggleTrait ?? (() => {})}
				/>
			);
		});

	return (
		<div data-slot="profile-view" className="min-h-screen bg-depth-surface">
			{/* Hero — full width above grid */}
			<ArchetypeHeroSection
				archetypeName={archetypeName}
				oceanCode5={oceanCode5}
				overallConfidence={overallConfidence}
				isCurated={isCurated}
				dominantTrait={dominantTrait}
				description={description}
				displayName={displayName}
				sectionLabel={archetypeSectionLabel}
			/>

			{/* Single CSS Grid container */}
			<div className="mx-auto max-w-[1120px] px-5 py-10">
				<div className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-5">
					{/* Portrait section (Story 13.3 + 3.4) */}
					{fullPortraitContent ||
					fullPortraitStatus === "generating" ||
					fullPortraitStatus === "failed" ? (
						<section aria-labelledby="results-portrait-heading" className="col-span-full">
							<h2 id="results-portrait-heading" className="sr-only">
								{portraitSectionLabel}
							</h2>
							<PersonalPortrait
								displayName={displayName}
								fullPortraitContent={fullPortraitContent}
								fullPortraitStatus={fullPortraitStatus}
								onRetryPortrait={onRetryPortrait}
							/>
						</section>
					) : onUnlockPortrait ? (
						<section aria-labelledby="results-portrait-heading" className="col-span-full">
							<h2 id="results-portrait-heading" className="sr-only">
								{portraitSectionLabel}
							</h2>
							<PortraitUnlockCta ref={portraitUnlockTriggerRef} onUnlock={onUnlockPortrait} />
						</section>
					) : null}

					<section aria-labelledby="results-traits-heading" className="col-span-full space-y-5">
						<h2 id="results-traits-heading" className="sr-only">
							{traitsSectionLabel}
						</h2>

						{/* Ocean Code Strand — full width */}
						<OceanCodeStrand
							oceanCode5={oceanCode5}
							displayName={displayName}
							description={description}
						/>

						{/* Radar + Confidence side-by-side (AC #4, #5) */}
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
							<PersonalityRadarChart traits={traits} />
							{overallConfidence != null && (
								<ConfidenceRingCard confidence={overallConfidence} messageCount={messageCount ?? 0} />
							)}
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-5">
							{/* Trait Cards Row 1: O, C, E (AC #6) */}
							{renderTraitCards(ROW_1_TRAITS)}

							{/* Detail Zone for Row 1 — inserted after 3rd card (AC #7) */}
							{selectedTrait && ROW_1_TRAITS.includes(selectedTrait) && detailZone}

							{/* Trait Cards Row 2: A, N (AC #6) */}
							{renderTraitCards(ROW_2_TRAITS)}

							{/* Detail Zone for Row 2 — inserted after 5th card (AC #7) */}
							{selectedTrait && ROW_2_TRAITS.includes(selectedTrait) && detailZone}

							{/* Quick Actions (AC #8) */}
							{quickActions && <div className="col-span-full">{quickActions}</div>}
						</div>
					</section>
				</div>
			</div>

			{children}
		</div>
	);
}
