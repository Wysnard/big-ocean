import { Link } from "@tanstack/react-router";
import { buttonVariants } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";
import { OceanShapeSet } from "../ocean-shapes/OceanShapeSet";
import { ScrollIndicator } from "./ScrollIndicator";

export function HeroSection() {
	return (
		<section
			data-slot="hero-section"
			className="relative min-h-[80vh] overflow-hidden px-6 py-20 text-center sm:min-h-0 sm:py-24 md:py-32"
		>
			{/* Color block composition — hard-edged geometric shapes */}
			<div className="absolute inset-0 overflow-hidden" aria-hidden="true">
				{/* Openness — Circle (Purple) — top-left corner, tucked away */}
				<div
					className="absolute -top-[12%] -left-[10%] z-10 w-[28%] aspect-square rounded-full"
					style={{ backgroundColor: "var(--trait-openness)" }}
				/>

				{/* Extraversion — Rectangle (Electric Pink) — bottom-right corner, tilted */}
				<div
					className="absolute -bottom-[8%] -right-[5%] z-0 w-[25%] aspect-[5/3] rotate-[-12deg] rounded-2xl"
					style={{ backgroundColor: "var(--trait-extraversion)" }}
				/>

				{/* Agreeableness — Triangle (Teal) — bottom-left corner, pointing up */}
				<div
					className="absolute -bottom-[3%] -left-[2%] z-20 w-[12%] aspect-square"
					style={{
						backgroundColor: "var(--trait-agreeableness)",
						clipPath: "polygon(50% 0, 100% 100%, 0 100%)",
					}}
				/>
			</div>

			{/* Content overlay — z-30 ensures text renders above all color block shapes */}
			<div className="relative z-30 mx-auto max-w-5xl">
				{/* Brand mark at hero scale */}
				<div className="mb-8 flex items-center justify-center gap-2">
					<span className="font-heading text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
						big-
					</span>
					<OceanShapeSet size={36} className="sm:hidden" />
					<OceanShapeSet size={44} className="hidden sm:inline-flex" />
				</div>

				<h1 className="mb-4 font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-[3rem] md:leading-[1.1]">
					Explore the Depths of Who You Are
				</h1>
				<p className="mb-8 text-lg text-muted-foreground md:text-xl">
					A personality deep dive guided by AI, grounded in science
				</p>

				<div className="flex flex-col items-center gap-4">
					<Link
						data-testid="hero-cta"
						to="/chat"
						className={cn(
							buttonVariants({ size: "lg" }),
							"min-h-11 w-full bg-primary px-8 py-6 text-lg font-semibold text-primary-foreground transition-all hover:bg-primary/90 sm:w-auto",
						)}
					>
						Begin Your Dive
					</Link>
					<p className="mt-2 text-sm text-muted-foreground">Takes 30 min · Free · No account needed</p>
				</div>

				<ScrollIndicator />
			</div>
		</section>
	);
}
