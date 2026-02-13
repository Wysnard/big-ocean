import { Link } from "@tanstack/react-router";
import { OceanShapeSet } from "./ocean-shapes/OceanShapeSet";

export function Logo() {
	return (
		<Link to="/" data-slot="header-logo" className="flex items-center gap-1">
			<span className="text-xl font-heading font-bold text-foreground">big-</span>
			<OceanShapeSet size={20} />
		</Link>
	);
}
