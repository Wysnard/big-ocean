import { cn } from "@workspace/ui/lib/utils";

interface OceanOvalProps {
	size?: number;
	color?: string;
	className?: string;
}

/** I — Extraversion Low (Introverted): Vertical ellipse */
export function OceanOval({ size = 24, color, className }: OceanOvalProps) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill={color ?? "currentColor"}
			aria-hidden="true"
			data-slot="ocean-shape-i"
			className={cn("shrink-0", className)}
		>
			<ellipse cx="12" cy="12" rx="6" ry="10" />
		</svg>
	);
}
