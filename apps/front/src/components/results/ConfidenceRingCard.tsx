"use client";

import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@workspace/ui/components/card";
import type { ChartConfig } from "@workspace/ui/components/chart";
import { ChartContainer } from "@workspace/ui/components/chart";
import { memo, useMemo } from "react";
import { Label, PolarGrid, PolarRadiusAxis, RadialBar, RadialBarChart } from "recharts";

interface ConfidenceRingCardProps {
	confidence: number;
	messageCount: number;
}

const chartConfig: ChartConfig = {
	confidence: { label: "Confidence", color: "var(--primary)" },
};

export const ConfidenceRingCard = memo(function ConfidenceRingCard({
	confidence,
	messageCount,
}: ConfidenceRingCardProps) {
	const endAngle = (confidence / 100) * 360;
	const chartData = useMemo(() => [{ confidence, fill: "var(--color-confidence)" }], [confidence]);

	return (
		<Card data-slot="confidence-ring-card">
			<CardHeader>
				<CardTitle className="text-lg font-display">Overall Confidence</CardTitle>
			</CardHeader>
			<CardContent className="flex-1 pb-0">
				<ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[200px]">
					<RadialBarChart
						data={chartData}
						startAngle={0}
						endAngle={endAngle}
						innerRadius={70}
						outerRadius={100}
					>
						<PolarGrid
							gridType="circle"
							radialLines={false}
							stroke="none"
							className="first:fill-muted last:fill-background"
							polarRadius={[76, 64]}
						/>
						<RadialBar dataKey="confidence" background cornerRadius={10} />
						<PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
							<Label
								content={({ viewBox }) => {
									if (viewBox && "cx" in viewBox && "cy" in viewBox) {
										return (
											<text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
												<tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-3xl font-bold">
													{confidence}%
												</tspan>
											</text>
										);
									}
								}}
							/>
						</PolarRadiusAxis>
					</RadialBarChart>
				</ChartContainer>
			</CardContent>
			<CardFooter className="justify-center pt-0 pb-4">
				<p className="text-xs text-muted-foreground text-center">
					Based on {messageCount} conversation messages
				</p>
			</CardFooter>
		</Card>
	);
});
