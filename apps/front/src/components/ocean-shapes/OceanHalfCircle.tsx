import { cn } from "@workspace/ui/lib/utils";

interface OceanHalfCircleProps {
	size?: number;
	color?: string;
	className?: string;
}

export function OceanHalfCircle({ size = 24, color, className }: OceanHalfCircleProps) {
	return (
		<svg
			width={size * 0.5}
			height={size}
			viewBox="0 0 12 24"
			fill={color ?? "currentColor"}
			aria-hidden="true"
			data-slot="ocean-shape-c"
			className={cn("shrink-0", className)}
		>
			<path d="M12 2 A10 10 0 0 0 12 22 Z" />
		</svg>
	);
}
