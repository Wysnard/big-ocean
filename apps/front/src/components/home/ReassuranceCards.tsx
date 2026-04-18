import { ArtifactSurfaceCard } from "@workspace/ui/components/artifact-surface-card";
import { motion, useReducedMotion } from "motion/react";

const REASSURANCE_CARDS = [
	{
		eyebrow: "Process anxiety",
		title: "It's a conversation, not a quiz",
		body: "You are not being scored in real time. You are being met.",
		evidenceLabel: "Conversation preview",
		evidenceContent:
			"No quiz energy here. Just tell me where your mind goes when the room finally gets quiet.",
		accentClassName: "border-primary/30 bg-primary/10",
		quoteClassName: "border-primary/55",
	},
	{
		eyebrow: "Time commitment",
		title: "30 minutes that surprise you",
		body: "The pace is slow enough to breathe in and fast enough to keep its shape.",
		evidenceLabel: "What people say",
		evidenceContent: '"By minute seven, I forgot I was supposed to be good at this."',
		accentClassName: "border-secondary/30 bg-secondary/10",
		quoteClassName: "border-secondary/55",
	},
	{
		eyebrow: "Self-exposure",
		title: "Everything Nerin writes comes from a place of understanding",
		body:
			"The point is recognition, not diagnosis. The voice stays close to what is human and already true.",
		evidenceLabel: "Portrait tone example",
		evidenceContent: "Nothing in you is too much for the page. The gentleness is part of the seeing.",
		accentClassName: "border-tertiary/30 bg-tertiary/10",
		quoteClassName: "border-tertiary/55",
	},
] as const;

export function ReassuranceCards() {
	const reduceMotion = useReducedMotion();
	const prefersReducedMotion = reduceMotion === true;

	return (
		<div className="grid gap-5 lg:grid-cols-3">
			{REASSURANCE_CARDS.map((card, index) => (
				<motion.div
					key={card.title}
					data-testid="homepage-reassurance-card"
					initial={{ opacity: 0 }}
					whileInView={{ opacity: 1 }}
					viewport={{ once: true, amount: 0.3 }}
					transition={{
						duration: prefersReducedMotion ? 0 : 0.3,
						delay: prefersReducedMotion ? 0 : index * 0.1,
						ease: "easeOut",
					}}
				>
					<ArtifactSurfaceCard
						as="article"
						className={`flex h-full flex-col gap-5 rounded-lg p-6 text-left shadow-[0_20px_45px_rgba(26,26,46,0.08)] dark:shadow-[0_20px_45px_rgba(0,0,0,0.35)] ${card.accentClassName}`}
					>
						<div className="space-y-3">
							<p className="text-xs font-semibold tracking-[0.22em] text-muted-foreground uppercase">
								{card.eyebrow}
							</p>
							<h3 className="text-xl font-semibold tracking-tight text-foreground">{card.title}</h3>
							<p className="text-sm leading-6 text-muted-foreground">{card.body}</p>
						</div>

						<div className="space-y-2">
							<p className="text-[0.7rem] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
								{card.evidenceLabel}
							</p>
							<blockquote
								className={`border-l-2 py-1 pl-4 text-sm leading-6 text-foreground ${card.quoteClassName}`}
							>
								{card.evidenceContent}
							</blockquote>
						</div>
					</ArtifactSurfaceCard>
				</motion.div>
			))}
		</div>
	);
}
