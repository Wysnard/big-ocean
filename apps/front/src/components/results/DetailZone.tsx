"use client";

import type { SavedFacetEvidence } from "@workspace/contracts";
import type { FacetName, TraitName, TraitResult } from "@workspace/domain";
import { getTraitColor, TRAIT_TO_FACETS, toFacetDisplayName } from "@workspace/domain";
import { AccentCard, Card, CardAccent, CardContent } from "@workspace/ui/components/card";
import type { ChartConfig } from "@workspace/ui/components/chart";
import { ChartContainer } from "@workspace/ui/components/chart";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo } from "react";
import { Label, PolarGrid, PolarRadiusAxis, RadialBar, RadialBarChart } from "recharts";
import { OceanCircle } from "../ocean-shapes/OceanCircle";
import { OceanDiamond } from "../ocean-shapes/OceanDiamond";
import { OceanHalfCircle } from "../ocean-shapes/OceanHalfCircle";
import { OceanRectangle } from "../ocean-shapes/OceanRectangle";
import { OceanTriangle } from "../ocean-shapes/OceanTriangle";

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

function getSignalBadge(confidence: number): { label: string; className: string } {
	if (confidence >= 70) {
		return {
			label: "Strong",
			className: "bg-[oklch(0.67_0.13_181/0.15)] text-[oklch(0.45_0.13_181)]",
		};
	}
	if (confidence >= 40) {
		return {
			label: "Moderate",
			className: "bg-[oklch(0.67_0.20_42/0.15)] text-[oklch(0.50_0.20_42)]",
		};
	}
	return {
		label: "Weak",
		className: "bg-[oklch(0.29_0.19_272/0.10)] text-[oklch(0.40_0.10_272)]",
	};
}

const confidenceChartConfig: ChartConfig = {
	confidence: { label: "Confidence", color: "var(--primary)" },
};

function FacetConfidenceRing({ confidence }: { confidence: number }) {
	const endAngle = (confidence / 100) * 360;
	const chartData = useMemo(() => [{ confidence, fill: "var(--color-confidence)" }], [confidence]);

	return (
		<ChartContainer config={confidenceChartConfig} className="size-10">
			<RadialBarChart
				data={chartData}
				startAngle={0}
				endAngle={endAngle}
				innerRadius={14}
				outerRadius={20}
			>
				<PolarGrid
					gridType="circle"
					radialLines={false}
					stroke="none"
					className="first:fill-muted last:fill-background"
					polarRadius={[17, 11]}
				/>
				<RadialBar dataKey="confidence" background cornerRadius={10} />
				<PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
					<Label
						content={({ viewBox }) => {
							if (viewBox && "cx" in viewBox && "cy" in viewBox) {
								return (
									<text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
										<tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-[8px] font-semibold">
											{Math.round(confidence)}
										</tspan>
									</text>
								);
							}
						}}
					/>
				</PolarRadiusAxis>
			</RadialBarChart>
		</ChartContainer>
	);
}

interface FacetDetail {
	name: FacetName;
	score: number;
	confidence: number;
	evidence: SavedFacetEvidence[];
}

interface DetailZoneProps {
	trait: TraitResult;
	facetDetails: FacetDetail[];
	isOpen: boolean;
	onClose: () => void;
	isLoading: boolean;
}

export function DetailZone({ trait, facetDetails, isOpen, onClose, isLoading }: DetailZoneProps) {
	const traitColor = getTraitColor(trait.name);
	const ShapeComponent = TRAIT_SHAPE[trait.name];
	const levelLetter = trait.score < 40 ? "Low" : trait.score < 80 ? "Mid" : "High";
	const totalEvidence = facetDetails.reduce((sum, f) => sum + f.evidence.length, 0);

	return (
		<div
			data-slot="detail-zone"
			data-trait={trait.name}
			className="col-span-full overflow-hidden motion-safe:transition-all motion-safe:duration-400"
			style={{
				maxHeight: isOpen ? "2000px" : "0px",
				opacity: isOpen ? 1 : 0,
			}}
		>
			<div className="rounded-xl border bg-card p-5" style={{ borderColor: traitColor }}>
				{/* Header */}
				<div className="flex items-center justify-between mb-5">
					<div className="flex items-center gap-3">
						<ShapeComponent size={24} color={traitColor} />
						<div>
							<h3 className="text-lg font-display font-semibold text-foreground">
								{TRAIT_LABELS[trait.name]} — Evidence
							</h3>
							<p className="text-sm text-muted-foreground">
								Score: {trait.score}/120 · {levelLetter} · {totalEvidence} evidence items
							</p>
						</div>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="rounded-full p-1.5 hover:bg-muted motion-safe:transition-colors"
						aria-label="Close detail zone"
					>
						<X className="w-4 h-4 text-muted-foreground" />
					</button>
				</div>

				{/* Loading skeleton */}
				{isLoading && (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{Array.from({ length: 6 }).map((_, i) => (
							<Card
								key={`skeleton-${TRAIT_TO_FACETS[trait.name][i] ?? i}`}
								className="p-4 gap-0 rounded-lg shadow-none animate-pulse"
							>
								<div className="h-4 w-24 bg-muted rounded mb-2" />
								<div className="h-2 w-full bg-muted rounded mb-3" />
								<div className="h-16 w-full bg-muted rounded" />
							</Card>
						))}
					</div>
				)}

				{/* Facet detail grid */}
				{!isLoading && (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{facetDetails.map((facet) => {
							const facetPct = Math.round((facet.score / 20) * 100);
							return (
								<AccentCard
									key={facet.name}
									data-slot="facet-detail-card"
									data-facet={facet.name}
									className="flex-row"
								>
									<CardAccent position="left" style={{ backgroundColor: traitColor }} />
									<CardContent className="flex-1 p-4">
										{/* Facet header */}
										<div className="flex items-center justify-between mb-2">
											<span className="text-sm font-medium text-foreground">
												{toFacetDisplayName(facet.name)}
											</span>
											<div className="flex items-center gap-1">
												<span className="text-xs text-muted-foreground">{facet.score}/20</span>
												<FacetConfidenceRing confidence={facet.confidence} />
											</div>
										</div>

										{/* Score bar */}
										<div className="w-full bg-muted rounded-full h-1.5 mb-3">
											<div
												className="h-1.5 rounded-full"
												style={{ width: `${facetPct}%`, backgroundColor: traitColor, opacity: 0.7 }}
											/>
										</div>

										{/* Evidence quotes */}
										{facet.evidence.length === 0 && (
											<p className="text-xs text-muted-foreground italic">No evidence recorded</p>
										)}
										{facet.evidence.map((ev) => {
											const badge = getSignalBadge(ev.confidence);
											return (
												<div key={ev.id} className="mb-2 last:mb-0">
													<p className="text-xs italic text-foreground/80 mb-1">&ldquo;{ev.quote}&rdquo;</p>
													<span
														className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${badge.className}`}
													>
														{badge.label}
													</span>
												</div>
											);
										})}
									</CardContent>
								</AccentCard>
							);
						})}
					</div>
				)}
			</div>
		</div>
	);
}
