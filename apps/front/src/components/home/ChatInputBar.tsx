import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useDepthScroll } from "./DepthScrollProvider";

export function ChatInputBar() {
	const { scrollPercent } = useDepthScroll();
	const visible = scrollPercent > 0.35;

	return (
		<div
			data-slot="chat-input-bar"
			className="fixed right-0 bottom-0 left-0 z-[95] px-6 py-[14px] backdrop-blur-[14px] transition-[transform,background,border-color] duration-500 [transition-timing-function:cubic-bezier(.16,1,.3,1)] max-[900px]:px-3 max-[900px]:py-2"
			style={{
				transform: visible ? "translateY(0)" : "translateY(100%)",
				background: "var(--input-bar-bg)",
				borderTop: "1px solid var(--input-bar-border)",
			}}
			aria-hidden={!visible}
		>
			{/* Inner wrapper — matches ConversationFlow max-widths */}
			<div className="mx-auto flex max-w-[900px] gap-[10px] min-[1200px]:max-w-[1000px] min-[1440px]:max-w-[1100px] max-[900px]:gap-2">
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
					className="inline-flex items-center justify-center whitespace-nowrap rounded-xl bg-gradient-to-r from-primary to-secondary px-[26px] py-[13px] font-heading text-[.9rem] font-semibold text-white transition-[transform,box-shadow] duration-200 hover:translate-y-[-1px] hover:shadow-[0_4px_16px_rgba(255,0,128,.3)] max-[900px]:px-3 max-[900px]:py-[9px]"
					aria-label="Start Conversation"
				>
					<span className="max-[900px]:hidden">Start Conversation &rarr;</span>
					<ArrowRight className="hidden size-5 max-[900px]:block" />
				</Link>
			</div>
		</div>
	);
}
