import { Link, useRouterState } from "@tanstack/react-router";
import { Button } from "@workspace/ui/components/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { LayoutDashboard, LogOut } from "lucide-react";
import { useAuth } from "../hooks/use-auth";
import { getActiveAssessmentSessionId } from "../lib/auth-session-linking";

function UserInitial({ name }: { name: string }) {
	const initial = name.charAt(0).toUpperCase();
	return (
		<div className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
			{initial}
		</div>
	);
}

export function UserNav() {
	const { user, isAuthenticated, isPending, signOut } = useAuth();
	const authLinkSearch = useRouterState({
		select: (state) => {
			const sessionId = getActiveAssessmentSessionId(
				state.location.pathname,
				state.location.search as Record<string, unknown>,
			);

			if (!sessionId) {
				return undefined;
			}

			return {
				sessionId,
				redirectTo: state.location.pathname,
			};
		},
	});

	if (isPending) {
		return (
			<div data-slot="user-nav" className="flex items-center gap-2">
				<div className="h-8 w-20 animate-pulse rounded bg-muted" />
			</div>
		);
	}

	if (!isAuthenticated || !user) {
		return (
			<div data-slot="user-nav" className="flex items-center gap-2">
				<Button variant="ghost" size="sm" asChild>
					<Link
						to="/login"
						search={{
							sessionId: authLinkSearch?.sessionId,
							redirectTo: authLinkSearch?.redirectTo,
						}}
					>
						Sign In
					</Link>
				</Button>
				<Button size="sm" asChild>
					<Link
						to="/signup"
						search={{
							sessionId: authLinkSearch?.sessionId,
							redirectTo: authLinkSearch?.redirectTo,
						}}
					>
						Sign Up
					</Link>
				</Button>
			</div>
		);
	}

	return (
		<div data-slot="user-nav">
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="ghost" size="icon" className="rounded-full">
						<UserInitial name={user.name || user.email} />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" className="w-56">
					<DropdownMenuLabel>
						<div className="flex flex-col gap-1">
							<p className="text-sm font-medium">{user.name || "User"}</p>
							<p className="text-xs text-muted-foreground">{user.email}</p>
						</div>
					</DropdownMenuLabel>
					<DropdownMenuSeparator />
					<DropdownMenuGroup>
						<DropdownMenuItem asChild>
							<Link to="/dashboard" className="flex items-center gap-2 cursor-pointer">
								<LayoutDashboard className="size-4" />
								Dashboard
							</Link>
						</DropdownMenuItem>
					</DropdownMenuGroup>
					<DropdownMenuSeparator />
					<DropdownMenuItem variant="destructive" onClick={() => signOut()} className="cursor-pointer">
						<LogOut className="size-4" />
						Sign Out
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}
