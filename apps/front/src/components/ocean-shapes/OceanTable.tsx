import { cn } from "@workspace/ui/lib/utils";

interface OceanTableProps {
	size?: number;
	color?: string;
	className?: string;
}

/** R — Neuroticism Low (Resilient): Square on two sticks */
export function OceanTable({ size = 24, color, className }: OceanTableProps) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill={color ?? "currentColor"}
			aria-hidden="true"
			data-slot="ocean-shape-r"
			className={cn("shrink-0", className)}
		>
			<rect x="2" y="2" width="20" height="14" />
			<rect x="5" y="16" width="4" height="6" />
			<rect x="15" y="16" width="4" height="6" />
		</svg>
	);
}
