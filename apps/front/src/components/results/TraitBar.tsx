import { TRAIT_LEVEL_LABELS } from "@workspace/domain";
import { cn } from "@workspace/ui/lib/utils";

export interface TraitBarProps {
	traitName: string;
	score: number;
	level: string;
	confidence: number;
	color: string;
	isExpanded: boolean;
	onToggle: () => void;
	controlsId: string;
	className?: string;
}

/** Level categories for styling: high, mid, or low */
const HIGH_LETTERS = new Set(["O", "D", "E", "W", "S"]);
const MID_LETTERS = new Set(["G", "B", "A", "N", "T"]);

const MAX_TRAIT_SCORE = 120;

/**
 * Displays a single Big Five trait with score bar, level badge,
 * and confidence percentage. Clickable to expand facet breakdown.
 */
export function TraitBar({
	traitName,
	score,
	level,
	confidence,
	color,
	isExpanded,
	onToggle,
	controlsId,
	className,
}: TraitBarProps) {
	const clampedScore = Math.min(Math.max(score, 0), MAX_TRAIT_SCORE);
	const scorePercent = Math.round((clampedScore / MAX_TRAIT_SCORE) * 100);
	const clampedConfidence = Math.min(Math.max(confidence, 0), 100);
	const displayName = traitName.charAt(0).toUpperCase() + traitName.slice(1);
	const levelLabel = TRAIT_LEVEL_LABELS[level] ?? level;

	return (
		<button
			type="button"
			aria-expanded={isExpanded}
			aria-controls={controlsId}
			onClick={onToggle}
			data-testid={`trait-bar-${traitName}`}
			className={cn(
				"w-full rounded-xl border border-slate-700/50 bg-slate-800/60 p-4 text-left transition-colors hover:bg-slate-800/80",
				isExpanded && "border-slate-600/60",
				className,
			)}
		>
			{/* Header row: name, level badge, confidence */}
			<div className="flex items-center justify-between gap-3">
				<div className="flex items-center gap-3 min-w-0">
					{/* Color dot */}
					<div
						className="h-3 w-3 shrink-0 rounded-full"
						style={{ backgroundColor: color }}
						data-testid={`trait-color-${traitName}`}
					/>
					<span className="text-sm font-semibold text-white truncate">{displayName}</span>
					{/* Level badge */}
					<span
						className={cn(
							"shrink-0 rounded-md px-2 py-0.5 text-xs font-medium",
							HIGH_LETTERS.has(level) && "bg-emerald-900/40 text-emerald-300",
							MID_LETTERS.has(level) && "bg-amber-900/40 text-amber-300",
							!HIGH_LETTERS.has(level) && !MID_LETTERS.has(level) && "bg-slate-700/60 text-slate-300",
						)}
						data-testid={`trait-level-${traitName}`}
					>
						{levelLabel}
					</span>
				</div>

				<div className="flex items-center gap-3 shrink-0">
					<span className="text-xs text-slate-400" data-testid={`trait-confidence-${traitName}`}>
						{clampedConfidence}%
					</span>
					{/* Expand chevron */}
					<svg
						className={cn(
							"h-4 w-4 text-slate-400 transition-transform duration-200",
							isExpanded && "rotate-180",
						)}
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						strokeWidth={2}
						aria-hidden="true"
					>
						<path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
					</svg>
				</div>
			</div>

			{/* Score bar */}
			<div className="mt-3">
				<div className="flex items-center justify-between mb-1">
					<span className="text-xs text-slate-500">
						{clampedScore} / {MAX_TRAIT_SCORE}
					</span>
				</div>
				<div
					className="h-2 w-full overflow-hidden rounded-full bg-slate-700/60"
					data-testid={`trait-track-${traitName}`}
				>
					<div
						className="h-full rounded-full transition-all duration-500 ease-out"
						style={{
							width: `${scorePercent}%`,
							backgroundColor: color,
							opacity: clampedConfidence < 30 ? 0.5 : 1,
						}}
						data-testid={`trait-fill-${traitName}`}
					/>
				</div>
			</div>
		</button>
	);
}
