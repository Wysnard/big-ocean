"use client";

/**
 * ConversationTranscript Component (Story 12.2)
 *
 * Scrollable panel showing messages from the assessment conversation.
 * Supports auto-scroll to a target message with highlight animation.
 */

import { cn } from "@workspace/ui/lib/utils";
import { useEffect, useRef } from "react";
import type { HighlightRange } from "./EvidencePanel";
import { HighlightedText } from "./HighlightedText";

interface TranscriptMessage {
	id: string;
	role: "user" | "assistant";
	content: string;
	timestamp: string;
}

interface ActiveHighlight {
	messageId: string;
	range: HighlightRange;
	color: string;
	confidence: number;
}

interface ConversationTranscriptProps {
	messages: TranscriptMessage[];
	scrollToMessageId: string | null;
	activeHighlight: ActiveHighlight | null;
	onScrollComplete?: () => void;
}

export function ConversationTranscript({
	messages,
	scrollToMessageId,
	activeHighlight,
	onScrollComplete,
}: ConversationTranscriptProps) {
	const scrollRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!scrollToMessageId || !scrollRef.current) return;

		const target = scrollRef.current.querySelector(`[data-message-id="${scrollToMessageId}"]`);
		if (target) {
			target.scrollIntoView({ behavior: "smooth", block: "center" });
			// Flash animation
			target.classList.add("animate-pulse-highlight");
			const timer = setTimeout(() => {
				target.classList.remove("animate-pulse-highlight");
				onScrollComplete?.();
			}, 1500);
			return () => clearTimeout(timer);
		}
	}, [scrollToMessageId, onScrollComplete]);

	return (
		<div
			ref={scrollRef}
			data-testid="conversation-transcript"
			className="flex flex-col gap-3 overflow-y-auto p-4"
		>
			{messages.map((msg) => {
				const isHighlightTarget = activeHighlight && activeHighlight.messageId === msg.id;
				const highlights = isHighlightTarget
					? [
							{
								start: activeHighlight.range.start,
								end: activeHighlight.range.end,
								color: activeHighlight.color,
								confidence: activeHighlight.confidence,
							},
						]
					: [];

				return (
					<div
						key={msg.id}
						data-message-id={msg.id}
						data-testid="transcript-message"
						className={cn(
							"rounded-lg px-4 py-3 text-sm max-w-[85%] motion-safe:transition-colors",
							msg.role === "user"
								? "self-end bg-primary/10 text-foreground"
								: "self-start bg-muted text-foreground",
							scrollToMessageId === msg.id && "ring-2 ring-primary/50",
						)}
					>
						<p className="text-xs text-muted-foreground mb-1 font-medium">
							{msg.role === "user" ? "You" : "Nerin"}
						</p>
						{highlights.length > 0 ? (
							<HighlightedText text={msg.content} highlights={highlights} />
						) : (
							<span>{msg.content}</span>
						)}
					</div>
				);
			})}
		</div>
	);
}
