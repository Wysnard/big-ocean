import { cn } from "@workspace/ui/lib/utils";
import { OceanCircle } from "./OceanCircle";
import { OceanDiamond } from "./OceanDiamond";
import { OceanHalfCircle } from "./OceanHalfCircle";
import { OceanRectangle } from "./OceanRectangle";
import { OceanTriangle } from "./OceanTriangle";

interface OceanShapeSetProps {
	size?: number;
	variant?: "color" | "monochrome";
	className?: string;
}

export function OceanShapeSet({ size = 24, variant = "color", className }: OceanShapeSetProps) {
	const isMonochrome = variant === "monochrome";

	return (
		<span
			data-slot="ocean-shape-set"
			className={cn("inline-flex items-center gap-[0.15em]", className)}
		>
			<OceanCircle size={size} color={isMonochrome ? "currentColor" : "var(--trait-openness)"} />
			<OceanHalfCircle
				size={size}
				color={isMonochrome ? "currentColor" : "var(--trait-conscientiousness)"}
			/>
			<OceanRectangle
				size={size}
				color={isMonochrome ? "currentColor" : "var(--trait-extraversion)"}
			/>
			<OceanTriangle
				size={size}
				color={isMonochrome ? "currentColor" : "var(--trait-agreeableness)"}
			/>
			<OceanDiamond size={size} color={isMonochrome ? "currentColor" : "var(--trait-neuroticism)"} />
		</span>
	);
}
