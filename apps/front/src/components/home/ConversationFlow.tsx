import type * as React from "react";

export function ConversationFlow({ children }: { children: React.ReactNode }) {
	return (
		<div
			data-slot="conversation-flow"
			className="relative mx-auto max-w-[900px] px-6 pb-[140px] pt-10 min-[1200px]:max-w-[1000px] min-[1440px]:max-w-[1100px]"
		>
			{/* Vertical thread line */}
			<div
				className="absolute left-[29px] top-0 bottom-[80px] z-0 w-[1.5px] transition-[background] duration-[350ms]"
				style={{ background: "var(--thread-line)" }}
				aria-hidden="true"
			/>
			{children}
		</div>
	);
}
