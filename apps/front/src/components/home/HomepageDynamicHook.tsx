import { cn } from "@workspace/ui/lib/utils";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { ElementType } from "react";
import { useHomepagePhase } from "./DepthScrollProvider";
import type { HomepagePhase } from "./homepage-phase-config";
import { getHomepagePhaseConfig } from "./homepage-phase-config";

interface HomepageDynamicHookProps {
	phase?: HomepagePhase;
	className?: string;
	/**
	 * Element type for the outer wrapper. Defaults to `div`. Pass `"h1"` (or another heading tag)
	 * when this hook serves as the page's primary headline so it carries the right semantics
	 * for SEO and assistive tech.
	 */
	as?: ElementType;
}

/**
 * Phase-driven headline that reads as a normal sentence with one gradient-accented keyword.
 *
 * The keyword sits inline with the surrounding text at the same font-size — the gradient is the
 * only emphasis it needs. The whole hook is a single line of copy that can be promoted to an
 * `<h1>` (or any heading) via the `as` prop without restructuring the visual.
 */
export function HomepageDynamicHook({
	phase,
	className,
	as: Wrapper = "div",
}: HomepageDynamicHookProps) {
	const inheritedPhase = useHomepagePhase();
	const currentPhase = phase ?? inheritedPhase;
	const config = getHomepagePhaseConfig(currentPhase);
	const reducedMotion = useReducedMotion();

	const transitionProps = reducedMotion
		? {
				initial: { opacity: 1 },
				animate: { opacity: 1 },
				exit: { opacity: 1 },
				transition: { duration: 0 },
			}
		: {
				initial: { opacity: 0 },
				animate: { opacity: 1 },
				exit: { opacity: 0 },
				transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] as const },
			};

	return (
		<Wrapper
			data-slot="homepage-dynamic-hook"
			data-testid="homepage-dynamic-hook"
			data-phase={currentPhase}
			data-reduced-motion={reducedMotion ? "true" : "false"}
			className={cn(
				"font-heading text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-5xl",
				className,
			)}
		>
			{/* Opacity-only crossfade (no translateY) so the rail does not shift vertically during swaps. */}
			<AnimatePresence initial={false} mode="wait">
				<motion.span
					key={currentPhase}
					data-testid="homepage-hook-text"
					className="block w-full"
					{...transitionProps}
				>
					{config.textBefore ? <>{config.textBefore} </> : null}
					<span
						data-testid="homepage-hook-keyword"
						data-reduced-motion={reducedMotion ? "true" : "false"}
						className={cn(
							"homepage-gradient-keyword bg-[length:200%_200%] bg-clip-text font-heading font-semibold text-transparent",
							config.gradientClassName,
						)}
					>
						{config.keyword}
					</span>
					{config.textAfter ? <> {config.textAfter}</> : null}
				</motion.span>
			</AnimatePresence>
		</Wrapper>
	);
}
