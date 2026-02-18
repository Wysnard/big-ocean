/** Rising peach/warm bubbles. Pure CSS animation. */

const PARTICLES = [
	{ position: "left", offset: "32px", size: 7, duration: "11s", delay: "0s" },
	{ position: "left", offset: "22px", size: 12, duration: "14s", delay: "3s" },
	{ position: "left", offset: "42px", size: 5, duration: "9s", delay: "7s" },
	{ position: "left", offset: "50px", size: 8, duration: "12s", delay: "5s" },
	{ position: "right", offset: "34px", size: 9, duration: "12s", delay: "2s" },
	{ position: "right", offset: "26px", size: 6, duration: "10s", delay: "6s" },
	{ position: "right", offset: "44px", size: 13, duration: "15s", delay: "9s" },
	{ position: "right", offset: "38px", size: 5, duration: "8s", delay: "4s" },
] as const;

export function Bubbles() {
	return (
		<>
			{PARTICLES.map((b) => (
				<div
					key={`${b.position}-${b.offset}-${b.size}`}
					data-slot="bubble-particle"
					className="absolute rounded-full"
					style={{
						[b.position]: b.offset,
						width: `${b.size}px`,
						height: `${b.size}px`,
						border: "1px solid var(--bubble-border-color)",
						backgroundColor: "var(--bubble-fill-color)",
						opacity: "var(--bubble-opacity)",
						animationName: "bubbleRise",
						animationDuration: b.duration,
						animationDelay: b.delay,
						animationTimingFunction: "linear",
						animationIterationCount: "infinite",
					}}
				/>
			))}
		</>
	);
}
