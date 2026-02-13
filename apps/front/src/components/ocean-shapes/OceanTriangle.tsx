import { cn } from "@workspace/ui/lib/utils";

interface OceanTriangleProps {
	size?: number;
	color?: string;
	className?: string;
}

export function OceanTriangle({ size = 24, color, className }: OceanTriangleProps) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill={color ?? "currentColor"}
			aria-hidden="true"
			data-slot="ocean-shape-a"
			className={cn("shrink-0", className)}
		>
			<polygon points="12,2 22,22 2,22" />
		</svg>
	);
}
