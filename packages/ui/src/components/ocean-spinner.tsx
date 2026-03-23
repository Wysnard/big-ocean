import type { TraitLevel, TraitName } from "@workspace/domain";
import { OCEAN_HIEROGLYPH_PATHS, TRAIT_NAMES } from "@workspace/domain";
import { cn } from "@workspace/ui/lib/utils";
import { useCallback, useEffect, useRef, useState } from "react";

type Interpolator = (t: number) => string;
type InterpolateFn = (
	from: string,
	to: string,
	opts?: { maxSegmentLength?: number },
) => Interpolator;

// Lazy-loaded flubber — CJS module requires dynamic import for Vite SSR/client compat
let _interpolate: InterpolateFn | null = null;
const flubberReady =
	typeof window !== "undefined"
		? import("flubber").then((m) => {
				const mod = m.default ?? m;
				_interpolate = (mod as { interpolate: InterpolateFn }).interpolate;
			})
		: Promise.resolve();

interface OceanSpinnerProps {
	/** Hieroglyph letters to cycle through. Default: "OCEAN" */
	code?: string;
	/** Glyph size in px. Default: 32 */
	size?: number;
	/** Total time per glyph in ms (hold + morph). Default: 800 */
	interval?: number;
	/** Duration of the morph transition in ms. Default: 400 */
	morphDuration?: number;
	/** Monochrome mode — uses currentColor, no trait colors. Default: false */
	mono?: boolean;
	/** Accessible label. Default: "Loading" */
	"aria-label"?: string;
	/** Additional CSS classes */
	className?: string;
}

const TRAIT_ORDER: readonly TraitName[] = TRAIT_NAMES;

function traitColorVar(index: number): string {
	const trait = TRAIT_ORDER[index % TRAIT_ORDER.length] as TraitName;
	return `var(--trait-${trait})`;
}

function getPath(letters: TraitLevel[], index: number): string {
	const letter = letters[index % letters.length] as TraitLevel;
	return OCEAN_HIEROGLYPH_PATHS[letter];
}

