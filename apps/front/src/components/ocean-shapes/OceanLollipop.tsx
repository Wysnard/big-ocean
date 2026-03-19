import { cn } from "@workspace/ui/lib/utils";

interface OceanLollipopProps {
	size?: number;
	color?: string;
	className?: string;
}

/** P — Agreeableness Mid (Pragmatic): Square on one stick */
export function OceanLollipop({ size = 24, color, className }: OceanLollipopProps) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill={color ?? "currentColor"}
			aria-hidden="true"
			data-slot="ocean-shape-p"
			className={cn("shrink-0", className)}
		>
			<rect x="5" y="2" width="14" height="14" />
			<rect x="10" y="16" width="4" height="6" />
		</svg>
	);
}
