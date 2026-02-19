import { NerinMessage } from "@workspace/ui/components/chat";
import type * as React from "react";

interface ChatBubbleProps {
	variant: "nerin" | "user" | "vincent";
	children: React.ReactNode;
}

export function ChatBubble({ variant, children }: ChatBubbleProps) {
	if (variant === "nerin") {
		return <NerinMessage className="relative z-[1] mb-3">{children}</NerinMessage>;
	}

	if (variant === "vincent") {
		return (
			<div data-slot="chat-bubble" className="relative z-[1] mb-3 flex gap-[11px]">
				{/* Vincent avatar — double-ring, theme-aware gradient */}
				<div className="flex shrink-0 flex-col items-center gap-1">
					<div
						className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-b from-amber-400 to-[var(--vincent-bubble-to)] font-heading text-[.78rem] font-bold text-white"
						style={{
							boxShadow: "0 0 0 2px var(--card), 0 0 0 3.5px var(--vincent-ring)",
						}}
						aria-hidden="true"
					>
						V
					</div>
					<span className="text-[.62rem] font-medium text-amber-500">Founder</span>
				</div>
				<div className="max-w-[88%] min-[1200px]:max-w-[92%]">
					<span className="mb-1 block text-[.7rem] font-medium text-muted-foreground">Vincent</span>
					{/* Bubble — theme-aware gradient (Amber Reef light / Amber Depth dark) */}
					<div className="rounded-[18px] rounded-tl-[5px] bg-gradient-to-br from-[var(--vincent-bubble-from)] to-[var(--vincent-bubble-to)] px-[22px] py-4 text-[.92rem] leading-[1.65] text-white transition-[background,color] duration-[350ms]">
						{children}
					</div>
				</div>
			</div>
		);
	}

	return (
		<div data-slot="chat-bubble" className="relative z-[1] mb-3 flex flex-row-reverse gap-[11px]">
			{/* User avatar */}
			<div
				className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--user-avatar-from)] to-[var(--user-avatar-to)] font-heading text-[.75rem] font-bold text-[var(--user-avatar-fg)] transition-[background,color] duration-[350ms]"
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
