import { cn } from "@workspace/ui/lib/utils";

interface OceanRectangleProps {
	size?: number;
	color?: string;
	className?: string;
}

export function OceanRectangle({ size = 24, color, className }: OceanRectangleProps) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill={color ?? "currentColor"}
			aria-hidden="true"
			data-slot="ocean-shape-e"
			className={cn("shrink-0", className)}
		>
			<rect x="7" y="2" width="10" height="20" rx="1" />
		</svg>
	);
}
