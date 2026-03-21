import { MessageCircle, Sparkles, Users } from "lucide-react";

const steps = [
	{
		icon: MessageCircle,
		title: "Talk to Nerin",
		description: "A 25-minute conversation about you. No quiz, no checkboxes.",
	},
	{
		icon: Sparkles,
		title: "Get your portrait",
		description: "Your archetype, OCEAN code, and a personal letter from Nerin.",
	},
	{
		icon: Users,
		title: "Compare with someone who matters",
		description: "Scan QR codes together for a relationship analysis.",
	},
];

export function ProfileHowItWorks() {
	return (
		<section
			data-slot="profile-how-it-works"
			data-testid="profile-how-it-works"
			className="mx-auto max-w-[900px] px-6 py-12"
		>
			<h2 className="mb-8 text-center font-heading text-[clamp(1.5rem,3vw,2rem)] font-bold text-foreground sm:mb-12">
				How It Works
			</h2>

			<div className="grid gap-8 sm:grid-cols-3 sm:gap-6">
				{steps.map((step, index) => (
					<div key={step.title} className="flex flex-col items-center text-center">
						<div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
							<step.icon className="h-7 w-7 text-primary" aria-hidden="true" />
						</div>
						<div className="mb-1 font-mono text-[.7rem] tracking-[.08em] text-muted-foreground">
							STEP {index + 1}
						</div>
						<h3 className="mb-2 font-heading text-lg font-semibold text-foreground">{step.title}</h3>
						<p className="max-w-[280px] text-[.92rem] leading-relaxed text-muted-foreground">
							{step.description}
						</p>
					</div>
				))}
			</div>
		</section>
	);
}
