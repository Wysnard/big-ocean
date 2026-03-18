import { cn } from "@workspace/ui/lib/utils";

interface OceanThreeQuarterSquareProps {
	size?: number;
	color?: string;
	className?: string;
}

/** F — Conscientiousness Low (Flexible): Three-quarter square (right side missing) */
export function OceanThreeQuarterSquare({
	size = 24,
	color,
	className,
}: OceanThreeQuarterSquareProps) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill={color ?? "currentColor"}
			aria-hidden="true"
			data-slot="ocean-shape-f"
			className={cn("shrink-0", className)}
		>
			<path d="M2 2h20v4H6v14h18v4H2z" />
		</svg>
	);
}
