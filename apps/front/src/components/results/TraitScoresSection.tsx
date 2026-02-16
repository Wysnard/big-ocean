import type { FacetName, FacetResult, TraitLevel, TraitName, TraitResult } from "@workspace/domain";
import {
	FACET_DESCRIPTIONS,
	FACET_LEVEL_LABELS,
	getFacetColor,
	getFacetLevel,
	getTraitColor,
	TRAIT_DESCRIPTIONS,
	TRAIT_NAMES,
	toFacetDisplayName,
} from "@workspace/domain";
import { Button } from "@workspace/ui/components/button";
import { FileText } from "lucide-react";
import type { ReactNode } from "react";
import { OceanCircle } from "../ocean-shapes/OceanCircle";
import { OceanDiamond } from "../ocean-shapes/OceanDiamond";
import { OceanHalfCircle } from "../ocean-shapes/OceanHalfCircle";
import { OceanRectangle } from "../ocean-shapes/OceanRectangle";
import { OceanTriangle } from "../ocean-shapes/OceanTriangle";

/** OCEAN shape mapping per trait */
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

const MAX_TRAIT_SCORE = 120;

interface TraitScoresSectionProps {
	traits: readonly TraitResult[];
	facets: readonly FacetResult[];
	expandedTraits?: Set<string>;
	onToggleTrait?: (trait: string) => void;
	onViewEvidence?: (facetName: FacetName) => void;
	/** When set, shows "{name}'s Trait Scores" instead of "Your Trait Scores" */
	displayName?: string | null;
}

export function TraitScoresSection({
	traits,
	facets,
	expandedTraits,
	onToggleTrait,
	onViewEvidence,
	displayName,
}: TraitScoresSectionProps) {
	const hasFacets = facets.length > 0;

	return (
		<section data-slot="trait-scores-section" className="px-6 py-12">
			<div className="mx-auto max-w-2xl">
				<h2 className="text-xl font-bold text-foreground mb-6">
					{displayName ? `${displayName}\u2019s Trait Scores` : "Your Trait Scores"}
				</h2>
				<div className="space-y-5">
					{TRAIT_NAMES.map((trait) => {
						const traitData = traits.find((t) => t.name === trait);
						if (!traitData) return null;

						const percentage = Math.round((traitData.score / MAX_TRAIT_SCORE) * 100);
						const traitFacets = hasFacets ? facets.filter((f) => f.traitName === trait) : [];
						const isExpanded = expandedTraits?.has(trait) ?? false;
						const traitColor = getTraitColor(trait);
						const ShapeComponent = TRAIT_SHAPE[trait];

						const headerContent = (
							<>
								<div className="flex items-center justify-between mb-2">
									<div className="flex items-center gap-2">
										<ShapeComponent size={20} color={traitColor} />
										<span className="text-sm font-medium text-foreground">{TRAIT_LABELS[trait]}</span>
										{hasFacets && (
											<svg
												className={`h-4 w-4 text-muted-foreground motion-safe:transition-transform motion-safe:duration-200 ${isExpanded ? "rotate-180" : ""}`}
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
												strokeWidth={2}
												aria-hidden="true"
											>
												<path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
											</svg>
										)}
									</div>
									<span className="text-sm font-semibold text-foreground">{percentage}%</span>
								</div>
								<div className="w-full bg-muted rounded-full h-2.5">
									<div
										className="h-2.5 rounded-full motion-safe:transition-all motion-safe:duration-500"
										style={{
											width: `${percentage}%`,
											backgroundColor: traitColor,
										}}
									/>
								</div>
							</>
						);

						return (
							<div
								key={trait}
								data-testid={`trait-card-${trait}`}
								className="border border-border rounded-lg p-4 bg-card"
							>
								{hasFacets && onToggleTrait ? (
									<button
										onClick={() => onToggleTrait(trait)}
										data-testid={`trait-toggle-${trait}`}
										className="w-full text-left"
										type="button"
									>
										{headerContent}
									</button>
								) : (
									<div>{headerContent}</div>
								)}

								{/* Tagline + level description — shown when expanded */}
								{isExpanded && (
									<div className="mt-3">
										<span className="text-xs text-muted-foreground">{TRAIT_DESCRIPTIONS[trait].tagline}</span>
										<p
											data-slot="trait-description"
											className="text-sm text-muted-foreground leading-relaxed mt-3"
										>
											{
												(TRAIT_DESCRIPTIONS[trait].levels as Record<TraitLevel, string>)[
													traitData.level as TraitLevel
												]
											}
										</p>
									</div>
								)}

								{/* Facets — shown when expanded */}
								{isExpanded && traitFacets.length > 0 && (
									<div className="mt-4 space-y-3 pl-2 border-l-2 border-border">
										{traitFacets.map((facet) => {
											const facetPercentage = Math.round((facet.score / 20) * 100);
											return (
												<div key={facet.name} id={`facet-${facet.name}`} className="pl-4">
													<div className="flex items-center justify-between mb-1">
														<div className="flex items-center gap-1.5">
															<span className="text-xs text-muted-foreground">
																{toFacetDisplayName(facet.name)}
															</span>
															<span
																data-slot="facet-level-label"
																className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
															>
																{FACET_LEVEL_LABELS[getFacetLevel(facet.name, facet.score)]}
															</span>
														</div>
														<div className="flex items-center gap-2">
															<span className="text-xs text-muted-foreground">
																{facet.score}/20 ({facet.confidence}%)
															</span>
															{onViewEvidence && (
																<Button
																	onClick={() => onViewEvidence(facet.name)}
																	size="sm"
																	variant="ghost"
																	className="h-7 px-2 text-xs hover:bg-accent"
																>
																	<FileText className="w-3 h-3 mr-1" />
																	Evidence
																</Button>
															)}
														</div>
													</div>
													<div className="w-full bg-muted rounded-full h-1.5">
														<div
															className="h-1.5 rounded-full opacity-70"
															style={{
																width: `${facetPercentage}%`,
																backgroundColor: getFacetColor(facet.name),
																opacity: 0.7,
															}}
														/>
													</div>
													<p
														data-slot="facet-description"
														className="text-xs text-muted-foreground leading-relaxed mt-1.5"
													>
														{
															(FACET_DESCRIPTIONS[facet.name].levels as Record<string, string>)[
																getFacetLevel(facet.name, facet.score)
															]
														}
													</p>
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
		</section>
	);
}
