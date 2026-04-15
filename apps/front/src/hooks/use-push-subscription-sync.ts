import { Effect } from "effect";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { makeApiClient } from "@/lib/api-client";

const PUSH_VAPID_PUBLIC_KEY = import.meta.env.VITE_PUSH_VAPID_PUBLIC_KEY;
const SYNC_KEY = "push-subscription-synced";

function toUint8Array(base64Url: string): Uint8Array {
	const padded = `${base64Url}${"=".repeat((4 - (base64Url.length % 4)) % 4)}`
		.replace(/-/g, "+")
		.replace(/_/g, "/");
	const binary = window.atob(padded);
	return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function supportsPushSubscriptionSync() {
	return (
		typeof window !== "undefined" &&
		"serviceWorker" in navigator &&
		"PushManager" in window &&
		"Notification" in window &&
		Boolean(PUSH_VAPID_PUBLIC_KEY)
	);
}

export async function syncPushSubscription(options: { respectSessionCache?: boolean } = {}) {
	const respectSessionCache = options.respectSessionCache ?? true;

	if (!supportsPushSubscriptionSync()) {
		return { status: "unsupported" as const };
	}

	if (
		respectSessionCache &&
		Notification.permission === "granted" &&
		sessionStorage.getItem(SYNC_KEY)
	) {
		return { status: "skipped" as const };
	}

	const registration = await navigator.serviceWorker.register("/push-sw.js");
	const client = await Effect.runPromise(makeApiClient);
	const existingSubscription = await registration.pushManager.getSubscription();

	if (Notification.permission !== "granted") {
		sessionStorage.removeItem(SYNC_KEY);

		if (existingSubscription) {
			await existingSubscription.unsubscribe();
			await client.account.removePushSubscription({
				payload: { endpoint: existingSubscription.endpoint },
			});
			return { status: "removed" as const };
		}

		return { status: "skipped" as const };
	}

	const subscription =
		existingSubscription ??
		(await registration.pushManager.subscribe({
			userVisibleOnly: true,
			applicationServerKey: toUint8Array(PUSH_VAPID_PUBLIC_KEY).buffer as ArrayBuffer,
		}));

	const serialized = subscription.toJSON();
	if (!serialized.endpoint || !serialized.keys?.p256dh || !serialized.keys?.auth) {
		throw new Error("Push subscription is missing required fields");
	}

	await client.account.savePushSubscription({
		payload: {
			endpoint: serialized.endpoint,
			keys: {
				p256dh: serialized.keys.p256dh,
				auth: serialized.keys.auth,
			},
		},
	});

	sessionStorage.setItem(SYNC_KEY, "1");
	return { status: "saved" as const, endpoint: serialized.endpoint };
}

export function usePushSubscriptionSync() {
	const { isAuthenticated, isPending } = useAuth();

	useEffect(() => {
		if (isPending || !isAuthenticated) {
			return;
		}

		const run = async () => {
			try {
				await syncPushSubscription();
			} catch {
				// Missing permission, missing worker support, or transient network issues
				// should not interrupt the rest of the app. Email fallback remains available.
			}
		};

		void run();
	}, [isAuthenticated, isPending]);
}
