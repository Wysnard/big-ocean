import type { OceanCode5, TraitName } from "@workspace/domain";
import {
	BIG_FIVE_TRAITS,
	getTraitColor,
	TRAIT_DESCRIPTIONS,
	TRAIT_LETTER_MAP,
	TRAIT_LEVEL_LABELS,
} from "@workspace/domain";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@workspace/ui/components/tooltip";
import type { ComponentType } from "react";
import { memo } from "react";
import { OceanCircle } from "../ocean-shapes/OceanCircle";
import { OceanDiamond } from "../ocean-shapes/OceanDiamond";
import { OceanHalfCircle } from "../ocean-shapes/OceanHalfCircle";
import { OceanRectangle } from "../ocean-shapes/OceanRectangle";
import { OceanTriangle } from "../ocean-shapes/OceanTriangle";

const TRAIT_SHAPE_MAP: Record<
	TraitName,
	ComponentType<{ size?: number; color?: string; className?: string }>
> = {
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

interface OceanCodeStrandProps {
	oceanCode5: OceanCode5;
	displayName?: string | null;
	description?: string | null;
}

export const OceanCodeStrand = memo(function OceanCodeStrand({
	oceanCode5,
	displayName,
	description,
}: OceanCodeStrandProps) {
	return (
		<Card data-slot="ocean-code-strand" className="col-span-full">
			<CardHeader>
				<CardTitle className="text-lg font-display font-mono tracking-widest">
					About {oceanCode5}
				</CardTitle>
				{description && <p className="text-sm leading-relaxed text-foreground/80">{description}</p>}
				<p className="text-sm text-muted-foreground">
					Each trait sits on a spectrum of three levels. The highlighted segment is{" "}
					{displayName ? "theirs" : "yours"}.
				</p>
			</CardHeader>
			<CardContent>
				<div className="relative flex flex-col">
					{/* Vertical strand line */}
					<div
						className="absolute left-[19px] top-2 bottom-2 w-[3px] rounded-full opacity-20"
						style={{
							background: `linear-gradient(to bottom, ${BIG_FIVE_TRAITS.map((t) => getTraitColor(t)).join(", ")})`,
						}}
					/>

					{BIG_FIVE_TRAITS.map((traitName, i) => {
						const letter = oceanCode5[i];
						const traitColor = getTraitColor(traitName);
						const levelLabel = TRAIT_LEVEL_LABELS[letter] ?? letter;
						const letters = TRAIT_LETTER_MAP[traitName];

						return (
							<div key={traitName} className="relative flex items-start gap-4 py-4">
								{/* Dot — sits on the strand line */}
								<Tooltip>
									<TooltipTrigger asChild>
										<div
											className="relative z-10 flex shrink-0 items-center justify-center w-10 h-10 rounded-full text-sm font-extrabold text-white font-mono shadow-[0_0_0_4px_var(--color-card)] cursor-default"
											style={{ backgroundColor: traitColor }}
										>
											{letter}
										</div>
									</TooltipTrigger>
									<TooltipContent side="right" className="max-w-64">
										{TRAIT_DESCRIPTIONS[traitName].tagline}
									</TooltipContent>
								</Tooltip>

								{/* Content */}
								<div className="flex-1 min-w-0">
									{/* Trait name (small, uppercase, muted) */}
									<div className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
										{TRAIT_LABELS[traitName]}
									</div>
									{/* Level label (larger, bold) */}
									<div className="text-[15px] font-bold text-foreground mt-0.5 mb-1.5">{levelLabel}</div>

									{/* 3-segment gauge with dots */}
									<LevelGauge
										letters={letters}
										activeLetter={letter}
										traitColor={traitColor}
										traitName={traitName}
									/>

									{/* Inline level description */}
									<p className="text-[13px] leading-relaxed text-muted-foreground mt-2.5">
										{(TRAIT_DESCRIPTIONS[traitName].levels as Record<string, string>)[letter]}
									</p>
								</div>
							</div>
						);
					})}
				</div>
			</CardContent>
		</Card>
	);
});

/* ── Level Gauge (3-segment track with shapes) ─────────── */

interface LevelGaugeProps {
	letters: readonly [string, string, string];
	activeLetter: string;
	traitColor: string;
	traitName: TraitName;
}

function LevelGauge({ letters, activeLetter, traitColor, traitName }: LevelGaugeProps) {
	const Shape = TRAIT_SHAPE_MAP[traitName];

	return (
		<div className="flex items-start gap-0.5 max-w-[260px]">
			{letters.map((l) => {
				const isActive = l === activeLetter;
				const label = TRAIT_LEVEL_LABELS[l] ?? l;

				return (
					<div key={l} className="flex-1 flex flex-col items-center gap-1">
						{/* Track bar with shape */}
						<div className="relative w-full h-1 rounded-sm bg-[var(--color-border)]">
							{isActive && (
								<div className="absolute inset-0 rounded-sm" style={{ backgroundColor: traitColor }} />
							)}
							{/* Shape indicator */}
							<div
								className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
								style={{ zIndex: isActive ? 1 : undefined }}
							>
								<Shape size={isActive ? 14 : 10} color={isActive ? traitColor : "var(--color-border)"} />
							</div>
						</div>

						{/* Label */}
						<span
							className="text-[10px] font-semibold text-center text-muted-foreground"
							style={isActive ? { color: traitColor, fontWeight: 700, opacity: 1 } : { opacity: 0.5 }}
						>
							{l} · {label}
						</span>
					</div>
				);
			})}
		</div>
	);
}
