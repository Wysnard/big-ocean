import type { LucideIcon } from "lucide-react";
import { Layers, MessageCircle, Sparkles } from "lucide-react";
import { useEffect, useRef } from "react";

interface ValueProp {
	icon: LucideIcon;
	title: string;
	description: string;
}

const VALUE_PROPS: ValueProp[] = [
	{
		icon: MessageCircle,
		title: "Deep Conversation, Not Surface Questions",
		description:
			"Nerin dives into what makes you tick through natural dialogue — no multiple choice, no forced answers.",
	},
	{
		icon: Layers,
		title: "30 Facets Deep",
		description: "While others skim the surface with 5 traits, we explore 30 facets of who you are.",
	},
	{
		icon: Sparkles,
		title: "An AI That Dives With You",
		description:
			"Nerin adapts to your responses in real-time, exploring deeper where it matters most.",
	},
];

function useFadeInOnScroll(ref: React.RefObject<HTMLElement | null>) {
	useEffect(() => {
		const el = ref.current;
		if (!el) return;
		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					el.classList.add("opacity-100", "translate-y-0");
					el.classList.remove("opacity-0", "translate-y-6");
					observer.unobserve(el);
				}
			},
			{ threshold: 0.1 },
		);
		observer.observe(el);
		return () => observer.disconnect();
	}, [ref]);
}

export function ValuePropsSection() {
	const sectionRef = useRef<HTMLElement>(null);
	useFadeInOnScroll(sectionRef);

	return (
		<section
			ref={sectionRef}
			data-slot="value-props-section"
			className="mx-auto max-w-5xl px-6 py-16 opacity-0 translate-y-6 transition-all duration-700"
		>
			<div className="grid grid-cols-1 gap-6 md:grid-cols-3">
				{VALUE_PROPS.map((prop) => (
					<div
						key={prop.title}
						className="rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/50"
					>
						<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
							<prop.icon className="h-6 w-6 text-primary" />
						</div>
						<h3 className="mb-2 text-lg font-semibold text-foreground">{prop.title}</h3>
						<p className="text-sm leading-relaxed text-muted-foreground">{prop.description}</p>
					</div>
				))}
			</div>
		</section>
	);
}
