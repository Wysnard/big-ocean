import { OceanSpinner } from "@workspace/ui/components/ocean-spinner";

/**
 * Distraction-free generating state shown while Nerin writes the user's portrait.
 * Displays only OceanSpinner + a single Nerin-voiced line — no nav, no header, no progress.
 * Story 2.2 AC #1, #2, #3.
 */
export function PortraitGeneratingState() {
	return (
		<div
			data-testid="portrait-generating-state"
			data-slot="portrait-generating-state"
			className="min-h-[calc(100dvh-3.5rem)] bg-background flex items-center justify-center"
		>
			<div className="flex flex-col items-center gap-6 mx-auto max-w-[65ch] px-6">
				<OceanSpinner code="OCEAN" size={48} />
				<p className="text-foreground/60 font-heading text-base">Nerin is writing your letter...</p>
			</div>
		</div>
	);
}
