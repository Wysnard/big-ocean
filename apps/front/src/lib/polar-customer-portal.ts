/**
 * Polar customer portal (Better Auth Polar plugin).
 *
 * This route is served by Better Auth at `/api/auth/customer/portal`, not the
 * Effect `BigOceanApi` — we use `fetch` with cookies here instead of HttpApiClient.
 */
const apiRoot = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

function parsePortalUrlPayload(raw: unknown): string {
	if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
		throw new Error("Invalid portal response");
	}
	const url = (raw as { url?: unknown }).url;
	if (typeof url !== "string" || !url) {
		throw new Error("Invalid portal response");
	}
	if (!url.startsWith("https://")) {
		throw new Error("Invalid portal URL");
	}
	return url;
}

export async function openPolarCustomerPortal(): Promise<void> {
	const res = await fetch(`${apiRoot}/api/auth/customer/portal`, {
		method: "POST",
		credentials: "include",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ redirect: false }),
	});
	if (!res.ok) {
		throw new Error("Could not open subscription management");
	}
	let parsed: unknown;
	try {
		parsed = await res.json();
	} catch {
		throw new Error("Invalid portal response");
	}
	const url = parsePortalUrlPayload(parsed);
	const opened = window.open(url, "_blank", "noopener,noreferrer");
	if (opened == null) {
		window.location.href = url;
	}
}
