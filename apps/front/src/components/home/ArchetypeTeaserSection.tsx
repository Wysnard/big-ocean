import { Link } from "@tanstack/react-router";
import { buttonVariants } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";

const EXAMPLE_ARCHETYPES = [
	{
		name: "Thoughtful Explorer",
		hint: "Curious, independent, always asking 'what if?'",
	},
	{
		name: "Steady Navigator",
		hint: "Grounded, reliable, the calm in any storm",
	},
	{
		name: "Bold Catalyst",
		hint: "Energetic, decisive, first to take the leap",
	},
];

export function ArchetypeTeaserSection() {
	return (
		<section data-slot="archetype-teaser-section" className="px-6 py-16">
			<div className="mx-auto max-w-3xl text-center">
				<h2 className="mb-2 text-3xl font-bold text-foreground">What Will You Find in the Deep?</h2>
				<p className="mb-6 text-lg text-muted-foreground">
					Your personality has a name. And you're not the only one who carries it.
				</p>
				<p className="mx-auto mb-10 max-w-2xl text-base leading-relaxed text-muted-foreground">
					Your dive distills 30 facets of who you are into a single archetype — a name that captures your
					unique pattern. It's not a box. It's a mirror. And it connects you to others who share the same
					depths.
				</p>

				{/* Example archetype mini-cards */}
				<div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
					{EXAMPLE_ARCHETYPES.map((archetype) => (
						<div
							key={archetype.name}
							className="rounded-xl border border-border/60 bg-card/60 p-5 opacity-80"
						>
							<h3 className="mb-1 text-base font-semibold text-foreground">{archetype.name}</h3>
							<p className="text-sm italic text-muted-foreground">"{archetype.hint}"</p>
						</div>
					))}
				</div>

				{/* Blurred mystery card */}
				<div className="relative mx-auto inline-block">
					<div className="w-72 rounded-xl border border-border bg-card p-6 blur-sm">
						<div className="mx-auto mb-4 h-16 w-16 rounded-full bg-[image:var(--gradient-celebration)]" />
						<h3 className="text-xl font-bold text-foreground">Thoughtful Explorer</h3>
						<p className="mt-2 text-sm text-muted-foreground">
							Creative, curious, and always seeking deeper understanding...
						</p>
					</div>

					{/* CTA overlay */}
					<div className="absolute inset-0 flex items-center justify-center">
						<Link
							to="/chat"
							className={cn(buttonVariants({ size: "lg" }), "min-h-11 bg-primary text-primary-foreground")}
						>
							Discover What's Below
						</Link>
					</div>
				</div>
			</div>
		</section>
	);
}
