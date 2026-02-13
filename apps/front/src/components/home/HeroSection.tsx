import { useNavigate } from "@tanstack/react-router";
import { Button } from "@workspace/ui/components/button";
import { Waves } from "lucide-react";
import { ScrollIndicator } from "./ScrollIndicator";

export function HeroSection() {
	const navigate = useNavigate();

	return (
		<section data-slot="hero-section" className="relative overflow-hidden px-6 py-20 text-center">
			{/* Psychedelic celebration gradient (light) / Abyss deep-ocean gradient (dark) */}
			<div
				className={[
					"absolute inset-0",
					// Light: psychedelic celebration — warm pink at top fading through peach to teal hints to cream
					"bg-[linear-gradient(180deg,_#FFE0EC_0%,_#FFE8D8_30%,_#E8F5F3_55%,_#FFF8F0_100%)]",
					// Dark: abyss deep-ocean — deep navy layered progression
					"dark:bg-[linear-gradient(180deg,_#141838_0%,_#0E1230_40%,_#0A0E27_70%,_#141838_100%)]",
				].join(" ")}
			/>

			{/* Electric pink glow (light) / Teal-gold glow (dark) */}
			<div
				className={[
					"absolute inset-0 pointer-events-none",
					// Light: electric pink glow with teal wash at top center
					"bg-[radial-gradient(ellipse_60%_50%_at_50%_-5%,_#FF008080_0%,_#00B4A633_40%,_transparent_70%)]",
					// Dark: teal glow with gold accent from top
					"dark:bg-[radial-gradient(ellipse_60%_50%_at_50%_-5%,_#00D4C84D_0%,_#FFB83026_40%,_transparent_70%)]",
				].join(" ")}
			/>

			{/* Animated shimmer — psychedelic light play (light) / deep-ocean bioluminescence (dark) */}
			<div
				className={[
					"absolute inset-0 pointer-events-none opacity-[0.12] bg-[length:200%_200%] motion-safe:animate-[caustic_8s_ease-in-out_infinite]",
					"bg-[radial-gradient(ellipse_at_30%_40%,_#00B4A6CC_0%,_transparent_50%),radial-gradient(ellipse_at_70%_60%,_#FF6B2B99_0%,_transparent_50%)]",
					"dark:bg-[radial-gradient(ellipse_at_30%_40%,_#00D4C899_0%,_transparent_50%),radial-gradient(ellipse_at_70%_60%,_#FFB83066_0%,_transparent_50%)]",
				].join(" ")}
			/>

			<div className="relative mx-auto max-w-5xl">
				<div className="mb-6">
					<Waves className="mx-auto mb-4 h-20 w-20 text-primary motion-safe:animate-[wave_4s_ease-in-out_infinite]" />
					<h1 className="text-5xl font-black tracking-[-0.08em] text-foreground sm:text-6xl md:text-7xl">
						<span className="bg-[image:var(--gradient-celebration)] bg-clip-text text-transparent">
							Big Ocean
						</span>
					</h1>
				</div>
				<p className="mb-2 text-xl font-light text-foreground md:text-3xl">
					Explore the Depths of Who You Are
				</p>
				<p className="mb-6 text-base text-muted-foreground md:text-lg">
					A deep dive into who you really are — guided by AI, grounded in science
				</p>
				<div className="flex flex-col items-center gap-4">
					<Button
						onClick={() =>
							navigate({
								to: "/chat",
								search: { sessionId: undefined },
							})
						}
						size="lg"
						className="min-h-11 bg-primary px-8 py-6 text-lg font-semibold text-primary-foreground transition-all hover:bg-primary/90"
					>
						Begin Your Dive
					</Button>
					<p className="mt-2 text-sm text-muted-foreground">A 20-minute deep dive · No account needed</p>
				</div>
				<ScrollIndicator />
			</div>
		</section>
	);
}
