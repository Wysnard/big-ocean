import { Logo } from "./Logo";
import { MobileNav } from "./MobileNav";
import { ThemeToggle } from "./ThemeToggle";
import { UserNav } from "./UserNav";

export default function Header() {
	return (
		<header
			data-slot="header"
			className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
		>
			<div className="flex h-14 items-center px-4">
				<Logo />

				{/* Desktop nav */}
				<div data-slot="header-nav" className="ml-auto hidden items-center gap-2 md:flex">
					<ThemeToggle />
					<UserNav />
				</div>

				{/* Mobile nav */}
				<div className="ml-auto flex items-center md:hidden">
					<MobileNav />
				</div>
			</div>
		</header>
	);
}
