import { Link } from "@tanstack/react-router";

export function Logo() {
	return (
		<Link to="/" data-slot="header-logo" className="flex items-center">
			<span className="text-xl font-bold bg-[image:var(--gradient-celebration)] bg-clip-text text-transparent">
				Big Ocean
			</span>
		</Link>
	);
}
