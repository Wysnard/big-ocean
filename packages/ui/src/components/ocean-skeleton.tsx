import type { TraitLevel, TraitName } from "@workspace/domain";
import { TRAIT_NAMES } from "@workspace/domain";
import { cn } from "@workspace/ui/lib/utils";
import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import { OceanHieroglyph } from "./ocean-hieroglyph";

interface OceanSkeletonProps {
	/** Hieroglyph letters to display as slots. Default: "OCEAN" */
	code?: string;
	/** Glyph size in px. Default: 32 */
	size?: number;
	/** Controlled mode: number of revealed glyphs (0 to code.length). */
	revealedCount?: number;
	/** Auto mode: reveal glyphs one by one on a timer, then loop. Default: false */
	autoReveal?: boolean;
	/** Time between reveals in auto mode, in ms. Default: 600 */
	interval?: number;
	/** Monochrome mode — revealed glyphs use currentColor. Default: false */
	mono?: boolean;
	/** Accessible label. Default: "Loading" */
	"aria-label"?: string;
	/** Additional CSS classes */
	className?: string;
}

const TRAIT_ORDER: readonly TraitName[] = TRAIT_NAMES;
/** Per-glyph dismiss stagger in ms */
const DISMISS_STAGGER = 80;
/** Duration of the dismiss animation in ms (matches CSS) */
const DISMISS_DURATION = 300;
/** Pause after all glyphs dismissed before restarting */
const RESTART_PAUSE = 400;

export function OceanSkeleton({
	code = "OCEAN",
	size = 32,
	revealedCount,
	autoReveal = false,
	interval = 1000,
	mono = false,
	"aria-label": ariaLabel = "Loading",
	className,
}: OceanSkeletonProps) {
	const letters = code.split("") as TraitLevel[];
	const isControlled = revealedCount !== undefined;

	const [autoCount, setAutoCount] = useState(0);
	const [dismissing, setDismissing] = useState(false);
	const cancelRef = useRef(false);

	useEffect(() => {
		if (!autoReveal || isControlled) return;
		cancelRef.current = false;

		let count = 0;
		let timerId: ReturnType<typeof setTimeout>;

		const scheduleNext = () => {
			if (cancelRef.current) return;

			timerId = setTimeout(() => {
				if (cancelRef.current) return;

				count++;
				if (count > letters.length) {
					// All revealed — start staggered dismiss
					setDismissing(true);
					// Wait for last glyph dismiss to finish: stagger * (n-1) + animation duration + pause
					const totalDismissTime =
						DISMISS_STAGGER * (letters.length - 1) + DISMISS_DURATION + RESTART_PAUSE;
					timerId = setTimeout(() => {
						if (cancelRef.current) return;
						count = 0;
						setDismissing(false);
						setAutoCount(0);
						scheduleNext();
					}, totalDismissTime);
					return;
				}
				setAutoCount(count);
				scheduleNext();
			}, interval);
		};

		scheduleNext();

		return () => {
			cancelRef.current = true;
			clearTimeout(timerId);
		};
	}, [autoReveal, isControlled, interval, letters.length]);

	const activeCount = isControlled ? revealedCount : autoCount;

	return (
		<div
			role="progressbar"
			aria-label={ariaLabel}
			aria-valuemin={0}
			aria-valuemax={letters.length}
			aria-valuenow={activeCount}
			data-slot="ocean-skeleton"
			className={cn("inline-flex items-center gap-[0.2em]", className)}
		>
			{letters.map((letter, index) => {
				const isRevealed = !dismissing && index < activeCount;
				const isDismissing = dismissing && index < activeCount;
				const trait = TRAIT_ORDER[index % TRAIT_ORDER.length] as TraitName;
				const traitAttrs = mono || (!isRevealed && !isDismissing) ? {} : { "data-trait": trait };

				let animClassName = "opacity-[0.08]";
				let animStyle: CSSProperties | undefined;

				if (isDismissing) {
					animClassName = "motion-safe:animate-hieroglyph-dismiss motion-reduce:animate-none";
					animStyle = {
						animationDelay: `${index * DISMISS_STAGGER}ms`,
						animationFillMode: "both",
					};
				} else if (isRevealed) {
					animClassName = "motion-safe:animate-hieroglyph-reveal motion-reduce:animate-none opacity-100";
					animStyle = {
						animationDelay: `${index * 100}ms`,
						animationFillMode: "both",
					};
				}

				return (
					<span
						key={`${index}-${letter}`}
						{...traitAttrs}
						className={cn("inline-flex items-center justify-center", animClassName)}
						style={animStyle}
					>
						<OceanHieroglyph letter={letter} style={{ width: size, height: size }} />
					</span>
				);
			})}
		</div>
	);
}
