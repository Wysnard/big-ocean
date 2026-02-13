import { useNavigate } from "@tanstack/react-router";
import { Button } from "@workspace/ui/components/button";

export function FinalCTASection() {
	const navigate = useNavigate();

	return (
		<section data-slot="final-cta-section" className="relative overflow-hidden px-6 py-20">
			<div className="absolute inset-0 bg-[image:var(--gradient-ocean-subtle)]" />
			<div className="relative mx-auto max-w-3xl text-center">
				<h2 className="mb-6 text-4xl font-bold text-foreground">Ready to Take the Plunge?</h2>
				<p className="mb-8 text-lg text-muted-foreground">
					A 20-minute deep dive · Free · No account needed
				</p>
				<Button
					onClick={() =>
						navigate({
							to: "/chat",
							search: { sessionId: undefined },
						})
					}
					size="lg"
					className="min-h-11 bg-primary px-12 py-6 text-lg font-semibold text-primary-foreground transition-all hover:bg-primary/90"
				>
					Begin Your Dive
				</Button>
			</div>
		</section>
	);
}
