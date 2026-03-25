import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { ChatInputBarShell } from "../chat/ChatInputBarShell";

export function ChatInputBar() {
	return (
		<ChatInputBarShell className="sticky bottom-0 z-[95] py-[14px] max-[900px]:px-3 max-[900px]:py-2">
			<div className="flex gap-[10px] max-[900px]:gap-2">
				{/* Fake input — clicking navigates to chat */}
				<Link
					to="/chat"
					className="flex flex-1 items-center rounded-xl px-5 py-[13px] font-body text-[.9rem] transition-[background,border-color,color] duration-[350ms] max-[900px]:py-[9px] max-[900px]:px-3 max-[900px]:text-[.85rem]"
					style={{
						background: "var(--input-field-bg)",
						border: "1px solid var(--input-field-border)",
						color: "var(--input-field-color)",
					}}
				>
					Type your first message to Nerin...
				</Link>

				{/* CTA button — links to chat */}
				<Link
					to="/chat"
					className="inline-flex min-h-[44px] items-center justify-center whitespace-nowrap rounded-xl bg-gradient-to-r from-primary to-secondary px-[26px] py-[13px] font-heading text-[.9rem] font-semibold text-white transition-[transform,box-shadow] duration-200 hover:translate-y-[-1px] hover:shadow-[0_4px_16px_rgba(255,0,128,.3)] max-[900px]:px-3 max-[900px]:py-[9px]"
					aria-label="Start the conversation"
				>
					<span className="max-[900px]:hidden">Start the conversation &rarr;</span>
					<ArrowRight className="hidden size-5 max-[900px]:block" />
				</Link>
			</div>
			{/* Subtle context text */}
			<p className="mt-1 text-center text-xs text-muted-foreground">
				25 min &middot; Free &middot; Private
			</p>
		</ChatInputBarShell>
	);
}
