import { cn } from "@workspace/ui/lib/utils";

interface OceanCrossProps {
	size?: number;
	color?: string;
	className?: string;
}

/** T — Openness Low (Traditional): Equilateral cross standing upright */
export function OceanCross({ size = 24, color, className }: OceanCrossProps) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill={color ?? "currentColor"}
			aria-hidden="true"
			data-slot="ocean-shape-t"
			className={cn("shrink-0", className)}
		>
			<path d="M9 2h6v7h7v6h-7v7H9v-7H2V9h7z" />
		</svg>
	);
}
