import { Link, useRouter } from "@tanstack/react-router";
import { Button } from "@workspace/ui/components/button";
import {
	Sheet,
	SheetClose,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@workspace/ui/components/sheet";
import { type UserTheme, useTheme } from "@workspace/ui/hooks/use-theme";
import { Home, LayoutDashboard, LogOut, Menu, Monitor, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../hooks/use-auth";
import { OceanShapeSet } from "./ocean-shapes/OceanShapeSet";

export function MobileNav() {
	const [open, setOpen] = useState(false);
	const [isSigningOut, setIsSigningOut] = useState(false);
	const [signOutError, setSignOutError] = useState<string | null>(null);
	const { user, isAuthenticated, signOut } = useAuth();
	const { setTheme, userTheme } = useTheme();
	const router = useRouter();

	// Close sheet on navigation
	useEffect(() => {
		const unsub = router.subscribe("onBeforeNavigate", () => {
			setOpen(false);
		});
		return unsub;
	}, [router]);

	const themeOrder: UserTheme[] = ["system", "light", "dark"];
	const themeLabels: Record<UserTheme, string> = {
		light: "Light",
		dark: "Dark",
		system: "Auto",
	};

	const cycleTheme = () => {
		const currentIndex = themeOrder.indexOf(userTheme);
		const nextIndex = (currentIndex + 1) % themeOrder.length;
		setTheme(themeOrder[nextIndex]);
	};

	const handleSignOut = async () => {
		setSignOutError(null);
		setIsSigningOut(true);
		try {
			await signOut();
			setOpen(false);
		} catch {
			setSignOutError("Unable to sign out. Please try again.");
		} finally {
			setIsSigningOut(false);
		}
	};

	return (
		<Sheet open={open} onOpenChange={setOpen}>
			<SheetTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					data-slot="mobile-nav-trigger"
					aria-label="Open menu"
					className="min-h-11 min-w-11"
				>
					<Menu className="size-5" />
				</Button>
			</SheetTrigger>
			<SheetContent data-slot="mobile-nav" side="right" showCloseButton>
				<SheetHeader>
					<SheetTitle>
						<span className="flex items-center gap-1">
							<span className="text-xl font-heading font-bold tracking-tight text-foreground">big-</span>
							<OceanShapeSet size={20} />
						</span>
					</SheetTitle>
				</SheetHeader>

				<nav className="flex flex-col gap-1 px-4">
					<SheetClose asChild>
						<Link
							to="/"
							className="flex items-center gap-3 rounded-md px-3 py-2 min-h-11 text-sm font-medium text-foreground hover:bg-accent"
						>
							<Home className="size-4" />
							Home
						</Link>
					</SheetClose>

					{isAuthenticated && (
						<SheetClose asChild>
							<Link
								to="/dashboard"
								className="flex items-center gap-3 rounded-md px-3 py-2 min-h-11 text-sm font-medium text-foreground hover:bg-accent"
							>
								<LayoutDashboard className="size-4" />
								Dashboard
							</Link>
						</SheetClose>
					)}
				</nav>

				<div className="border-t border-border mx-4" />

				<div className="px-4">
					<button
						type="button"
						onClick={cycleTheme}
						className="flex w-full items-center gap-3 rounded-md px-3 py-2 min-h-11 text-sm font-medium text-foreground hover:bg-accent"
					>
						{userTheme === "light" && <Sun className="size-4" />}
						{userTheme === "dark" && <Moon className="size-4" />}
						{userTheme === "system" && <Monitor className="size-4" />}
						Theme: {themeLabels[userTheme]}
					</button>
				</div>

				<div className="border-t border-border mx-4" />

				<div className="px-4">
					{!isAuthenticated ? (
						<div className="flex flex-col gap-2">
							<SheetClose asChild>
								<Button variant="ghost" className="w-full justify-start min-h-11" asChild>
									<Link to="/login">Sign In</Link>
								</Button>
							</SheetClose>
							<SheetClose asChild>
								<Button className="w-full min-h-11" asChild>
									<Link to="/signup">Sign Up</Link>
								</Button>
							</SheetClose>
						</div>
					) : (
						<div className="flex flex-col gap-2">
							<div className="px-3 py-2">
								<p className="text-sm font-medium text-foreground">{user?.name || "User"}</p>
								<p className="text-xs text-muted-foreground">{user?.email}</p>
							</div>
							<Button
								variant="ghost"
								className="w-full justify-start min-h-11 text-destructive hover:text-destructive"
								onClick={handleSignOut}
								disabled={isSigningOut}
							>
								<LogOut className="size-4 mr-2" />
								{isSigningOut ? "Signing out..." : "Sign Out"}
							</Button>
							{signOutError ? (
								<p className="px-3 text-xs font-medium text-destructive">{signOutError}</p>
							) : null}
						</div>
					)}
				</div>
			</SheetContent>
		</Sheet>
	);
}
