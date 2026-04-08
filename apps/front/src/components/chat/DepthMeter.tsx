import { useEffect, useRef, useState } from "react";
import {
	DEFAULT_MILESTONES,
	getMilestoneLabel,
	getMilestonePositionPercent,
	isMilestoneReached,
} from "./depth-milestones";

interface DepthMeterProps {
	currentTurn: number;
	totalTurns: number;
	milestones?: readonly number[];
}

export function DepthMeter({
	currentTurn,
	totalTurns,
	milestones = DEFAULT_MILESTONES,
}: DepthMeterProps) {
	const progress = totalTurns > 0 ? Math.min(currentTurn / totalTurns, 1) : 0;

	// Track previously reached milestones to detect new crossings
	const prevReachedRef = useRef<Set<number>>(new Set());
	const [announcement, setAnnouncement] = useState("");
	const [pulsing, setPulsing] = useState<Set<number>>(new Set());

	useEffect(() => {
		const prevReached = prevReachedRef.current;
		const newlyReached: number[] = [];

		for (const m of milestones) {
			const pct = getMilestoneLabel(m);
			if (isMilestoneReached(currentTurn, totalTurns, m) && !prevReached.has(pct)) {
				newlyReached.push(pct);
				prevReached.add(pct);
			}
		}

		if (newlyReached.length > 0) {
			// Announce the highest newly reached milestone
			const highest = Math.max(...newlyReached);
			setAnnouncement(`${highest}% depth reached`);

			// Trigger pulse animation for newly reached milestones
			setPulsing(new Set(newlyReached));

			// Clear pulse after animation duration (600ms)
			const pulseTimer = setTimeout(() => setPulsing(new Set()), 600);
			// Clear announcement after a brief delay
			const announceTimer = setTimeout(() => setAnnouncement(""), 3000);

			return () => {
				clearTimeout(pulseTimer);
				clearTimeout(announceTimer);
			};
		}
	}, [currentTurn, totalTurns, milestones]);

	return (
		<nav
			data-slot="depth-meter"
			role="progressbar"
			aria-valuenow={currentTurn}
			aria-valuemin={0}
			aria-valuemax={totalTurns}
			aria-valuetext={totalTurns > 0 ? `Exchange ${currentTurn} of ${totalTurns}` : "No exchanges yet"}
			aria-label="Conversation depth"
			className="fixed left-5 top-1/2 z-[90] flex -translate-y-1/2 flex-col items-center transition-opacity duration-500 max-[900px]:hidden"
			style={{
				opacity: progress > 0.02 ? 1 : 0,
				pointerEvents: progress > 0.02 ? "auto" : "none",
			}}
		>
			{/* Track with milestones */}
			<div className="relative h-[160px] w-[2px] rounded-[1px] bg-border">
				{/* Fill */}
				<div
					data-testid="depth-meter-fill"
					className="w-full rounded-[1px] bg-primary motion-safe:transition-[height] motion-safe:duration-300 motion-safe:ease-[cubic-bezier(0.4,0,0.2,1)]"
					style={{ height: `${Math.round(progress * 100)}%` }}
				/>

				{/* Milestone ticks */}
				{milestones.map((m) => {
					const pct = getMilestoneLabel(m);
					const reached = isMilestoneReached(currentTurn, totalTurns, m);
					const isPulsing = pulsing.has(pct);

					return (
						<div
							key={pct}
							data-testid={`milestone-tick-${pct}`}
							data-reached={reached ? "true" : "false"}
							className="absolute left-1/2 -translate-x-1/2"
							style={{ top: `${getMilestonePositionPercent(totalTurns, m)}%` }}
						>
							{/* Glow ring (behind the tick) — only during pulse */}
							{isPulsing && (
								<span
									aria-hidden="true"
									className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-primary/40 motion-safe:animate-ping"
								/>
							)}
							{/* Tick dot */}
							<span
								aria-hidden="true"
								className={[
									"block h-[6px] w-[6px] rounded-full transition-colors duration-300",
									reached ? "bg-primary" : "bg-border",
								].join(" ")}
							/>
						</div>
					);
				})}
			</div>

			{/* Visually hidden live region for milestone announcements */}
			<span data-testid="depth-meter-announcer" aria-live="polite" className="sr-only">
				{announcement}
			</span>
		</nav>
	);
}
