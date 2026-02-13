import type { ReactNode } from "react";

interface TraitCardProps {
	shapeElement: ReactNode;
	title: string;
	color: string;
	gradient: string;
	glow: string;
	humanDescription: string;
	facets?: string[];
	isLarge?: boolean;
}

export function TraitCard({
	shapeElement,
	title,
	color,
	gradient,
	glow,
	humanDescription,
	facets,
	isLarge,
}: TraitCardProps) {
	return (
		<div
			data-slot="trait-card"
			className={`group relative overflow-hidden rounded-xl border border-border bg-card p-6 transition-all duration-300 hover:border-primary/50 hover:shadow-[var(--trait-glow)] ${
				isLarge ? "col-span-2 row-span-2 sm:col-span-2 sm:row-span-2" : ""
			}`}
			style={
				{
					"--trait-glow": glow,
					backgroundImage: "none",
				} as React.CSSProperties
			}
		>
			{/* Gradient overlay on hover */}
			<div
				className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-20"
				style={{ backgroundImage: gradient }}
			/>

			<div className="relative">
				<div className="mb-3" style={{ color }}>
					{shapeElement}
				</div>
				<h3 className="mb-2 text-xl font-semibold text-foreground">{title}</h3>
				<p className="text-sm leading-relaxed text-muted-foreground">{humanDescription}</p>

				{/* Facet preview on hover */}
				{facets && facets.length > 0 && (
					<div className="mt-3 max-h-0 overflow-hidden opacity-0 transition-all duration-300 group-hover:max-h-40 group-hover:opacity-100">
						<div className="flex flex-wrap gap-1.5">
							{facets.map((facet) => (
								<span
									key={facet}
									className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground"
									style={{ borderColor: color }}
								>
									{facet}
								</span>
							))}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
