/**
 * QR Accept Route (Story 34-3)
 *
 * Route: /relationship/qr/$token
 *
 * Auth-gated route that displays the QR accept screen.
 * Redirects unauthenticated users to login with a return URL.
 */

import { createFileRoute, redirect } from "@tanstack/react-router";
import { QrAcceptScreen } from "@/components/relationship/QrAcceptScreen";
import { useQrAccept } from "@/hooks/useQrAccept";
import { getSession } from "@/lib/auth-client";

export const Route = createFileRoute("/relationship/qr/$token")({
	beforeLoad: async ({ params }) => {
		const { data: session } = await getSession();
		if (!session?.user) {
			throw redirect({
				to: "/login",
				search: {
					sessionId: undefined,
					redirectTo: `/relationship/qr/${params.token}`,
				},
			});
		}
	},
	component: QrAcceptRoute,
});

function QrAcceptRoute() {
	const { token } = Route.useParams();
	const qrAccept = useQrAccept(token);

	return (
		<QrAcceptScreen
			details={qrAccept.details}
			isLoading={qrAccept.isLoading}
			error={qrAccept.error}
			onAccept={qrAccept.handleAccept}
			onRefuse={qrAccept.handleRefuse}
			isAccepting={qrAccept.isAccepting}
			isRefusing={qrAccept.isRefusing}
			acceptError={qrAccept.acceptError}
		/>
	);
}
