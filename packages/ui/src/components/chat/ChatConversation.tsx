import type * as React from "react";
import { useCallback, useEffect, useRef } from "react";
import { cn } from "../../lib/utils";

interface ChatConversationProps<T> {
	messages: T[];
	renderMessage: (message: T, index: number) => React.ReactNode;
	renderAvatar?: (message: T) => React.ReactNode;
	autoScroll?: boolean;
	typingIndicator?: React.ReactNode;
	className?: string;
}

export function ChatConversation<T>({
	messages,
	renderMessage,
	autoScroll = true,
	typingIndicator,
	className,
}: ChatConversationProps<T>) {
	const endRef = useRef<HTMLDivElement>(null);

	const scrollToBottom = useCallback(() => {
		endRef.current?.scrollIntoView({ behavior: "smooth" });
	}, []);

	const messageCount = messages.length;
	// biome-ignore lint/correctness/useExhaustiveDependencies: messageCount triggers scroll on new messages
	useEffect(() => {
		if (autoScroll) {
			scrollToBottom();
		}
	}, [messageCount, autoScroll, scrollToBottom]);

	return (
		<div
			data-slot="chat-conversation"
			className={cn("flex-1 overflow-y-auto space-y-4", className)}
		>
			{messages.map((message, index) => renderMessage(message, index))}
			{typingIndicator}
			<div ref={endRef} />
		</div>
	);
}
