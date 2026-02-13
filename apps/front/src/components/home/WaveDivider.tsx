import { cn } from "@workspace/ui/lib/utils";

interface WaveDividerProps {
	className?: string;
	/** CSS color value for the section above the wave (fills the area above the wave line) */
	fromColor: string;
	variant?: "gentle" | "deep";
}

const PATHS = {
	gentle: "M0,32 C360,44 720,20 1080,32 C1260,38 1380,35 1440,32 L1440,50 L0,50 Z",
	deep: "M0,28 C240,42 480,14 720,30 C960,46 1200,14 1440,28 L1440,50 L0,50 Z",
};

export function WaveDivider({ className, fromColor, variant = "gentle" }: WaveDividerProps) {
	return (
		<svg
			data-slot="wave-divider"
			viewBox="0 0 1440 50"
			preserveAspectRatio="none"
			aria-hidden="true"
			className={cn("block w-full h-auto", className)}
		>
			{/* Fill area above the wave with previous section color */}
			<rect x="0" y="0" width="1440" height="32" fill={fromColor} />
			{/* Wave path fills with next section color via currentColor */}
			<path fill="currentColor" d={PATHS[variant]} />
		</svg>
	);
}
