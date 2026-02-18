import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar";
import type * as React from "react";

interface NerinMessageProps {
	children: React.ReactNode;
	className?: string;
	messageId?: string;
}

/** Shared Nerin message layout — avatar at top-left with styled bubble. */
export function NerinMessage({ children, className, messageId }: NerinMessageProps) {
	return (
		<div data-slot="chat-bubble" data-message-id={messageId} className={className}>
			<div className="flex flex-row gap-[11px]">
				{/* Nerin avatar */}
				<Avatar className="bg-gradient-to-br from-tertiary to-primary" aria-hidden="true">
					<AvatarFallback className="bg-gradient-to-br from-tertiary to-primary font-heading text-[.75rem] font-bold text-white">
						N
					</AvatarFallback>
				</Avatar>
				{/* Bubble — editorial prose styling via child selectors */}
				<div className="nerin-prose max-w-[88%] rounded-[18px] rounded-bl-[5px] border border-[var(--bubble-border)] bg-[var(--bubble-bg)] px-[22px] py-4 text-[.92rem] leading-[1.65] text-[var(--bubble-fg)] transition-[background,border-color,color] duration-[350ms] min-[1200px]:max-w-[92%]">
					{children}
				</div>
			</div>
		</div>
	);
}
