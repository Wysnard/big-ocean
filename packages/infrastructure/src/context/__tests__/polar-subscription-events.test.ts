import { describe, expect, it } from "vitest";
import {
	getLifecycleEventFromSubscriptionUpdate,
	shouldRecordSubscriptionRenewal,
} from "../polar-subscription-events";

describe("getLifecycleEventFromSubscriptionUpdate", () => {
	it("maps active updates to subscription_started", () => {
		expect(
			getLifecycleEventFromSubscriptionUpdate({
				status: "active",
				cancelAtPeriodEnd: false,
				canceledAt: null,
				currentPeriodEnd: new Date("2026-02-01T00:00:00Z"),
				endedAt: null,
			}),
		).toBe("subscription_started");
	});

	it("maps cancel-at-period-end updates to subscription_cancelled", () => {
		expect(
			getLifecycleEventFromSubscriptionUpdate({
				status: "active",
				cancelAtPeriodEnd: true,
				canceledAt: new Date("2026-01-15T00:00:00Z"),
				currentPeriodEnd: new Date("2026-02-01T00:00:00Z"),
				endedAt: null,
			}),
		).toBe("subscription_cancelled");
	});

	it("maps ended subscriptions to subscription_expired", () => {
		expect(
			getLifecycleEventFromSubscriptionUpdate({
				status: "canceled",
				cancelAtPeriodEnd: true,
				canceledAt: new Date("2026-01-15T00:00:00Z"),
				currentPeriodEnd: new Date("2026-01-31T00:00:00Z"),
				endedAt: new Date("2026-02-01T00:00:00Z"),
			}),
		).toBe("subscription_expired");
	});

	it("maps canceled status after period end to subscription_expired", () => {
		expect(
			getLifecycleEventFromSubscriptionUpdate(
				{
					status: "canceled",
					cancelAtPeriodEnd: true,
					canceledAt: new Date("2026-01-15T00:00:00Z"),
					currentPeriodEnd: new Date("2026-01-31T00:00:00Z"),
					endedAt: null,
				},
				new Date("2026-02-02T00:00:00Z"),
			),
		).toBe("subscription_expired");
	});
});

describe("shouldRecordSubscriptionRenewal", () => {
	it("returns false when current period end matches the started row", () => {
		expect(
			shouldRecordSubscriptionRenewal({
				startedPeriodEnd: "2026-02-01T00:00:00.000Z",
				latestRenewalPeriodEnd: null,
				currentPeriodEnd: "2026-02-01T00:00:00.000Z",
			}),
		).toBe(false);
	});

	it("returns false when current period end matches the latest renewal row", () => {
		expect(
			shouldRecordSubscriptionRenewal({
				startedPeriodEnd: "2026-02-01T00:00:00.000Z",
				latestRenewalPeriodEnd: "2026-03-01T00:00:00.000Z",
				currentPeriodEnd: "2026-03-01T00:00:00.000Z",
			}),
		).toBe(false);
	});

	it("returns true when the billing period advances", () => {
		expect(
			shouldRecordSubscriptionRenewal({
				startedPeriodEnd: "2026-02-01T00:00:00.000Z",
				latestRenewalPeriodEnd: "2026-03-01T00:00:00.000Z",
				currentPeriodEnd: "2026-04-01T00:00:00.000Z",
			}),
		).toBe(true);
	});
});
