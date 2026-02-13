import { ChevronDown } from "lucide-react";

export function ScrollIndicator() {
	return (
		<div data-slot="scroll-indicator" className="mt-12 flex flex-col items-center gap-1">
			<span className="text-xs font-medium tracking-wider uppercase text-muted-foreground">
				Go deeper
			</span>
			<ChevronDown className="h-8 w-8 text-muted-foreground motion-safe:animate-bounce" />
		</div>
	);
}
