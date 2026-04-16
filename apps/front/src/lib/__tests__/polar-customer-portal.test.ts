// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { openPolarCustomerPortal } from "../polar-customer-portal";

const portalUrl = "https://polar.example/portal/session/abc";

function mockFetchOkJson(body: unknown) {
	vi.stubGlobal(
		"fetch",
		vi.fn().mockResolvedValue({
			ok: true,
			json: async () => body,
		} as Response),
	);
}

describe("openPolarCustomerPortal", () => {
	beforeEach(() => {
		vi.stubGlobal("fetch", vi.fn());
		vi.spyOn(window, "open").mockReturnValue({} as Window);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	it("throws when response is not ok", async () => {
		vi.mocked(fetch).mockResolvedValue({ ok: false, status: 500 } as Response);

		await expect(openPolarCustomerPortal()).rejects.toThrow("Could not open subscription management");
	});

	it("throws when JSON body is not valid JSON", async () => {
		vi.mocked(fetch).mockResolvedValue({
			ok: true,
			json: async () => {
				throw new SyntaxError("Unexpected token");
			},
		} as Response);

		await expect(openPolarCustomerPortal()).rejects.toThrow("Invalid portal response");
	});

	it("throws when JSON body is null", async () => {
		mockFetchOkJson(null);

		await expect(openPolarCustomerPortal()).rejects.toThrow("Invalid portal response");
	});

	it("throws when JSON body is an array", async () => {
		mockFetchOkJson([{ url: portalUrl }]);

		await expect(openPolarCustomerPortal()).rejects.toThrow("Invalid portal response");
	});

	it("throws when url is missing or not a string", async () => {
		mockFetchOkJson({});

		await expect(openPolarCustomerPortal()).rejects.toThrow("Invalid portal response");
	});

	it("throws when url is not https", async () => {
		mockFetchOkJson({ url: "http://insecure.example/portal" });

		await expect(openPolarCustomerPortal()).rejects.toThrow("Invalid portal URL");
	});

	it("opens https portal URL in a new window when popup succeeds", async () => {
		mockFetchOkJson({ url: portalUrl });
		const openSpy = vi.spyOn(window, "open").mockReturnValue({} as Window);

		await openPolarCustomerPortal();

		expect(openSpy).toHaveBeenCalledWith(portalUrl, "_blank", "noopener,noreferrer");
	});

	it("sets location.href when popup is blocked", async () => {
		mockFetchOkJson({ url: portalUrl });
		vi.spyOn(window, "open").mockReturnValue(null);

		const prevLocation = window.location;
		// jsdom: replace location so assigning href does not navigate away
		// @ts-expect-error test-only stub
		delete window.location;
		const loc = { href: "http://localhost/" };
		// @ts-expect-error test-only stub
		window.location = loc as Location;

		await openPolarCustomerPortal();

		expect(loc.href).toBe(portalUrl);

		window.location = prevLocation;
	});
});
