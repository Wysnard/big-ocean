import type { LucideIcon } from "lucide-react";

interface TraitCardProps {
	icon: LucideIcon;
	title: string;
	color: string;
	gradient: string;
	glow: string;
	humanDescription: string;
	isLarge?: boolean;
}

export function TraitCard({
	icon: Icon,
	title,
	color,
	gradient,
	glow,
	humanDescription,
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
				<Icon className="mb-3 h-10 w-10" style={{ color }} />
				<h3 className="mb-2 text-xl font-semibold text-foreground">{title}</h3>
				<p className="text-sm leading-relaxed text-muted-foreground">{humanDescription}</p>
			</div>
		</div>
	);
}
