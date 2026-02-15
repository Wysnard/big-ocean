import type * as React from "react";
import { cn } from "../../lib/utils";

interface MessageBubbleProps {
	variant: "sender" | "receiver";
	children: React.ReactNode;
	className?: string;
}

export function MessageBubble({ variant, children, className }: MessageBubbleProps) {
	return (
		<div
			data-slot="chat-bubble"
			className={cn(
				"max-w-[90%] lg:max-w-md px-4 py-3",
				variant === "sender"
					? "rounded-2xl rounded-br-sm"
					: "rounded-2xl rounded-bl-sm",
				className,
			)}
		>
			{children}
		</div>
	);
}
