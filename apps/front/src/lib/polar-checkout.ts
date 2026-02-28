/**
 * Polar.sh Checkout Utility (Story 14.1)
 *
 * Wraps @polar-sh/checkout embedded overlay for relationship credit purchases.
 */

import { PolarEmbedCheckout } from "@polar-sh/checkout/embed";

interface OpenCheckoutOptions {
	/** Polar checkout link URL */
	checkoutLinkUrl: string;
	/** User ID to attach as metadata for webhook processing */
	userId: string;
	/** Theme for the checkout overlay */
	theme?: "light" | "dark";
}

interface CheckoutResult {
	success: boolean;
}

/**
 * Opens a Polar.sh embedded checkout overlay.
 *
 * Returns a promise that resolves when the checkout completes or is closed.
 * The userId is passed via query parameter so the webhook can attribute the purchase.
 */
export const openPolarCheckout = ({
	checkoutLinkUrl,
	userId,
	theme = "light",
}: OpenCheckoutOptions): Promise<CheckoutResult> => {
	return new Promise((resolve) => {
		const url = new URL(checkoutLinkUrl);
		url.searchParams.set("metadata[userId]", userId);

		PolarEmbedCheckout.create(url.toString(), { theme })
			.then((checkout) => {
				checkout.addEventListener("success", () => {
					resolve({ success: true });
				});

				checkout.addEventListener("close", () => {
					resolve({ success: false });
				});
			})
			.catch(() => {
				resolve({ success: false });
			});
	});
};
