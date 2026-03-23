import type { OceanCode5, TraitLevel, TraitName } from "@workspace/domain";
import {
	BIG_FIVE_TRAITS,
	getTraitLevelLabel,
	TRAIT_DESCRIPTIONS,
	TRAIT_LETTER_MAP,
} from "@workspace/domain";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { OceanHieroglyph } from "@workspace/ui/components/ocean-hieroglyph";
import { Tooltip, TooltipContent, TooltipTrigger } from "@workspace/ui/components/tooltip";
import { memo } from "react";

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
							background: `linear-gradient(to bottom, ${BIG_FIVE_TRAITS.map((t) => `var(--trait-${t})`).join(", ")})`,
						}}
					/>

					{BIG_FIVE_TRAITS.map((traitName, i) => {
						const letter = oceanCode5[i];
						const levelLabel = getTraitLevelLabel(traitName, letter);
						const letters = TRAIT_LETTER_MAP[traitName];

						return (
							<div key={traitName} className="relative flex items-start gap-4 py-4">
								{/* Dot — sits on the strand line */}
								<Tooltip>
									<TooltipTrigger asChild>
										<div
											className="relative z-10 flex shrink-0 items-center justify-center w-10 h-10 rounded-full text-sm font-extrabold text-white font-mono shadow-[0_0_0_4px_var(--color-card)] cursor-default"
											style={{ backgroundColor: `var(--trait-${traitName})` }}
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

									{/* 3-segment gauge with hieroglyphs */}
									<LevelGauge letters={letters} activeLetter={letter} traitName={traitName} />

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

/* ── Level Gauge (3-segment track with hieroglyphs) ─────────── */

interface LevelGaugeProps {
	letters: readonly [string, string, string];
	activeLetter: string;
	traitName: TraitName;
}

function LevelGauge({ letters, activeLetter, traitName }: LevelGaugeProps) {
	return (
		<div className="flex items-start gap-0.5 max-w-[260px]">
			{letters.map((l) => {
				const isActive = l === activeLetter;
				const label = getTraitLevelLabel(traitName, l);

				return (
					<div
						key={l}
						className="flex-1 flex flex-col items-center gap-1"
						data-trait={isActive ? traitName : undefined}
					>
						{/* Track bar with hieroglyph */}
						<div className="relative w-full h-1 rounded-sm bg-[var(--color-border)]">
							{isActive && (
								<div
									className="absolute inset-0 rounded-sm"
									style={{ backgroundColor: `var(--trait-${traitName})` }}
								/>
							)}
							{/* Hieroglyph indicator */}
							<div
								className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
								style={{
									zIndex: isActive ? 1 : undefined,
									color: isActive ? undefined : "var(--color-border)",
								}}
							>
								<OceanHieroglyph
									letter={l as TraitLevel}
									style={{ width: isActive ? 14 : 10, height: isActive ? 14 : 10 }}
								/>
							</div>
						</div>

						{/* Label */}
						<span
							className="text-[10px] font-semibold text-center text-muted-foreground"
							style={
								isActive
									? { color: `var(--trait-${traitName})`, fontWeight: 700, opacity: 1 }
									: { opacity: 0.5 }
							}
						>
							{l} · {label}
						</span>
					</div>
				);
			})}
		</div>
	);
}
