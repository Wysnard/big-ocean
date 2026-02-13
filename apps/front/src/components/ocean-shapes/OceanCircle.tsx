import { cn } from "@workspace/ui/lib/utils";

interface OceanCircleProps {
	size?: number;
	color?: string;
	className?: string;
}

export function OceanCircle({ size = 24, color, className }: OceanCircleProps) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill={color ?? "currentColor"}
			aria-hidden="true"
			data-slot="ocean-shape-o"
			className={cn("shrink-0", className)}
		>
			<circle cx="12" cy="12" r="10" />
		</svg>
	);
}
