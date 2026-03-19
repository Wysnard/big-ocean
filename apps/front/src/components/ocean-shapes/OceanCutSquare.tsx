import { cn } from "@workspace/ui/lib/utils";

interface OceanCutSquareProps {
	size?: number;
	color?: string;
	className?: string;
}

/** M — Openness Mid (Moderate): Horizontal rectangle (wider than tall) */
export function OceanCutSquare({ size = 24, color, className }: OceanCutSquareProps) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill={color ?? "currentColor"}
			aria-hidden="true"
			data-slot="ocean-shape-m"
			className={cn("shrink-0", className)}
		>
			<path d="M2 7h20v10H2z" />
		</svg>
	);
}
