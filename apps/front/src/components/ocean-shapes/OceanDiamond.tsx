import { cn } from "@workspace/ui/lib/utils";

interface OceanDiamondProps {
	size?: number;
	color?: string;
	className?: string;
}

export function OceanDiamond({ size = 24, color, className }: OceanDiamondProps) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill={color ?? "currentColor"}
			aria-hidden="true"
			data-slot="ocean-shape-n"
			className={cn("shrink-0", className)}
		>
			<polygon points="12,1 23,12 12,23 1,12" />
		</svg>
	);
}
