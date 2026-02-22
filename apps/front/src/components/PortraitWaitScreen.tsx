import { cn } from "@workspace/ui/lib/utils";
import { useEffect, useMemo, useRef, useState } from "react";
import { useGetResults } from "@/hooks/use-assessment";

/** Nerin-voiced rotating lines displayed during portrait generation */
const WAIT_LINES = [
	"Sitting with everything you told me...",
	"Following the thread...",
	"Tracing the pattern...",
	"Finding the right words...",
] as const;

/** Interval between line rotations (ms) */
const LINE_ROTATION_INTERVAL = 8000;

interface PortraitWaitScreenProps {
	sessionId: string;
	portraitWaitMinMs?: number;
	onRevealClick: () => void;
}

/**
 * Wait screen shown during portrait generation. Features:
 * - Ocean-themed background with breathing animation
 * - Rotating Nerin-voiced text at ~8s intervals
 * - Minimum wait enforced before reveal (portraitWaitMinMs)
 * - On ready: "Your portrait is ready." + "Read what Nerin wrote"
 */
export function PortraitWaitScreen({
	sessionId,
	portraitWaitMinMs = 10000,
	onRevealClick,
}: PortraitWaitScreenProps) {
	const [currentLineIndex, setCurrentLineIndex] = useState(0);
	const [isMinWaitElapsed, setIsMinWaitElapsed] = useState(false);
	const [showReveal, setShowReveal] = useState(false);
	const lineTimerRef = useRef<ReturnType<typeof setInterval>>();

	// Fetch results (triggers finalization on first call)
	const { data: results, isError, refetch } = useGetResults(sessionId);

	const isResultsReady = !!results;

	// Minimum wait timer
	useEffect(() => {
		const timer = setTimeout(() => {
			setIsMinWaitElapsed(true);
		}, portraitWaitMinMs);
		return () => clearTimeout(timer);
	}, [portraitWaitMinMs]);

	// Rotate lines
	useEffect(() => {
		lineTimerRef.current = setInterval(() => {
			setCurrentLineIndex((prev) => (prev + 1) % WAIT_LINES.length);
		}, LINE_ROTATION_INTERVAL);
		return () => clearInterval(lineTimerRef.current);
	}, []);

	// Transition to reveal when both conditions met
	useEffect(() => {
		if (isResultsReady && isMinWaitElapsed) {
			setShowReveal(true);
		}
	}, [isResultsReady, isMinWaitElapsed]);

	const prefersReducedMotion = useMemo(
		() =>
			typeof window !== "undefined" &&
			window.matchMedia("(prefers-reduced-motion: reduce)").matches,
		[],
	);

	return (
		<div
			data-slot="portrait-wait-screen"
			className="h-[calc(100dvh-3.5rem)] flex flex-col items-center justify-center bg-background text-foreground relative overflow-hidden"
		>
			{/* Breathing ocean background */}
			<div
				className={cn(
					"absolute inset-0 bg-gradient-to-b from-background via-background to-primary/5",
					!prefersReducedMotion && "motion-safe:animate-[breathe_6s_ease-in-out_infinite]",
				)}
				aria-hidden="true"
			/>

			<div className="relative z-10 text-center px-6 max-w-md">
				{showReveal ? (
					<div className={cn(!prefersReducedMotion && "motion-safe:animate-fade-in-up")}>
						<p className="text-xl font-heading font-semibold text-foreground">
							Your portrait is ready.
						</p>
						<button
							type="button"
							onClick={onRevealClick}
							data-testid="read-portrait-btn"
							className="mt-8 min-h-[52px] rounded-xl bg-foreground px-10 font-heading text-base font-bold text-background transition-all duration-300 hover:bg-primary hover:shadow-lg hover:-translate-y-px active:translate-y-0 active:scale-[0.99]"
						>
							Read what Nerin wrote
						</button>
					</div>
				) : isError ? (
					<div>
						<p className="text-lg text-foreground font-heading">
							Something got tangled.
						</p>
						<p className="mt-2 text-muted-foreground">
							Let me try again.
						</p>
						<button
							type="button"
							onClick={() => refetch()}
							data-testid="wait-retry-btn"
							className="mt-6 min-h-[48px] rounded-xl bg-foreground px-8 font-heading text-base font-bold text-background transition-all hover:bg-primary hover:shadow-lg"
						>
							Try Again
						</button>
					</div>
				) : (
					<p
						key={currentLineIndex}
						className={cn(
							"text-lg text-muted-foreground font-heading italic",
							!prefersReducedMotion &&
								"motion-safe:animate-[fade-in_400ms_ease-in-out]",
						)}
					>
						{WAIT_LINES[currentLineIndex]}
					</p>
				)}
			</div>
		</div>
	);
}
