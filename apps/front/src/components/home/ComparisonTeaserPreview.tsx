import { ResultPreviewEmbed } from "./ResultPreviewEmbed";

export function ComparisonTeaserPreview() {
	return (
		<ResultPreviewEmbed ctaText="Discover how you compare">
			<div data-slot="comparison-teaser-preview" className="relative">
				{/* "Coming soon" badge */}
				<div className="absolute right-0 top-0 z-[2] rounded-md bg-secondary/90 px-2 py-1 font-mono text-[.6rem] text-white">
					Coming soon
				</div>

				{/* Overlaid radar charts */}
				<div className="flex flex-wrap items-center justify-center gap-5 max-[900px]:flex-col">
					<svg
						width="160"
						height="160"
						viewBox="0 0 200 200"
						aria-hidden="true"
						className="shrink-0"
					>
						{/* Grid pentagons */}
						<polygon
							points="100,20 175,65 155,155 45,155 25,65"
							fill="none"
							stroke="currentColor"
							strokeWidth="1"
							opacity=".12"
						/>
						<polygon
							points="100,45 155,75 142,140 58,140 45,75"
							fill="none"
							stroke="currentColor"
							strokeWidth="1"
							opacity=".06"
						/>

						{/* "You" polygon — uses zone-aware token */}
						<polygon
							points="100,28 168,72 140,148 55,135 35,70"
							fill="var(--radar-fill-you)"
							stroke="var(--primary)"
							strokeWidth="2"
						/>

						{/* "Friend" polygon — Teal */}
						<polygon
							points="100,40 150,80 130,140 65,130 50,75"
							fill="rgba(0,180,166,0.15)"
							stroke="var(--tertiary)"
							strokeWidth="2"
						/>

						{/* Score dots — "You" */}
						{[
							{ cx: 100, cy: 28 },
							{ cx: 168, cy: 72 },
							{ cx: 140, cy: 148 },
							{ cx: 55, cy: 135 },
							{ cx: 35, cy: 70 },
						].map((p) => (
							<circle
								key={`you-${p.cx}-${p.cy}`}
								cx={p.cx}
								cy={p.cy}
								r="4"
								fill="var(--primary)"
							/>
						))}

						{/* Score dots — "Friend" */}
						{[
							{ cx: 100, cy: 40 },
							{ cx: 150, cy: 80 },
							{ cx: 130, cy: 140 },
							{ cx: 65, cy: 130 },
							{ cx: 50, cy: 75 },
						].map((p) => (
							<circle
								key={`friend-${p.cx}-${p.cy}`}
								cx={p.cx}
								cy={p.cy}
								r="4"
								fill="var(--tertiary)"
							/>
						))}
					</svg>

					{/* Legend */}
					<div className="flex flex-col gap-[6px]">
						<div className="flex items-center gap-[7px] text-[.75rem] text-[var(--muted-dynamic)] transition-colors duration-[350ms]">
							<div className="h-[7px] w-[7px] shrink-0 rounded-full bg-primary" />
							You
						</div>
						<div className="flex items-center gap-[7px] text-[.75rem] text-[var(--muted-dynamic)] transition-colors duration-[350ms]">
							<div className="h-[7px] w-[7px] shrink-0 rounded-full bg-tertiary" />
							A Friend
						</div>
					</div>
				</div>
			</div>
		</ResultPreviewEmbed>
	);
}
