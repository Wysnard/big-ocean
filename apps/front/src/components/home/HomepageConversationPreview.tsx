import { ChatBubble } from "./ChatBubble";
import { getHomepagePhaseConfig } from "./homepage-phase-config";

/**
 * Phase 1 — Conversation excerpt with a clear pattern-observation beat (static copy).
 */
export function HomepageConversationPreview() {
	return (
		<section
			id={getHomepagePhaseConfig("conversation").sectionId}
			data-homepage-phase="conversation"
			className="border-t border-border/60 bg-background px-6 py-16 text-foreground sm:px-8 sm:py-20 lg:px-12 lg:py-24"
		>
			<div className="mx-auto flex max-w-4xl flex-col gap-8">
				<div className="space-y-3">
					<p className="text-xs font-semibold tracking-[0.22em] text-muted-foreground uppercase">
						Conversation
					</p>
					<h2 className="max-w-2xl font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
						Friends know your story. The picture still stays in fragments.
					</h2>
					<p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
						A partner knows the version they need. Therapy has a direction. Books describe categories, not
						you. It&apos;s easy to feel misread by others—and a little by yourself.
					</p>
				</div>
				<div className="relative w-full max-w-[900px] pt-2 pb-1">
					<div
						className="absolute top-0 bottom-0 left-4 z-0 w-[1.5px]"
						style={{ background: "var(--thread-line)" }}
						aria-hidden="true"
					/>
					<ChatBubble variant="nerin">
						<p>I am here for whatever shows up—no performance, no right answers.</p>
					</ChatBubble>
					<ChatBubble variant="user">
						<p>
							I can explain myself to everyone and still feel like nobody quite has the full shape of it.
						</p>
					</ChatBubble>
					<ChatBubble variant="nerin">
						<div className="mb-2 flex flex-wrap items-center gap-2">
							<span className="rounded-full border border-primary/30 bg-background/55 px-2 py-0.5 text-[0.65rem] font-semibold tracking-wide text-foreground uppercase">
								Pattern
							</span>
						</div>
						<p>
							I don&apos;t quiz you. I listen, then name what is already running through your life—how you
							think, how you decide, how you show up with people who matter.
						</p>
					</ChatBubble>
				</div>
			</div>
		</section>
	);
}
