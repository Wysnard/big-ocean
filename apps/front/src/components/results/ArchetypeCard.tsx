import type { OceanCode4, OceanCode5 } from "@workspace/domain";
import { ArchetypeSummaryTile } from "@workspace/ui/components/archetype-summary-tile";
import { OceanHieroglyphCode } from "@workspace/ui/components/ocean-hieroglyph-code";
import { cn } from "@workspace/ui/lib/utils";

export interface ArchetypeCardProps {
	archetypeName: string;
	oceanCode4: OceanCode4;
	oceanCode5: OceanCode5;
	description: string;
	color: string;
	isCurated: boolean;
	overallConfidence: number;
	className?: string;
}

/**
 * Displays the user's personality archetype with OCEAN codes,
 * description, and confidence indicator.
 */
export function ArchetypeCard({
	archetypeName,
	oceanCode4,
	oceanCode5,
	description,
	color,
	isCurated,
	overallConfidence,
	className,
}: ArchetypeCardProps) {
	const clampedConfidence = Math.min(Math.max(overallConfidence, 0), 100);

	return (
		<article
			aria-label={`Archetype: ${archetypeName}`}
			data-testid="archetype-card"
			data-slot="archetype-card"
			className={cn(
				"relative overflow-hidden rounded-2xl border border-border bg-card p-6 md:p-8",
				className,
			)}
		>
			<div
				className={cn("absolute inset-x-0 top-0 h-1.5", isCurated ? "opacity-100" : "opacity-60")}
				style={{ backgroundColor: color }}
				data-testid="archetype-accent"
			/>

			<ArchetypeSummaryTile
				headerLayout="split"
				nameAs="h2"
				name={archetypeName}
				oceanCode5={oceanCode5}
				description={description}
				nameTestId="archetype-name"
				descriptionTestId="archetype-description"
				descriptionClassName="mt-4 text-sm leading-relaxed text-muted-foreground md:text-base"
				codeRow={
					<div className="mt-2 flex items-center gap-3">
						<span
							className="rounded-md bg-muted px-2.5 py-1 font-mono text-sm font-semibold text-foreground"
							data-testid="ocean-code-4"
						>
							{oceanCode4}
						</span>
						<span className="font-mono text-xs text-muted-foreground" data-testid="ocean-code-5">
							{oceanCode5}
						</span>
					</div>
				}
				afterCodeRow={
					<div className="mt-3">
						<OceanHieroglyphCode code={oceanCode5} size={24} />
					</div>
				}
				trailing={
					<div
						className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2"
						data-testid="confidence-indicator"
					>
						<div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-border">
							<span className="text-xs font-bold text-foreground">{clampedConfidence}</span>
						</div>
						<span className="text-xs text-muted-foreground">% confidence</span>
					</div>
				}
			/>

			{isCurated && (
				<span
					className="mt-4 inline-block rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground"
					data-testid="curated-badge"
				>
					Curated archetype
				</span>
			)}
		</article>
	);
}
