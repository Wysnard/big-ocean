import { Effect } from "effect";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { makeApiClient } from "@/lib/api-client";

const PUSH_VAPID_PUBLIC_KEY = import.meta.env.VITE_PUSH_VAPID_PUBLIC_KEY;

function toUint8Array(base64Url: string): Uint8Array {
	const padded = `${base64Url}${"=".repeat((4 - (base64Url.length % 4)) % 4)}`
		.replace(/-/g, "+")
		.replace(/_/g, "/");
	const binary = window.atob(padded);
	return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

export function usePushSubscriptionSync() {
	const { isAuthenticated, isPending } = useAuth();

	useEffect(() => {
		if (
			typeof window === "undefined" ||
			!("serviceWorker" in navigator) ||
			!("PushManager" in window) ||
			!("Notification" in window) ||
			!PUSH_VAPID_PUBLIC_KEY ||
			isPending ||
			!isAuthenticated
		) {
			return;
		}

		const SYNC_KEY = "push-subscription-synced";
		if (sessionStorage.getItem(SYNC_KEY)) return;

		let cancelled = false;

		const run = async () => {
			try {
				const registration = await navigator.serviceWorker.register("/push-sw.js");
				const client = await Effect.runPromise(makeApiClient);
				const existingSubscription = await registration.pushManager.getSubscription();

				if (Notification.permission !== "granted") {
					if (existingSubscription) {
						await existingSubscription.unsubscribe();
						if (!cancelled) {
							await client.account.removePushSubscription({
								payload: { endpoint: existingSubscription.endpoint },
							});
						}
					}
					return;
				}

				const subscription =
					existingSubscription ??
					(await registration.pushManager.subscribe({
						userVisibleOnly: true,
						applicationServerKey: toUint8Array(PUSH_VAPID_PUBLIC_KEY).buffer as ArrayBuffer,
					}));

				if (cancelled) return;

				const serialized = subscription.toJSON();
				if (!serialized.endpoint || !serialized.keys?.p256dh || !serialized.keys?.auth) return;

				await client.account.savePushSubscription({
					payload: {
						endpoint: serialized.endpoint,
						keys: {
							p256dh: serialized.keys.p256dh,
							auth: serialized.keys.auth,
						},
					},
				});
				if (!cancelled) sessionStorage.setItem(SYNC_KEY, "1");
			} catch {
				// Missing permission, missing worker support, or transient network issues
				// should not interrupt the rest of the app. Email fallback remains available.
			}
		};

		void run();

		return () => {
			cancelled = true;
		};
	}, [isAuthenticated, isPending]);
}
