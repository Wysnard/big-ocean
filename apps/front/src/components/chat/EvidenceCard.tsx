import { cn } from "@workspace/ui/lib/utils";

interface FacetData {
	name: string;
	confidence: number;
}

interface EvidenceCardProps {
	facets: FacetData[];
	className?: string;
}

/**
 * Mini evidence card embedded in the message stream, showing facet names with confidence bars.
 * Prepared for future use when the backend or frontend adds inline evidence summaries.
 */
export function EvidenceCard({ facets, className }: EvidenceCardProps) {
	return (
		<div
			data-slot="evidence-card"
			className={cn(
				"rounded-xl border p-3 backdrop-blur-sm my-2",
				"bg-card/80 border-border text-foreground dark:bg-white/5 dark:border-white/10 dark:text-white/90",
				className,
			)}
		>
			<div className="space-y-1.5">
				{facets.map((facet) => (
					<div key={facet.name} className="flex items-center gap-2">
						<span className="text-[0.75rem] leading-none w-24 shrink-0 truncate text-muted-foreground dark:text-white/70">
							{facet.name}
						</span>
						<div className="flex-1 h-[5px] rounded-full overflow-hidden bg-muted dark:bg-white/10">
							<div
								className="h-full rounded-full bg-primary motion-safe:transition-[width] motion-safe:duration-500 motion-safe:ease-out"
								style={{ width: `${facet.confidence * 100}%` }}
							/>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
