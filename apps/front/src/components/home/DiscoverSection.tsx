import type { LucideIcon } from "lucide-react";
import { Fingerprint, Lightbulb, Share2, TrendingUp } from "lucide-react";

interface DiscoverItem {
	icon: LucideIcon;
	title: string;
	description: string;
}

const DISCOVER_ITEMS: DiscoverItem[] = [
	{
		icon: Fingerprint,
		title: "Your OCEAN Code",
		description: "Your unique 5-letter code — a compass for understanding yourself at a glance.",
	},
	{
		icon: TrendingUp,
		title: "Evidence-Based Scores",
		description: "See exactly what shaped your profile — every score traced back to your own words.",
	},
	{
		icon: Lightbulb,
		title: "Your Archetype",
		description: "A memorable name for your unique personality pattern, discovered in the deep.",
	},
	{
		icon: Share2,
		title: "Shareable Profile",
		description: "Bring your discoveries to the surface — share with friends, teams, or employers.",
	},
];

export function DiscoverSection() {
	return (
		<section data-slot="discover-section" className="mx-auto max-w-4xl px-6 py-16">
			<h2 className="mb-8 text-center text-3xl font-bold text-foreground">What You'll Bring Back</h2>
			<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
				{DISCOVER_ITEMS.map((item) => (
					<div key={item.title} className="rounded-xl border border-border bg-card p-6">
						<div className="mb-3 flex items-center gap-3">
							<item.icon className="h-8 w-8 text-primary" />
							<h3 className="text-xl font-semibold text-foreground">{item.title}</h3>
						</div>
						<p className="text-muted-foreground">{item.description}</p>
					</div>
				))}
			</div>
		</section>
	);
}
