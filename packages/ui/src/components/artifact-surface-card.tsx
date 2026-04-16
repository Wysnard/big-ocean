import { cn } from "@workspace/ui/lib/utils";
import * as React from "react";

type ArtifactSurfaceTag = "div" | "article" | "section";

export type ArtifactSurfaceCardProps = {
	as?: ArtifactSurfaceTag;
} & Omit<React.HTMLAttributes<HTMLElement>, "as">;

const baseClass =
	"relative overflow-hidden rounded-[1.75rem] border border-border/70 shadow-[0_18px_50px_rgba(15,23,42,0.08)] dark:border-border/50 dark:shadow-[0_18px_50px_rgba(0,0,0,0.45)]";

/**
 * Shared outer frame for marketing previews and lightweight “artifact” surfaces
 * (letters, device mockups, carousel tiles). Consumers override border, shadow,
 * radius, and background via `className`.
 */
export function ArtifactSurfaceCard({
	as = "div",
	className,
	children,
	...rest
}: ArtifactSurfaceCardProps) {
	return React.createElement(
		as,
		{
			"data-slot": "artifact-surface-card",
			className: cn(baseClass, className),
			...rest,
		},
		children,
	);
}
