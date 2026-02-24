import { cn } from "@workspace/ui/lib/utils";

interface PsychedelicBackgroundProps {
	/** Controls opacity range of decorative shapes */
	intensity?: "subtle" | "medium";
	className?: string;
}

export function PsychedelicBackground({
	intensity = "subtle",
	className,
}: PsychedelicBackgroundProps) {
	const base = intensity === "subtle" ? 0.035 : 0.06;

	return (
		<div
			data-slot="psychedelic-background"
			aria-hidden="true"
			role="presentation"
			className={cn("absolute inset-0 overflow-hidden pointer-events-none", className)}
		>
			<style>{`
				@keyframes psychedelic-rotate {
					to { transform: translate(-50%, -50%) rotate(360deg); }
				}
				@keyframes psychedelic-rotate-reverse {
					to { transform: translate(-50%, -50%) rotate(-360deg); }
				}
				@media (prefers-reduced-motion: no-preference) {
					[data-slot="psychedelic-background"] .psy-shape { animation: psychedelic-rotate 60s linear infinite; }
					[data-slot="psychedelic-background"] .psy-shape-rev { animation: psychedelic-rotate-reverse 80s linear infinite; }
				}
			`}</style>

			{/* Openness — large circle */}
			<div
				className="psy-shape absolute top-1/2 left-1/2 rounded-full will-change-transform"
				style={{
					width: "70vmin",
					height: "70vmin",
					backgroundColor: "var(--trait-openness)",
					opacity: base,
					transform: "translate(-50%, -50%)",
				}}
			/>
			{/* Conscientiousness — diamond (rotated square) */}
			<div
				className="psy-shape-rev absolute top-1/2 left-1/2 will-change-transform"
				style={{
					width: "55vmin",
					height: "55vmin",
					backgroundColor: "var(--trait-conscientiousness)",
					opacity: base * 1.2,
					transform: "translate(-50%, -50%) rotate(45deg)",
				}}
			/>
			{/* Extraversion — wide rectangle */}
			<div
				className="psy-shape absolute top-1/2 left-1/2 will-change-transform"
				style={{
					width: "80vmin",
					height: "40vmin",
					backgroundColor: "var(--trait-extraversion)",
					opacity: base,
					transform: "translate(-50%, -50%)",
				}}
			/>
			{/* Agreeableness — triangle */}
			<div
				className="psy-shape-rev absolute top-1/2 left-1/2 will-change-transform"
				style={{
					width: "60vmin",
					height: "60vmin",
					backgroundColor: "var(--trait-agreeableness)",
					opacity: base * 1.1,
					clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)",
					transform: "translate(-50%, -50%)",
				}}
			/>
			{/* Neuroticism — concentric ring */}
			<div
				className="psy-shape absolute top-1/2 left-1/2 rounded-full will-change-transform"
				style={{
					width: "45vmin",
					height: "45vmin",
					border: "8vmin solid var(--trait-neuroticism)",
					opacity: base,
					transform: "translate(-50%, -50%)",
					backgroundColor: "transparent",
				}}
			/>
		</div>
	);
}
