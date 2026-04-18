import { OceanHieroglyphSet } from "@workspace/ui/components/ocean-hieroglyph-set";
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
			className="homepage-conversation-surface min-h-[92svh] px-6 py-12 text-foreground sm:px-8 lg:min-h-screen lg:px-12 lg:py-16"
		>
			<div className="mx-auto flex h-full max-w-4xl flex-col justify-center gap-8">
				<div className="space-y-3">
					<div className="flex items-center gap-3">
						<OceanHieroglyphSet size={14} />
						<p className="text-xs font-semibold tracking-[0.22em] text-muted-foreground uppercase">
							Conversation
						</p>
					</div>
					<h2 className="max-w-2xl text-4xl font-semibold tracking-tight text-foreground">
						Recognition starts before anything is explained.
					</h2>
				</div>
				<div className="relative w-full max-w-[900px] pt-2 pb-1">
					<div
						className="absolute top-0 bottom-0 left-4 z-0 w-[1.5px]"
						style={{ background: "var(--thread-line)" }}
						aria-hidden="true"
					/>
					<ChatBubble variant="nerin">
						<p>I am here for whatever shows up — no performance, no right answers.</p>
					</ChatBubble>
					<ChatBubble variant="user">
						<p>I keep circling the same thing. Work, sleep, then the same worry on repeat.</p>
					</ChatBubble>
					<ChatBubble variant="nerin">
						<div className="mb-2 flex flex-wrap items-center gap-2">
							<span className="rounded-full border border-primary/30 bg-background/55 px-2 py-0.5 text-[0.65rem] font-semibold tracking-wide text-foreground uppercase">
								Pattern
							</span>
						</div>
						<p>
							You described restlessness at work and again before bed — same texture, different scenes.
							That repetition is not noise; it is the thread I am pulling gently on.
						</p>
					</ChatBubble>
				</div>
				{/* In-section bleed (AC5): keeps entire block inside `data-homepage-phase` for DepthScrollProvider */}
				<div
					aria-hidden
					data-testid="homepage-timeline-bleed-conversation-to-portrait"
					className="homepage-bleed-conversation-to-portrait -mx-6 mt-12 h-20 shrink-0 sm:-mx-8 lg:-mx-12"
				/>
			</div>
		</section>
	);
}
