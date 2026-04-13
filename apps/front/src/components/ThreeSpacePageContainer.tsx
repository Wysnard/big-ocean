import { cn } from "@workspace/ui/lib/utils";
import type { ComponentPropsWithoutRef } from "react";

export function ThreeSpacePageContainer({ className, ...props }: ComponentPropsWithoutRef<"div">) {
	return (
		<div className={cn("mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8", className)} {...props} />
	);
}
