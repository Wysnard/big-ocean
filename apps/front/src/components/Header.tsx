import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { MobileNav } from "./MobileNav";
import { ThemeToggle } from "./ThemeToggle";
import { UserNav } from "./UserNav";

export default function Header() {
	return (
		<header
			data-slot="header"
			className="sticky top-0 z-50 h-14 border-b border-border bg-background"
		>
			<div className="flex h-full items-center px-4">
				<Logo />

				<nav aria-label="Site" className="ml-6 hidden items-center gap-4 md:flex">
					<Link
						to="/library"
						data-testid="header-library-link"
						className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
					>
						Library
					</Link>
				</nav>

				<div className="ml-auto hidden items-center gap-2 md:flex">
					<ThemeToggle />
				</div>

				{/* Desktop nav */}
				<nav data-slot="header-nav" aria-label="Account" className="hidden items-center gap-2 md:flex">
					<UserNav />
				</nav>

				{/* Mobile nav */}
				<div className="ml-auto flex items-center md:hidden">
					<MobileNav />
				</div>
			</div>
		</header>
	);
}
