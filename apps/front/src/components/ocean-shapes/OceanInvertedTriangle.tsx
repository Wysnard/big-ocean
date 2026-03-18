import { cn } from "@workspace/ui/lib/utils";

interface OceanInvertedTriangleProps {
	size?: number;
	color?: string;
	className?: string;
}

/** V — Neuroticism Mid (Variable): Inverted triangle (point down) */
export function OceanInvertedTriangle({ size = 24, color, className }: OceanInvertedTriangleProps) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill={color ?? "currentColor"}
			aria-hidden="true"
			data-slot="ocean-shape-v"
			className={cn("shrink-0", className)}
		>
			<polygon points="2,2 22,2 12,22" />
		</svg>
	);
}
