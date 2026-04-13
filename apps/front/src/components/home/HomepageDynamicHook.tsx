import { cn } from "@workspace/ui/lib/utils";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useHomepagePhase } from "./DepthScrollProvider";
import type { HomepagePhase } from "./homepage-phase-config";
import { getHomepagePhaseConfig } from "./homepage-phase-config";

interface HomepageDynamicHookProps {
	phase?: HomepagePhase;
	compact?: boolean;
	className?: string;
}

export function HomepageDynamicHook({
	phase,
	compact = false,
	className,
}: HomepageDynamicHookProps) {
	const inheritedPhase = useHomepagePhase();
	const currentPhase = phase ?? inheritedPhase;
	const config = getHomepagePhaseConfig(currentPhase);
	const reducedMotion = useReducedMotion();

	const transitionProps = reducedMotion
		? {
				initial: { opacity: 1, y: 0 },
				animate: { opacity: 1, y: 0 },
				exit: { opacity: 1, y: 0 },
				transition: { duration: 0 },
			}
		: {
				initial: { opacity: 0, y: 20 },
				animate: { opacity: 1, y: 0 },
				exit: { opacity: 0, y: -20 },
				transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] as const },
			};

	return (
		<div
			data-slot="homepage-dynamic-hook"
			data-testid="homepage-dynamic-hook"
			data-phase={currentPhase}
			data-reduced-motion={reducedMotion ? "true" : "false"}
			className={cn(
				"overflow-hidden font-sans text-slate-900 dark:text-slate-50",
				compact ? "min-h-[7.25rem]" : "min-h-[9rem]",
				className,
			)}
		>
			<AnimatePresence initial={false} mode="wait">
				<motion.div
					key={currentPhase}
					data-testid="homepage-hook-text"
					className={cn("flex flex-col gap-1.5", compact ? "gap-1" : "gap-1.5")}
					{...transitionProps}
				>
					{config.textBefore ? (
						<span className={cn("font-medium tracking-tight", compact ? "text-base" : "text-lg")}>
							{config.textBefore}
						</span>
					) : null}

					<span
						data-testid="homepage-hook-keyword"
						data-reduced-motion={reducedMotion ? "true" : "false"}
						className={cn(
							"homepage-gradient-keyword bg-[length:200%_200%] bg-clip-text font-sans font-black tracking-[-0.04em] text-transparent",
							config.gradientClassName,
							compact ? "text-[2rem] leading-none" : "text-[clamp(2.75rem,4vw,4rem)] leading-[0.92]",
						)}
					>
						{config.keyword}
					</span>

					{config.textAfter ? (
						<span className={cn("font-medium tracking-tight", compact ? "text-base" : "text-lg")}>
							{config.textAfter}
						</span>
					) : null}
				</motion.div>
			</AnimatePresence>
		</div>
	);
}
