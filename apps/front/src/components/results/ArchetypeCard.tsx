import { cn } from "@workspace/ui/lib/utils";
import { GeometricSignature } from "../ocean-shapes/GeometricSignature";

export interface ArchetypeCardProps {
	archetypeName: string;
	oceanCode4: string;
	oceanCode5: string;
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
			{/* Color accent bar */}
			<div
				className={cn("absolute inset-x-0 top-0 h-1.5", isCurated ? "opacity-100" : "opacity-60")}
				style={{ backgroundColor: color }}
				data-testid="archetype-accent"
			/>

			{/* Header: name + codes + signature */}
			<div className="mt-2 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
				<div className="flex-1">
					<h2
						className="text-2xl font-bold tracking-tight text-foreground md:text-3xl"
						data-testid="archetype-name"
					>
						{archetypeName}
					</h2>

					{/* OCEAN codes */}
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

					{/* Geometric Signature */}
					<div className="mt-3">
						<GeometricSignature oceanCode={oceanCode5} baseSize={24} />
					</div>
				</div>

				{/* Confidence indicator */}
				<div
					className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2"
					data-testid="confidence-indicator"
				>
					<div className="h-8 w-8 rounded-full border-2 border-border flex items-center justify-center">
						<span className="text-xs font-bold text-foreground">{clampedConfidence}</span>
					</div>
					<span className="text-xs text-muted-foreground">% confidence</span>
				</div>
			</div>

			{/* Description */}
			<p
				className="mt-4 text-sm leading-relaxed text-muted-foreground md:text-base"
				data-testid="archetype-description"
			>
				{description}
			</p>

			{/* Curated badge */}
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
