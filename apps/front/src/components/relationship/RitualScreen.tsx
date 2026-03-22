/**
 * RitualScreen Component (Story 35-1)
 *
 * Pre-analysis screen advising both users to read the relationship
 * analysis together. Pure UI — no sync, no locking. Each user sees
 * this screen independently after QR acceptance.
 *
 * Visual: Full viewport, centered text, large type. Clean background
 * with floating geometric shapes at very low opacity.
 */

import { Button } from "@workspace/ui/components/button";
import { useEffect, useId, useRef } from "react";
import { OceanCircle } from "../ocean-shapes/OceanCircle";
import { OceanDiamond } from "../ocean-shapes/OceanDiamond";
import { OceanHalfCircle } from "../ocean-shapes/OceanHalfCircle";
import { OceanRectangle } from "../ocean-shapes/OceanRectangle";
import { OceanTriangle } from "../ocean-shapes/OceanTriangle";

export interface RitualScreenProps {
	userAName?: string;
	userBName?: string;
	onStart: () => void;
}

export function RitualScreen({ userAName, userBName, onStart }: RitualScreenProps) {
	const headingId = useId();
	const startButtonRef = useRef<HTMLButtonElement>(null);

	// Auto-focus the Start button on mount for accessibility
	useEffect(() => {
		startButtonRef.current?.focus();
	}, []);

	return (
		<div
			data-testid="ritual-screen"
			data-slot="ritual-screen"
			role="dialog"
			aria-labelledby={headingId}
			className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background px-6 motion-safe:animate-fade-in"
		>
			{/* Floating geometric shapes at very low opacity */}
			<div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
				<OceanCircle
					size={64}
					className="absolute top-[12%] left-[8%] opacity-[0.06] motion-safe:animate-[float_6s_ease-in-out_infinite]"
				/>
				<OceanHalfCircle
					size={48}
					className="absolute top-[20%] right-[12%] opacity-[0.05] motion-safe:animate-[float_8s_ease-in-out_infinite_1s]"
				/>
				<OceanRectangle
					size={56}
					className="absolute bottom-[25%] left-[15%] opacity-[0.04] motion-safe:animate-[float_7s_ease-in-out_infinite_2s]"
				/>
				<OceanTriangle
					size={40}
					className="absolute bottom-[15%] right-[10%] opacity-[0.06] motion-safe:animate-[float_9s_ease-in-out_infinite_0.5s]"
				/>
				<OceanDiamond
					size={36}
					className="absolute top-[45%] right-[25%] opacity-[0.04] motion-safe:animate-[float_7.5s_ease-in-out_infinite_1.5s]"
				/>
			</div>

			{/* Content */}
			<div className="relative z-10 flex max-w-sm flex-col items-center gap-8 text-center">
				{/* Nerin identity mark: 5 mini trait shapes */}
				<div className="flex items-center gap-2" aria-hidden="true">
					<OceanCircle size={12} className="text-trait-openness" />
					<OceanRectangle size={12} className="text-trait-conscientiousness" />
					<OceanTriangle size={12} className="text-trait-extraversion" />
					<OceanDiamond size={12} className="text-trait-agreeableness" />
					<OceanHalfCircle size={12} className="text-trait-neuroticism" />
				</div>

				{/* Nerin's framing message */}
				<h1
					id={headingId}
					className="font-heading text-2xl font-bold leading-tight text-foreground sm:text-3xl"
				>
					I wrote this about the two of you.
				</h1>

				<p className="text-lg leading-relaxed text-muted-foreground">
					It's better to read this together.
				</p>

				{/* Ritual suggestion */}
				<p className="text-base leading-relaxed text-muted-foreground">
					{userAName && userBName
						? `${userAName} and ${userBName} — talk about what you're expecting before you read it.`
						: "Talk about what you're expecting before you read it."}
				</p>

				{/* Start button */}
				<Button
					ref={startButtonRef}
					data-testid="ritual-start-button"
					variant="default"
					className="mt-4 w-full min-h-11"
					onClick={onStart}
					aria-label="Start reading the relationship analysis"
				>
					Start
				</Button>
			</div>
		</div>
	);
}
