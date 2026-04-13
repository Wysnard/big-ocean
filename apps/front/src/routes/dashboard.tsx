/**
 * Dashboard Route — Redirect Only (Story 1.2)
 *
 * The dashboard has been retired in favor of the three-space model
 * (Today / Me / Circle). This route exists solely to redirect bookmarked
 * or direct visits to /today.
 */

import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard")({
	beforeLoad: () => {
		throw redirect({ to: "/today", statusCode: 301 });
	},
});
