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
		accentClassName:
			"border-sky-200/80 bg-[linear-gradient(180deg,rgba(248,250,252,0.96)_0%,rgba(239,246,255,0.98)_100%)] dark:border-sky-500/25 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.96)_0%,rgba(8,47,73,0.58)_100%)]",
	},
	{
		eyebrow: "Time commitment",
		title: "30 minutes that surprise you",
		body: "The pace is slow enough to breathe in and fast enough to keep its shape.",
		evidenceLabel: "What people say",
		evidenceContent: '"By minute seven, I forgot I was supposed to be good at this."',
		accentClassName:
			"border-amber-200/80 bg-[linear-gradient(180deg,rgba(255,251,235,0.98)_0%,rgba(255,255,255,0.98)_100%)] dark:border-amber-500/25 dark:bg-[linear-gradient(180deg,rgba(41,37,20,0.94)_0%,rgba(15,23,42,0.96)_100%)]",
	},
	{
		eyebrow: "Self-exposure",
		title: "Everything Nerin writes comes from a place of understanding",
		body:
			"The point is recognition, not diagnosis. The voice stays close to what is human and already true.",
		evidenceLabel: "Portrait tone example",
		evidenceContent: "Nothing in you is too much for the page. The gentleness is part of the seeing.",
		accentClassName:
			"border-rose-200/80 bg-[linear-gradient(180deg,rgba(255,241,242,0.98)_0%,rgba(255,255,255,0.98)_100%)] dark:border-rose-500/25 dark:bg-[linear-gradient(180deg,rgba(76,5,25,0.5)_0%,rgba(15,23,42,0.96)_100%)]",
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
						className={`flex h-full flex-col gap-5 rounded-[1.75rem] p-6 text-left shadow-[0_20px_45px_rgba(15,23,42,0.08)] dark:shadow-[0_20px_45px_rgba(2,6,23,0.45)] ${card.accentClassName}`}
					>
						<div className="space-y-3">
							<p className="text-xs font-semibold tracking-[0.22em] text-slate-500 uppercase dark:text-slate-300">
								{card.eyebrow}
							</p>
							<h3 className="text-xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">
								{card.title}
							</h3>
							<p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{card.body}</p>
						</div>

						<div className="space-y-2">
							<p className="text-[0.7rem] font-semibold tracking-[0.18em] text-slate-500 uppercase dark:text-slate-400">
								{card.evidenceLabel}
							</p>
							<div className="rounded-[1.25rem] border border-white/70 bg-white/75 p-4 text-sm leading-6 text-slate-700 shadow-sm dark:border-white/10 dark:bg-slate-950/40 dark:text-slate-200">
								{card.evidenceContent}
							</div>
						</div>
					</ArtifactSurfaceCard>
				</motion.div>
			))}
		</div>
	);
}
