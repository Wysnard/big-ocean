import { createFileRoute, redirect } from "@tanstack/react-router";
import { LibraryLandingRedesign1 } from "@/components/dev/library-landing-redesign-demos";

export const Route = createFileRoute("/dev/library/landing/redesign-1")({
	beforeLoad: () => {
		if (import.meta.env.PROD) {
			throw redirect({ to: "/" });
		}
	},
	component: LibraryLandingRedesign1,
});
