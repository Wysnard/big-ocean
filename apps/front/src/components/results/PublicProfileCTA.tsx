import { Link } from "@tanstack/react-router";
import { Button } from "@workspace/ui/components/button";

export type AuthState =
	| "unauthenticated"
	| "authenticated-no-assessment"
	| "authenticated-assessed";

interface PublicProfileCTAProps {
	displayName: string;
	publicProfileId: string;
	authState: AuthState;
	isOwnProfile?: boolean;
}

const CTA_CONTENT: Record<AuthState, { heading: string; subtext: string; buttonLabel: string }> = {
	unauthenticated: {
		heading: "What's YOUR code?",
		subtext: "Discover it in a conversation with Nerin",
		buttonLabel: "Start Your Conversation",
	},
	"authenticated-no-assessment": {
		heading: "Want to compare personalities?",
		subtext: "Complete your own assessment first, then unlock relationship analysis.",
		buttonLabel: "Start Your Assessment",
	},
	"authenticated-assessed": {
		heading: "", // dynamic — set below
		subtext: "Scan a QR code together to unlock a deep comparison of your personality dynamics.",
		buttonLabel: "Start Relationship Analysis",
	},
};

export function PublicProfileCTA({
	displayName,
	publicProfileId,
	authState,
	isOwnProfile = false,
}: PublicProfileCTAProps) {
	// When viewing own profile as authenticated-assessed user, show the generic CTA
	const effectiveAuthState =
		isOwnProfile && authState === "authenticated-assessed" ? "unauthenticated" : authState;

	const content = CTA_CONTENT[effectiveAuthState];
	const heading =
		effectiveAuthState === "authenticated-assessed"
			? `You care about ${displayName}. Discover your dynamic together.`
			: content.heading;

	const href =
		effectiveAuthState === "unauthenticated"
			? "/signup"
			: effectiveAuthState === "authenticated-no-assessment"
				? "/chat"
				: `/relationship-analysis?with=${publicProfileId}`;

	return (
		<section
			data-testid="public-profile-cta"
			data-slot="public-profile-cta"
			data-auth-state={authState}
			className="py-16 md:py-24"
			style={{
				background: "linear-gradient(135deg, oklch(0.67 0.13 181 / 0.08), oklch(0.55 0.24 293 / 0.06))",
			}}
		>
			<div className="mx-auto max-w-[600px] px-6 text-center">
				<h2 className="font-display text-2xl text-foreground mb-3">{heading}</h2>
				<p className="text-muted-foreground mb-8">{content.subtext}</p>

				<Link to={href}>
					<Button
						data-slot="cta-button"
						data-testid="public-profile-cta-button"
						className="bg-primary text-primary-foreground text-lg py-4 px-8 rounded-xl font-semibold min-h-[44px] w-full max-w-[400px]"
					>
						{content.buttonLabel}
					</Button>
				</Link>

				<p className="text-sm text-muted-foreground mt-8">-- big-ocean --</p>
			</div>
		</section>
	);
}
