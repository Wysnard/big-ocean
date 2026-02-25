"use client";

import type { TraitName, TraitResult } from "@workspace/domain";
import { getTraitColor, TRAIT_NAMES } from "@workspace/domain";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import type { ChartConfig } from "@workspace/ui/components/chart";
import { ChartContainer } from "@workspace/ui/components/chart";
import { cn } from "@workspace/ui/lib/utils";
import { memo, useCallback, useMemo } from "react";
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart } from "recharts";

const TRAIT_LABELS: Record<TraitName, string> = {
	openness: "Openness",
	conscientiousness: "Conscientiousness",
	extraversion: "Extraversion",
	agreeableness: "Agreeableness",
	neuroticism: "Neuroticism",
};

const MAX_TRAIT_SCORE = 120;

const GRADIENT_ID = "radar-trait-gradient";

const chartConfig: ChartConfig = {
	score: { label: "Score" },
};

interface RadarShapePoint {
	x: number;
	y: number;
}

interface ChartDataItem {
	trait: TraitName;
	label: string;
	score: number;
	fill: string;
}

interface PersonalityRadarChartProps {
	traits: readonly TraitResult[];
	/** Override chart width in px. Default uses ChartContainer responsive sizing. */
	width?: number;
	/** Override chart height in px. Default uses ChartContainer responsive sizing. */
	height?: number;
	/** Show large external score labels at each vertex (e.g. "O: 87"). Default false. */
	showExternalLabels?: boolean;
	/** When true, renders without Card wrapper (for embedded use). Default false. */
	standalone?: boolean;
}

export const PersonalityRadarChart = memo(function PersonalityRadarChart({
	traits,
	width,
	height,
	showExternalLabels = false,
	standalone = false,
}: PersonalityRadarChartProps) {
	const chartData = useMemo<ChartDataItem[]>(
		() =>
			TRAIT_NAMES.map((traitName) => {
				const trait = traits.find((t) => t.name === traitName);
				const score = trait?.score ?? 0;
				return {
					trait: traitName,
					label: TRAIT_LABELS[traitName],
					score,
					fill: getTraitColor(traitName),
				};
			}),
		[traits],
	);

	// Custom shape: single polygon with trait-color linear gradient fill + stroke
	const renderGradientShape = useCallback(
		(props: { points?: RadarShapePoint[] }) => {
			const { points } = props;
			if (!points || points.length === 0) return null;

			const pointsStr = points.map((p) => `${p.x},${p.y}`).join(" ");

			return (
				<g data-slot="radar-shape">
					<defs>
						<linearGradient id={GRADIENT_ID} x1="0%" y1="0%" x2="100%" y2="100%">
							{chartData.map((item, i) => (
								<stop
									key={item.trait}
									offset={`${(i / (chartData.length - 1)) * 100}%`}
									stopColor={item.fill}
								/>
							))}
						</linearGradient>
					</defs>
					<polygon points={pointsStr} fill={`url(#${GRADIENT_ID})`} fillOpacity={0.25} stroke="none" />
				</g>
			);
		},
		[chartData],
	);

	const renderTick = useCallback(
		({ x, y, payload }: { x: number; y: number; payload: { value: TraitName } }) => {
			const item = chartData.find((d) => d.trait === payload.value);

			if (showExternalLabels) {
				return (
					<g key={payload.value} transform={`translate(${x},${y})`}>
						<text
							textAnchor="middle"
							className="font-data font-bold"
							style={{ fill: item?.fill ?? "currentColor", fontSize: "18px" }}
							dy={-6}
						>
							{item?.label?.charAt(0) ?? ""}: {item?.score ?? 0}
						</text>
					</g>
				);
			}

			return (
				<g key={payload.value} transform={`translate(${x},${y})`}>
					<text
						textAnchor="middle"
						fill="currentColor"
						className="text-[11px] fill-foreground/70"
						dy={-4}
					>
						{item?.label ?? payload.value}
					</text>
					<text
						textAnchor="middle"
						fill="currentColor"
						className="text-[10px] fill-muted-foreground"
						dy={10}
					>
						{item?.score ?? 0}/{MAX_TRAIT_SCORE}
					</text>
				</g>
			);
		},
		[chartData, showExternalLabels],
	);

	const renderDot = useCallback(
		({ cx, cy, index }: { cx: number; cy: number; index: number }) => {
			const item = chartData[index];
			if (!item) return <circle cx={0} cy={0} r={0} />;
			return (
				<circle
					key={item.trait}
					cx={cx}
					cy={cy}
					r={4}
					fill={item.fill}
					stroke="var(--background)"
					strokeWidth={2}
				/>
			);
		},
		[chartData],
	);

	const hasExplicitSize = width != null && height != null;

	const chart = (
		<ChartContainer
			config={chartConfig}
			className={cn("mx-auto", !hasExplicitSize && "aspect-square max-h-[280px]")}
			style={hasExplicitSize ? { width, height } : undefined}
		>
			<RadarChart data={chartData}>
				<PolarGrid />
				<PolarRadiusAxis domain={[0, MAX_TRAIT_SCORE]} tick={false} axisLine={false} />
				<PolarAngleAxis dataKey="trait" tick={renderTick} />
				<Radar dataKey="score" fill="none" stroke="none" shape={renderGradientShape} dot={renderDot} />
			</RadarChart>
		</ChartContainer>
	);

	if (standalone) {
		return <div data-slot="personality-radar-chart">{chart}</div>;
	}

	return (
		<Card
			data-slot="personality-radar-chart"
			role="img"
			aria-label="Personality radar chart showing Big Five trait scores"
		>
			<CardHeader>
				<CardTitle className="text-lg font-display">Personality Shape</CardTitle>
			</CardHeader>
			<CardContent>{chart}</CardContent>
		</Card>
	);
});
