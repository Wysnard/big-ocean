import { Link } from "@tanstack/react-router";
import { OceanHieroglyphSet } from "@workspace/ui/components/ocean-hieroglyph-set";

export function Logo() {
	return (
		<Link to="/" data-slot="header-logo" className="flex items-center gap-1">
			<span className="text-xl font-heading font-bold tracking-tight text-foreground">big-</span>
			<OceanHieroglyphSet size={20} />
		</Link>
	);
}
