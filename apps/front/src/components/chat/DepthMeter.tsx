interface DepthMeterProps {
	progress: number;
}

export function DepthMeter({ progress }: DepthMeterProps) {
	return (
		<nav
			data-slot="depth-meter"
			className="fixed left-5 top-1/2 z-[90] flex -translate-y-1/2 flex-col items-center transition-opacity duration-500 max-[900px]:hidden"
			style={{
				opacity: progress > 0.02 ? 1 : 0,
				pointerEvents: progress > 0.02 ? "auto" : "none",
			}}
			aria-label="Assessment progress"
		>
			{/* Track */}
			<div className="h-[160px] w-[2px] rounded-[1px] bg-border">
				{/* Fill */}
				<div
					className="w-full rounded-[1px] bg-primary transition-[height] duration-[80ms] ease-linear"
					style={{ height: `${progress * 100}%` }}
				/>
			</div>
		</nav>
	);
}
