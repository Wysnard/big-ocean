import { createFileRoute, redirect } from "@tanstack/react-router";
import { LibraryLandingRedesign2 } from "@/components/dev/library-landing-redesign-demos";

export const Route = createFileRoute("/dev/library/landing/redesign-2")({
	beforeLoad: () => {
		if (import.meta.env.PROD) {
			throw redirect({ to: "/" });
		}
	},
	component: LibraryLandingRedesign2,
});
