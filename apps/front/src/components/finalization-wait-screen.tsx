/**
 * Finalization Wait Screen (Story 11.1)
 *
 * Displays progress while assessment results are being generated.
 * Shows phase text and progress bar, ocean-themed styling.
 */

import { cn } from "@workspace/ui/lib/utils";
import { useEffect, useRef, useState } from "react";

const PHASE_TEXT: Record<string, string> = {
	analyzing: "Analyzing your conversation...",
	generating_portrait: "Generating your portrait...",
	completed: "Almost there...",
};

const WAIT_LINES = [
	"Sitting with everything you told me...",
	"Following the thread...",
	"Tracing the pattern...",
	"Finding the right words...",
] as const;

const LINE_ROTATION_INTERVAL = 8000;

interface FinalizationWaitScreenProps {
	status: "analyzing" | "generating_portrait" | "completed";
	progress: number;
}

export function FinalizationWaitScreen({ status, progress }: FinalizationWaitScreenProps) {
	const [currentLineIndex, setCurrentLineIndex] = useState(0);
	const lineTimerRef = useRef<ReturnType<typeof setInterval>>();

	useEffect(() => {
		lineTimerRef.current = setInterval(() => {
			setCurrentLineIndex((prev) => (prev + 1) % WAIT_LINES.length);
		}, LINE_ROTATION_INTERVAL);

		return () => {
			if (lineTimerRef.current) clearInterval(lineTimerRef.current);
		};
	}, []);

	return (
		<div
			data-slot="finalization-wait-screen"
			className="h-[calc(100dvh-3.5rem)] flex flex-col items-center justify-center bg-background relative overflow-hidden"
		>
			{/* Breathing background */}
			<div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-primary/5 motion-safe:animate-pulse" />

			<div className="relative z-10 flex flex-col items-center gap-8 max-w-md px-6 text-center">
				{/* Phase text */}
				<p className="text-lg font-heading text-foreground">{PHASE_TEXT[status] ?? "Processing..."}</p>

				{/* Rotating Nerin voice line */}
				<p
					className={cn(
						"text-sm text-muted-foreground italic min-h-[1.5rem]",
						"motion-safe:animate-fade-in",
					)}
					key={currentLineIndex}
				>
					{WAIT_LINES[currentLineIndex]}
				</p>

				{/* Progress bar */}
				<div className="w-64 h-1.5 bg-muted rounded-full overflow-hidden">
					<div
						className="h-full bg-primary rounded-full transition-all duration-700 ease-out"
						style={{ width: `${Math.max(progress, 5)}%` }}
					/>
				</div>
			</div>
		</div>
	);
}
