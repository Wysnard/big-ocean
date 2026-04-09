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
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTitle,
} from "@workspace/ui/components/dialog";
import { OceanHieroglyph } from "@workspace/ui/components/ocean-hieroglyph";
import { useEffect, useId, useRef } from "react";

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
		<Dialog open onOpenChange={() => {}}>
			<DialogContent
				data-testid="ritual-screen"
				aria-labelledby={headingId}
				aria-describedby={undefined}
				showCloseButton={false}
				className="fixed inset-0 max-w-none translate-x-0 translate-y-0 rounded-none border-0 p-0 shadow-none"
				onEscapeKeyDown={(event) => {
					event.preventDefault();
				}}
				onOpenAutoFocus={(event) => {
					event.preventDefault();
					startButtonRef.current?.focus();
				}}
			>
				<div
					data-slot="ritual-screen"
					className="flex min-h-screen flex-col items-center justify-center bg-background px-6 motion-safe:animate-fade-in"
				>
					<DialogTitle className="sr-only">Relationship ritual</DialogTitle>
					{/* Floating hieroglyphs at very low opacity */}
					<div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
						<OceanHieroglyph
							letter="O"
							className="absolute top-[12%] left-[8%] opacity-[0.06] motion-safe:animate-[float_6s_ease-in-out_infinite]"
							style={{ width: 64, height: 64 }}
						/>
						<OceanHieroglyph
							letter="N"
							className="absolute top-[20%] right-[12%] opacity-[0.05] motion-safe:animate-[float_8s_ease-in-out_infinite_1s]"
							style={{ width: 48, height: 48 }}
						/>
						<OceanHieroglyph
							letter="C"
							className="absolute bottom-[25%] left-[15%] opacity-[0.04] motion-safe:animate-[float_7s_ease-in-out_infinite_2s]"
							style={{ width: 56, height: 56 }}
						/>
						<OceanHieroglyph
							letter="A"
							className="absolute bottom-[15%] right-[10%] opacity-[0.06] motion-safe:animate-[float_9s_ease-in-out_infinite_0.5s]"
							style={{ width: 40, height: 40 }}
						/>
						<OceanHieroglyph
							letter="E"
							className="absolute top-[45%] right-[25%] opacity-[0.04] motion-safe:animate-[float_7.5s_ease-in-out_infinite_1.5s]"
							style={{ width: 36, height: 36 }}
						/>
					</div>

					{/* Content */}
					<div className="relative z-10 flex max-w-sm flex-col items-center gap-8 text-center">
						{/* Nerin identity mark: 5 mini trait hieroglyphs */}
						<div className="flex items-center gap-2" aria-hidden="true">
							<span data-trait="openness">
								<OceanHieroglyph letter="O" style={{ width: 12, height: 12 }} />
							</span>
							<span data-trait="conscientiousness">
								<OceanHieroglyph letter="C" style={{ width: 12, height: 12 }} />
							</span>
							<span data-trait="extraversion">
								<OceanHieroglyph letter="E" style={{ width: 12, height: 12 }} />
							</span>
							<span data-trait="agreeableness">
								<OceanHieroglyph letter="A" style={{ width: 12, height: 12 }} />
							</span>
							<span data-trait="neuroticism">
								<OceanHieroglyph letter="N" style={{ width: 12, height: 12 }} />
							</span>
						</div>

						{/* Nerin's framing message */}
						<h1
							id={headingId}
							className="font-heading text-2xl font-bold leading-tight text-foreground sm:text-3xl"
						>
							I wrote this about the two of you.
						</h1>

						<DialogDescription asChild className="text-lg leading-relaxed text-muted-foreground">
							<p>It's better to read this together.</p>
						</DialogDescription>

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
			</DialogContent>
		</Dialog>
	);
}
