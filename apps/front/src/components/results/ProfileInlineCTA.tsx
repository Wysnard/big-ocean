import { Link } from "@tanstack/react-router";
import { Button } from "@workspace/ui/components/button";
import type { AuthState } from "./PublicProfileCTA";

interface ProfileInlineCTAProps {
	authState: AuthState;
	isOwnProfile?: boolean;
}

export function ProfileInlineCTA({ authState, isOwnProfile = false }: ProfileInlineCTAProps) {
	// Only show for visitors who haven't completed their assessment.
	// Also hide when the user is viewing their own profile (they already have an assessment).
	if (authState === "authenticated-assessed" || isOwnProfile) {
		return null;
	}

	const href = authState === "unauthenticated" ? "/signup" : "/chat";

	return (
		<div data-slot="profile-inline-cta" className="mx-auto max-w-[600px] px-6 py-8 text-center">
			<Link to={href}>
				<Button
					data-testid="profile-inline-cta-button"
					className="bg-primary text-primary-foreground text-base py-3 px-6 rounded-xl font-semibold min-h-11 w-full max-w-[400px]"
				>
					Discover your own personality
				</Button>
			</Link>
		</div>
	);
}
