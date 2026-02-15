import type * as React from "react";
import { cn } from "../../lib/utils";

interface MessageProps {
	role: "user" | "assistant";
	children: React.ReactNode;
	avatar?: React.ReactNode;
	timestamp?: React.ReactNode;
	className?: string;
}

export function Message({ role, children, avatar, timestamp, className }: MessageProps) {
	return (
		<div
			data-slot="chat-message"
			className={cn(
				"flex",
				role === "user" ? "justify-end" : "items-end gap-2 justify-start",
				className,
			)}
		>
			{role === "assistant" && avatar}
			<div className="flex flex-col">
				{children}
				{timestamp}
			</div>
		</div>
	);
}
