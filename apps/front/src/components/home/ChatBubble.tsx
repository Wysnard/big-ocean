import type * as React from "react";
import { NerinMessage } from "@workspace/ui/components/chat";

interface ChatBubbleProps {
	variant: "nerin" | "user";
	children: React.ReactNode;
}

export function ChatBubble({ variant, children }: ChatBubbleProps) {
	if (variant === "nerin") {
		return (
			<NerinMessage className="relative z-[1] mb-3">
				{children}
			</NerinMessage>
		);
	}

	return (
		<div data-slot="chat-bubble" className="relative z-[1] mb-3 flex flex-row-reverse gap-[11px]">
			{/* User avatar */}
			<div
				className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--user-avatar-bg)] font-heading text-[.75rem] font-bold text-[var(--user-avatar-fg)] transition-[background,color] duration-[350ms]"
				aria-hidden="true"
			>
				Y
			</div>
			{/* Bubble */}
			<div className="max-w-[88%] rounded-[18px] rounded-br-[5px] bg-gradient-to-br from-primary to-secondary px-[22px] py-4 text-[.92rem] leading-[1.65] text-white min-[1200px]:max-w-[92%]">
				{children}
			</div>
		</div>
	);
}
