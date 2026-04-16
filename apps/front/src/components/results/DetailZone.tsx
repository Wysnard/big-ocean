"use client";

import type { SavedFacetEvidence } from "@workspace/contracts";
import type { FacetName, TraitLevel, TraitName, TraitResult } from "@workspace/domain";
import { TRAIT_TO_FACETS, toFacetDisplayName } from "@workspace/domain";
import { AccentCard, Card, CardAccent, CardContent } from "@workspace/ui/components/card";
import type { ChartConfig } from "@workspace/ui/components/chart";
import { ChartContainer } from "@workspace/ui/components/chart";
import { OceanHieroglyph } from "@workspace/ui/components/ocean-hieroglyph";
import { X } from "lucide-react";
import { type KeyboardEvent, useEffect, useMemo, useState } from "react";
import { Label, PolarGrid, PolarRadiusAxis, RadialBar, RadialBarChart } from "recharts";
import { formatDeviation, getDomainLabel, getSignalBadge } from "./evidence-utils";

/** Maps each trait to its "High" letter for use as representative hieroglyph */
const TRAIT_HIEROGLYPH_LETTER: Record<TraitName, TraitLevel> = {
	openness: "O",
	conscientiousness: "C",
	extraversion: "E",
	agreeableness: "A",
	neuroticism: "N",
};

const TRAIT_LABELS: Record<TraitName, string> = {
	openness: "Openness",
	conscientiousness: "Conscientiousness",
	extraversion: "Extraversion",
	agreeableness: "Agreeableness",
	neuroticism: "Neuroticism",
};

const confidenceChartConfig: ChartConfig = {
	confidence: { label: "Confidence", color: "var(--primary)" },
};

/** Widen `MediaQueryList` so legacy `addListener` / optional `addEventListener` can be expressed for older WebKit. */
type MediaQueryListCompat = Omit<MediaQueryList, "addEventListener" | "removeEventListener"> & {
	addEventListener?: MediaQueryList["addEventListener"];
	removeEventListener?: MediaQueryList["removeEventListener"];
	addListener?: (listener: (this: MediaQueryList, ev: MediaQueryListEvent) => void) => void;
	removeListener?: (listener: (this: MediaQueryList, ev: MediaQueryListEvent) => void) => void;
};

function FacetConfidenceRing({ confidence }: { confidence: number }) {
	const displayConfidence = Math.round(confidence * 100);
	const endAngle = confidence * 360;
	const chartData = useMemo(
		() => [{ confidence: displayConfidence, fill: "var(--color-confidence)" }],
		[displayConfidence],
	);

	const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
		if (typeof window === "undefined" || !window.matchMedia) return false;
		return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	});
	useEffect(() => {
		if (typeof window === "undefined" || !window.matchMedia) return;
		const mql = window.matchMedia("(prefers-reduced-motion: reduce)") as MediaQueryListCompat;
		const sync = () => setPrefersReducedMotion(mql.matches);
		sync();
		if (typeof mql.addEventListener === "function") {
			mql.addEventListener("change", sync);
			return () => mql.removeEventListener?.("change", sync);
		}
		if (typeof mql.addListener === "function") {
			mql.addListener(sync);
			return () => mql.removeListener?.(sync);
		}
		return () => {};
	}, []);

	return (
		<ChartContainer
			config={confidenceChartConfig}
			className="size-10"
			role="img"
			aria-label={`Facet evidence confidence: ${displayConfidence}%`}
		>
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
				<RadialBar
					dataKey="confidence"
					background
					cornerRadius={10}
					isAnimationActive={!prefersReducedMotion}
				/>
				<PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
					<Label
						content={({ viewBox }) => {
							if (viewBox && "cx" in viewBox && "cy" in viewBox) {
								return (
									<text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
										<tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-[8px] font-semibold">
											{displayConfidence}
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
	onFacetClick?: (facetName: FacetName, triggerElement?: HTMLElement | null) => void;
}

export function DetailZone({
	trait,
	facetDetails,
	isOpen,
	onClose,
	isLoading,
	onFacetClick,
}: DetailZoneProps) {
	const traitVar = `var(--trait-${trait.name})`;
	const levelLetter = trait.score < 40 ? "Low" : trait.score < 80 ? "Mid" : "High";
	const totalEvidence = facetDetails.reduce((sum, f) => sum + f.evidence.length, 0);
	const regionTitleId = `trait-detail-zone-title-${trait.name}`;
	const regionId = `trait-detail-zone-${trait.name}`;

	const handleFacetKeyDown = (facetName: FacetName) => (event: KeyboardEvent<HTMLDivElement>) => {
		if (!onFacetClick) return;
		if (event.key !== "Enter" && event.key !== " ") return;
		event.preventDefault();
		onFacetClick(facetName, event.currentTarget);
	};

	return (
		<section
			id={regionId}
			data-slot="detail-zone"
			data-trait={trait.name}
			aria-labelledby={regionTitleId}
			className="col-span-full overflow-hidden motion-safe:transition-all motion-safe:duration-400"
			style={{
				maxHeight: isOpen ? "2000px" : "0px",
				opacity: isOpen ? 1 : 0,
			}}
		>
			<div className="rounded-xl border bg-card p-5" style={{ borderColor: traitVar }}>
				{/* Header */}
				<div className="flex items-center justify-between mb-5">
					<div className="flex items-center gap-3">
						<OceanHieroglyph
							letter={TRAIT_HIEROGLYPH_LETTER[trait.name]}
							style={{ width: 24, height: 24 }}
						/>
						<div>
							<h3 id={regionTitleId} className="text-lg font-display font-semibold text-foreground">
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
						className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full p-1.5 hover:bg-muted motion-safe:transition-colors"
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
								className="p-4 gap-0 rounded-lg shadow-none animate-pulse motion-reduce:animate-none"
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
									className={`min-h-11 flex-row${onFacetClick ? " cursor-pointer hover:ring-1 hover:ring-primary/30 motion-safe:transition-shadow" : ""}`}
									onClick={
										onFacetClick ? (event) => onFacetClick(facet.name, event.currentTarget) : undefined
									}
									role={onFacetClick ? "button" : undefined}
									tabIndex={onFacetClick ? 0 : undefined}
									aria-label={
										onFacetClick ? `Open evidence for ${toFacetDisplayName(facet.name)}` : undefined
									}
									onKeyDown={onFacetClick ? handleFacetKeyDown(facet.name) : undefined}
								>
									<CardAccent position="left" style={{ backgroundColor: traitVar }} />
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
										<div
											className="w-full bg-muted rounded-full h-1.5 mb-3"
											role="progressbar"
											aria-valuenow={facet.score}
											aria-valuemin={0}
											aria-valuemax={20}
											aria-label={`${toFacetDisplayName(facet.name)}: ${facet.score} out of 20`}
										>
											<div
												className="h-1.5 rounded-full motion-safe:transition-[width] motion-safe:duration-500 motion-safe:ease-out"
												style={{ width: `${facetPct}%`, backgroundColor: traitVar, opacity: 0.7 }}
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
													<div className="flex items-center gap-1.5 flex-wrap">
														<span
															className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${badge.className}`}
														>
															{badge.label}
														</span>
														<span className="inline-block rounded-full px-2 py-0.5 text-[10px] font-medium bg-muted text-muted-foreground">
															{getDomainLabel(ev.domain)}
														</span>
														<span className="text-[10px] font-medium text-muted-foreground">
															{formatDeviation(ev.deviation)}
														</span>
													</div>
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
		</section>
	);
}
