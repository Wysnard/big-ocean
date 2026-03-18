import { cn } from "@workspace/ui/lib/utils";

interface OceanCutSquareProps {
	size?: number;
	color?: string;
	className?: string;
}

/** M — Openness Mid (Moderate): Square with inverted triangle cut out */
export function OceanCutSquare({ size = 24, color, className }: OceanCutSquareProps) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill={color ?? "currentColor"}
			aria-hidden="true"
			data-slot="ocean-shape-m"
			className={cn("shrink-0", className)}
		>
			<path d="M2 2h20v20H2z M12 2L6 14h12z" fillRule="evenodd" />
		</svg>
	);
}
