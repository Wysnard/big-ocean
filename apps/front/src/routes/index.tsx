import { createFileRoute } from "@tanstack/react-router";
import { ArchetypeTeaserSection } from "../components/home/ArchetypeTeaserSection";
import { ChatPreviewSection } from "../components/home/ChatPreviewSection";
import { DiscoverSection } from "../components/home/DiscoverSection";
import { FinalCTASection } from "../components/home/FinalCTASection";
import { HeroSection } from "../components/home/HeroSection";
import { TraitsSection } from "../components/home/TraitsSection";
import { ValuePropsSection } from "../components/home/ValuePropsSection";
import { WaveDivider } from "../components/home/WaveDivider";

export const Route = createFileRoute("/")({
	component: App,
});

const MID_BUBBLES = [
	{ size: 10, left: "8%", delay: "0s", duration: "10s" },
	{ size: 16, left: "22%", delay: "3s", duration: "12s" },
	{ size: 12, left: "55%", delay: "1s", duration: "11s" },
	{ size: 14, left: "78%", delay: "4s", duration: "9s" },
];

const DEEP_BUBBLES = [
	{ size: 14, left: "12%", delay: "1s", duration: "9s" },
	{ size: 20, left: "30%", delay: "0s", duration: "11s" },
	{ size: 10, left: "48%", delay: "3s", duration: "13s" },
	{ size: 18, left: "68%", delay: "2s", duration: "10s" },
	{ size: 12, left: "85%", delay: "5s", duration: "12s" },
	{ size: 22, left: "95%", delay: "1.5s", duration: "8s" },
];

function Bubbles({
	config,
}: {
	config: { size: number; left: string; delay: string; duration: string }[];
}) {
	return (
		<div aria-hidden="true">
			{config.map((b) => (
				<div
					key={`${b.left}-${b.delay}`}
					className="absolute bottom-0 rounded-full bg-white/30 dark:bg-white/15 motion-safe:animate-[bubble_var(--dur)_linear_infinite]"
					style={
						{
							width: `${b.size}px`,
							height: `${b.size}px`,
							left: b.left,
							"--dur": b.duration,
							animationDelay: b.delay,
						} as React.CSSProperties
					}
				/>
			))}
		</div>
	);
}

function App() {
	return (
		<div className="min-h-screen">
			{/* Surface zone */}
			<div style={{ backgroundColor: "var(--depth-surface)" }}>
				<HeroSection />
				<WaveDivider
					fromColor="var(--depth-surface)"
					className="text-(--depth-shallows)"
					variant="gentle"
				/>
			</div>

			{/* Shallows zone */}
			<div style={{ backgroundColor: "var(--depth-shallows)" }}>
				<ValuePropsSection />
				<ChatPreviewSection />
				<WaveDivider
					fromColor="var(--depth-shallows)"
					className="text-(--depth-mid)"
					variant="gentle"
				/>
			</div>

			{/* Mid zone — bubbles start appearing */}
			<div className="relative overflow-hidden" style={{ backgroundColor: "var(--depth-mid)" }}>
				<Bubbles config={MID_BUBBLES} />
				<TraitsSection />
				<ArchetypeTeaserSection />
				<WaveDivider fromColor="var(--depth-mid)" className="text-(--depth-deep)" variant="gentle" />
			</div>

			{/* Deep zone — more bubbles */}
			<div className="relative overflow-hidden" style={{ backgroundColor: "var(--depth-deep)" }}>
				<Bubbles config={DEEP_BUBBLES} />
				<DiscoverSection />
				<FinalCTASection />
			</div>
		</div>
	);
}
