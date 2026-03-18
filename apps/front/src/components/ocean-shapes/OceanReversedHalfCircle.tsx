import { cn } from "@workspace/ui/lib/utils";

interface OceanReversedHalfCircleProps {
	size?: number;
	color?: string;
	className?: string;
}

/** D — Agreeableness Low (Direct): Half-circle facing opposite direction (reversed) */
export function OceanReversedHalfCircle({
	size = 24,
	color,
	className,
}: OceanReversedHalfCircleProps) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill={color ?? "currentColor"}
			aria-hidden="true"
			data-slot="ocean-shape-d"
			className={cn("shrink-0", className)}
		>
			<path d="M6 2 A10 10 0 0 1 6 22 Z" />
		</svg>
	);
}
