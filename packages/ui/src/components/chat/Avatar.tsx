import type * as React from "react";
import { cn } from "../../lib/utils";

interface AvatarProps {
	src?: string;
	fallback?: React.ReactNode;
	size?: number;
	className?: string;
}

export function Avatar({ src, fallback, size = 32, className }: AvatarProps) {
	return (
		<div
			data-slot="chat-avatar"
			className={cn(
				"shrink-0 rounded-full overflow-hidden flex items-center justify-center bg-muted",
				className,
			)}
			style={{ width: size, height: size }}
		>
			{src ? (
				<img src={src} alt="" className="w-full h-full object-cover" />
			) : (
				fallback
			)}
		</div>
	);
}
