import { cn } from "@workspace/ui/lib/utils";

interface OceanDoubleQuarterProps {
	size?: number;
	color?: string;
	className?: string;
}

/** S — Conscientiousness Mid (Steady): Two quarter-circles facing outward */
export function OceanDoubleQuarter({ size = 24, color, className }: OceanDoubleQuarterProps) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill={color ?? "currentColor"}
			aria-hidden="true"
			data-slot="ocean-shape-s"
			className={cn("shrink-0", className)}
		>
			<path d="M2 2v10A10 10 0 0 0 12 2z" />
			<path d="M22 22V12A10 10 0 0 0 12 22z" />
		</svg>
	);
}
