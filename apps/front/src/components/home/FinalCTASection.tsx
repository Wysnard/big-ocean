import { Link } from "@tanstack/react-router";
import { buttonVariants } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";

export function FinalCTASection() {
	return (
		<section data-slot="final-cta-section" className="relative overflow-hidden px-6 py-20">
			<div className="absolute inset-0 bg-[image:var(--gradient-surface-glow)]" />
			<div className="relative mx-auto max-w-3xl text-center">
				<h2 className="mb-6 text-4xl font-bold text-foreground">Ready to Take the Plunge?</h2>
				<p className="mb-8 text-lg text-muted-foreground">Takes 30 min · Free · No account needed</p>
				<Link
					to="/chat"
					className={cn(
						buttonVariants({ size: "lg" }),
						"min-h-11 bg-primary px-12 py-6 text-lg font-semibold text-primary-foreground transition-all hover:bg-primary/90",
					)}
				>
					Begin Your Dive
				</Link>
			</div>
		</section>
	);
}
