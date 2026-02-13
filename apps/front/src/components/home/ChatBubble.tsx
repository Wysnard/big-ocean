import { cn } from "@workspace/ui/lib/utils";

interface ChatBubbleProps {
	message: string;
	variant: "ai" | "user";
}

export function ChatBubble({ message, variant }: ChatBubbleProps) {
	return (
		<div
			data-slot="chat-bubble"
			className={cn(
				"max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
				variant === "ai" && "self-start bg-muted text-foreground",
				variant === "user" && "self-end bg-primary text-primary-foreground",
			)}
		>
			{message}
		</div>
	);
}
