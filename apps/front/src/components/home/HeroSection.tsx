import { useNavigate } from "@tanstack/react-router";
import { Button } from "@workspace/ui/components/button";
import { Waves } from "lucide-react";
import { ScrollIndicator } from "./ScrollIndicator";

export function HeroSection() {
	const navigate = useNavigate();

	return (
		<section data-slot="hero-section" className="relative overflow-hidden px-6 py-20 text-center">
			{/* Coral reef sky gradient (light) / Moonlit navy gradient (dark) */}
			<div
				className={[
					"absolute inset-0",
					// Light: coral reef — warm coral-pink at top fading to teal hints at horizon
					"bg-[linear-gradient(180deg,_oklch(0.92_0.06_350)_0%,_oklch(0.90_0.08_10)_30%,_oklch(0.92_0.04_195)_55%,_oklch(0.98_0.008_60)_100%)]",
					// Dark: moonlit navy — visible saturated navy with blue richness
					"dark:bg-[linear-gradient(180deg,_oklch(0.26_0.07_245)_0%,_oklch(0.22_0.065_245)_40%,_oklch(0.19_0.06_246)_70%,_oklch(0.26_0.06_248)_100%)]",
				].join(" ")}
			/>

			{/* Coral glow (light) / Moon glow (dark) */}
			<div
				className={[
					"absolute inset-0 pointer-events-none",
					// Light: warm coral glow with teal wash at top center
					"bg-[radial-gradient(ellipse_60%_50%_at_50%_-5%,_oklch(0.80_0.12_350_/_0.5)_0%,_oklch(0.85_0.08_195_/_0.2)_40%,_transparent_70%)]",
					// Dark: golden moonlight glow from top
					"dark:bg-[radial-gradient(ellipse_60%_50%_at_50%_-5%,_oklch(0.70_0.10_85_/_0.3)_0%,_oklch(0.45_0.10_235_/_0.15)_40%,_transparent_70%)]",
				].join(" ")}
			/>

			{/* Animated shimmer — caustic sunlight on coral (light) / moonlit ripples (dark) */}
			<div
				className={[
					"absolute inset-0 pointer-events-none opacity-[0.12] bg-[length:200%_200%] motion-safe:animate-[caustic_8s_ease-in-out_infinite]",
					"bg-[radial-gradient(ellipse_at_30%_40%,_oklch(0.75_0.14_195_/_0.8)_0%,_transparent_50%),radial-gradient(ellipse_at_70%_60%,_oklch(0.70_0.20_50_/_0.6)_0%,_transparent_50%)]",
					"dark:bg-[radial-gradient(ellipse_at_30%_40%,_oklch(0.55_0.14_235_/_0.6)_0%,_transparent_50%),radial-gradient(ellipse_at_70%_60%,_oklch(0.84_0.10_85_/_0.4)_0%,_transparent_50%)]",
				].join(" ")}
			/>

			<div className="relative mx-auto max-w-5xl">
				<div className="mb-6">
					<Waves className="mx-auto mb-4 h-20 w-20 text-primary motion-safe:animate-[wave_4s_ease-in-out_infinite]" />
					<h1 className="text-5xl font-black tracking-[-0.08em] text-foreground sm:text-6xl md:text-7xl">
						<span className="bg-[image:var(--gradient-ocean)] bg-clip-text text-transparent">
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