/** Ease-in-out cubic for smooth morphing */
function easeInOutCubic(t: number): number {
	return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

export function OceanSpinner({
	code = "OCEAN",
	size = 32,
	interval = 1200,
	morphDuration = 1000,
	mono = false,
	"aria-label": ariaLabel = "Loading",
	className,
}: OceanSpinnerProps) {
	const letters = code.split("") as TraitLevel[];
	const pathRef = useRef<SVGPathElement>(null);
	const svgRef = useRef<SVGSVGElement>(null);
	const animRef = useRef<number>(0);
	const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
	const [ready, setReady] = useState(false);

	// Load flubber on mount
	useEffect(() => {
		flubberReady.then(() => setReady(true));
	}, []);

	// Reduced motion detection
	useEffect(() => {
		const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
		setPrefersReducedMotion(mq.matches);
		const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
		mq.addEventListener("change", handler);
		return () => mq.removeEventListener("change", handler);
	}, []);

	// Simple opacity swap for reduced motion
	const [currentIndex, setCurrentIndex] = useState(0);
	useEffect(() => {
		if (!prefersReducedMotion) return;
		const timer = setInterval(() => {
			setCurrentIndex((i) => (i + 1) % letters.length);
		}, interval);
		return () => clearInterval(timer);
	}, [prefersReducedMotion, interval, letters.length]);

	// Morph animation loop
	const animate = useCallback(() => {
		if (prefersReducedMotion || letters.length < 1 || !ready || !_interpolate) return;

		const interpolate = _interpolate;
		const path = pathRef.current;
		const svg = svgRef.current;
		if (!path || !svg) return;

		let glyphIndex = 0;
		let phase: "hold" | "morph" = "hold";
		let phaseStart = performance.now();
		const holdDuration = Math.max(interval - morphDuration, 100);

		// Set initial state
		path.setAttribute("d", getPath(letters, 0));
		if (!mono) {
			svg.style.color = traitColorVar(0);
		}

		// Breathe scale parameters
		const breatheMin = 1;
		const breatheMax = 1.05;

		// Cached interpolator — recreated only when morph starts
		let cachedInterp: Interpolator | null = null;
		let cachedMorphKey = "";

		const tick = (now: number) => {
			const elapsed = now - phaseStart;

			if (phase === "hold") {
				// Breathe pulse during hold
				const breatheT = elapsed / holdDuration;
				const breatheScale = breatheMin + (breatheMax - breatheMin) * Math.sin(breatheT * Math.PI);
				path.setAttribute("transform", `translate(12,12) scale(${breatheScale}) translate(-12,-12)`);

				if (elapsed >= holdDuration) {
					phase = "morph";
					phaseStart = now;
					cachedInterp = null;
				}
			} else {
				// Morphing to next glyph
				const nextIndex = (glyphIndex + 1) % letters.length;
				const fromPathD = getPath(letters, glyphIndex);
				const toPathD = getPath(letters, nextIndex);
				const morphKey = `${glyphIndex}-${nextIndex}`;

				const t = Math.min(elapsed / morphDuration, 1);
				const eased = easeInOutCubic(t);

				// Create interpolator once per morph transition
				if (cachedInterp === null || cachedMorphKey !== morphKey) {
					try {
						cachedInterp = interpolate(fromPathD, toPathD, {
							maxSegmentLength: 5,
						});
					} catch {
						cachedInterp = (progress: number) => (progress > 0.5 ? toPathD : fromPathD);
					}
					cachedMorphKey = morphKey;
				}

				path.setAttribute("d", cachedInterp(eased));

				// Reset scale during morph
				path.setAttribute("transform", "translate(12,12) scale(1) translate(-12,-12)");

				// Color transition during morph
				if (!mono) {
					if (eased < 0.5) {
						svg.style.color = traitColorVar(glyphIndex);
					} else {
						svg.style.color = traitColorVar(nextIndex);
					}
				}

				if (elapsed >= morphDuration) {
					glyphIndex = nextIndex;
					phase = "hold";
					phaseStart = now;
					cachedInterp = null;
					path.setAttribute("d", getPath(letters, glyphIndex));
					if (!mono) {
						svg.style.color = traitColorVar(glyphIndex);
					}
				}
			}

			animRef.current = requestAnimationFrame(tick);
		};

		animRef.current = requestAnimationFrame(tick);

		return () => cancelAnimationFrame(animRef.current);
	}, [letters, interval, morphDuration, mono, prefersReducedMotion, ready]);

	// Start/stop animation
	useEffect(() => {
		const cleanup = animate();
		return () => {
			cleanup?.();
			cancelAnimationFrame(animRef.current);
		};
	}, [animate]);

	// Reduced motion: simple opacity swap
	if (prefersReducedMotion) {
		return (
			<output
				aria-label={ariaLabel}
				className={cn("inline-flex items-center justify-center", className)}
			>
				<svg
					viewBox="0 0 24 24"
					fill="currentColor"
					aria-hidden="true"
					data-slot="ocean-spinner"
					style={{
						width: size,
						height: size,
						color: mono ? undefined : traitColorVar(currentIndex),
						transition: "color 300ms ease",
					}}
				>
					<path d={getPath(letters, currentIndex)} />
				</svg>
			</output>
		);
	}

	return (
		<output
			aria-label={ariaLabel}
			className={cn("inline-flex items-center justify-center", className)}
		>
			<svg
				ref={svgRef}
				viewBox="0 0 24 24"
				fill="currentColor"
				aria-hidden="true"
				data-slot="ocean-spinner"
				style={{ width: size, height: size }}
			>
				<path ref={pathRef} d={getPath(letters, 0)} />
			</svg>
		</output>
	);
}
