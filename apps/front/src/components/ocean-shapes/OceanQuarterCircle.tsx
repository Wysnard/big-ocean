import { cn } from "@workspace/ui/lib/utils";

interface OceanQuarterCircleProps {
	size?: number;
	color?: string;
	className?: string;
}

/** B — Extraversion Mid (Balanced): Quarter-circle */
export function OceanQuarterCircle({ size = 24, color, className }: OceanQuarterCircleProps) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill={color ?? "currentColor"}
			aria-hidden="true"
			data-slot="ocean-shape-b"
			className={cn("shrink-0", className)}
		>
			<path d="M2 2v20A20 20 0 0 0 22 2z" />
		</svg>
	);
}
