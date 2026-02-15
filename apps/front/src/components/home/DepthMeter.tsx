import { useDepthScroll } from "./DepthScrollProvider";

export function DepthMeter() {
	const { scrollPercent } = useDepthScroll();

	return (
		<nav
			data-slot="depth-meter"
			className="fixed left-5 top-1/2 z-[90] flex -translate-y-1/2 flex-col items-center transition-opacity duration-500 max-[900px]:hidden"
			style={{
				opacity: scrollPercent > 0.05 ? 1 : 0,
				pointerEvents: scrollPercent > 0.05 ? "auto" : "none",
			}}
			aria-label="Scroll progress"
		>
			{/* Track */}
			<div className="h-[160px] w-[2px] rounded-[1px] bg-border">
				{/* Fill */}
				<div
					className="w-full rounded-[1px] bg-primary transition-[height] duration-[80ms] ease-linear"
					style={{ height: `${scrollPercent * 100}%` }}
				/>
			</div>
		</nav>
	);
}
