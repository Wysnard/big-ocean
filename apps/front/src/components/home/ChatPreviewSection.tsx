import { Link } from "@tanstack/react-router";
import { buttonVariants } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";
import { NerinAvatar } from "../NerinAvatar";
import { ChatBubble } from "./ChatBubble";

const CHAT_MESSAGES: { message: string; variant: "ai" | "user" }[] = [
	{
		message:
			"Welcome to your deep dive. I'm Nerin, and I'll be exploring alongside you. There's no right or wrong here — just depth. Ready to see what we discover?",
		variant: "ai",
	},
	{
		message:
			"Let's start at the surface. When you walk into a room full of strangers, what's the first thing you notice?",
		variant: "ai",
	},
	{
		message: "I usually look for someone I know, or find a quiet corner to observe from...",
		variant: "user",
	},
	{
		message:
			"Interesting — you're taking it all in before diving in. That tells me something. What happens once you've observed for a while?",
		variant: "ai",
	},
];

export function ChatPreviewSection() {
	return (
		<section data-slot="chat-preview-section" className="mx-auto max-w-3xl px-6 py-16">
			<h2 className="mb-2 text-center text-3xl font-bold text-foreground">Meet Your Dive Companion</h2>
			<p className="mb-8 text-center text-muted-foreground">AI Deep Dive Companion</p>

			<div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xl motion-safe:animate-[float_6s_ease-in-out_infinite]">
				{/* Chat header */}
				<div className="flex items-center gap-3 border-b border-border px-5 py-4">
					<NerinAvatar size={40} />
					<div>
						<p className="font-semibold text-foreground">Nerin</p>
						<p className="text-xs text-muted-foreground">AI Deep Dive Companion</p>
					</div>
				</div>

				{/* Messages */}
				<div className="flex flex-col gap-3 px-5 py-5">
					{CHAT_MESSAGES.map((msg) => (
						<ChatBubble key={msg.message} message={msg.message} variant={msg.variant} />
					))}
				</div>

				{/* Disabled input */}
				<div className="border-t border-border px-5 py-4">
					<div className="rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
						Try typing a response...
					</div>
				</div>
			</div>

			<p className="mt-6 text-center text-lg font-medium italic text-muted-foreground">
				"This isn't a quiz. It's an expedition."
			</p>

			<div className="mt-6 flex justify-center">
				<Link to="/chat" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "min-h-11")}>
					Start your deep dive
				</Link>
			</div>
		</section>
	);
}
