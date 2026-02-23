import { cn } from "@workspace/ui/lib/utils";
import type * as React from "react";

interface ChatInputBarShellProps {
	children: React.ReactNode;
	className?: string;
	style?: React.CSSProperties;
	"aria-hidden"?: boolean;
}

/**
 * Shared visual shell for input bars — provides consistent backdrop, border,
 * and max-width container across the homepage CTA bar and the chat input bar.
 *
 * Consumers add their own positioning (fixed/relative), padding, and content.
 */
export function ChatInputBarShell({
	children,
	className,
	style,
	...props
}: ChatInputBarShellProps) {
	return (
		<div
			data-slot="chat-input-bar"
			className={cn(
				"border-t border-[var(--input-bar-border)] bg-[var(--input-bar-bg)] backdrop-blur-[14px] px-6",
				className,
			)}
			style={style}
			{...props}
		>
			<div className="mx-auto max-w-[900px] min-[1200px]:max-w-[1000px] min-[1440px]:max-w-[1100px]">
				{children}
			</div>
		</div>
	);
}
