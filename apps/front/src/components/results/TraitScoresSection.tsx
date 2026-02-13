import type { FacetName, TraitName } from "@workspace/domain";
import { getFacetColor, getTraitColor } from "@workspace/domain";
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

const TRAIT_ORDER: TraitName[] = [
	"openness",
	"conscientiousness",
	"extraversion",
	"agreeableness",
	"neuroticism",
];

const MAX_TRAIT_SCORE = 120;

interface TraitData {
	name: string;
	score: number;
	level: string;
	confidence: number;
}

interface FacetData {
	name: string;
	traitName: string;
	score: number;
	confidence: number;
}

interface TraitScoresSectionProps {
	traits: TraitData[];
	facets: FacetData[];
	expandedTraits: Set<string>;
	onToggleTrait: (trait: string) => void;
	onViewEvidence: (facetName: FacetName) => void;
}

export function TraitScoresSection({
	traits,
	facets,
	expandedTraits,
	onToggleTrait,
	onViewEvidence,
}: TraitScoresSectionProps) {
	return (
		<section data-slot="trait-scores-section" className="px-6 py-12">
			<div className="mx-auto max-w-2xl">
				<h2 className="text-xl font-bold text-foreground mb-6">
					Your Trait Scores
				</h2>
				<div className="space-y-5">
					{TRAIT_ORDER.map((trait) => {
						const traitData = traits.find((t) => t.name === trait);
						if (!traitData) return null;

						const traitName = trait as TraitName;
						const percentage = Math.round((traitData.score / MAX_TRAIT_SCORE) * 100);
						const traitFacets = facets.filter((f) => f.traitName === trait);
						const isExpanded = expandedTraits.has(trait);
						const traitColor = getTraitColor(traitName);
						const ShapeComponent = TRAIT_SHAPE[traitName];

						return (
							<div key={trait} className="border border-border rounded-lg p-4 bg-card">
								{/* Trait Header — clickable to expand */}
								<button
									onClick={() => onToggleTrait(trait)}
									className="w-full text-left"
									type="button"
								>
									<div className="flex items-center justify-between mb-2">
										<div className="flex items-center gap-2">
											<ShapeComponent size={20} color={traitColor} />
											<span className="text-sm font-medium text-foreground">
												{TRAIT_LABELS[traitName]}
											</span>
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
										</div>
										<span className="text-sm font-semibold text-foreground">
											{percentage}%
										</span>
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
								</button>

								{/* Facets — shown when expanded */}
								{isExpanded && (
									<div className="mt-4 space-y-3 pl-2 border-l-2 border-border">
										{traitFacets.map((facet) => {
											const facetPercentage = Math.round((facet.score / 20) * 100);
											const facetId = facet.name.toLowerCase().replace(/ /g, "_");
											return (
												<div key={facet.name} id={`facet-${facetId}`} className="pl-4">
													<div className="flex items-center justify-between mb-1">
														<span className="text-xs text-muted-foreground">
															{facet.name}
														</span>
														<div className="flex items-center gap-2">
															<span className="text-xs text-muted-foreground">
																{facet.score}/20 ({facet.confidence}%)
															</span>
															<Button
																onClick={() => onViewEvidence(facetId as FacetName)}
																size="sm"
																variant="ghost"
																className="h-7 px-2 text-xs hover:bg-accent"
															>
																<FileText className="w-3 h-3 mr-1" />
																Evidence
															</Button>
														</div>
													</div>
													<div className="w-full bg-muted rounded-full h-1.5">
														<div
															className="h-1.5 rounded-full opacity-70"
															style={{
																width: `${facetPercentage}%`,
																backgroundColor: getFacetColor(facetId as FacetName),
														opacity: 0.7,
															}}
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
		</section>
	);
}
