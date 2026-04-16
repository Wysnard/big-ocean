import type { PurchaseEventType } from "@workspace/domain";

export type SubscriptionLifecycleEventType = Extract<
	PurchaseEventType,
	"subscription_started" | "subscription_renewed" | "subscription_cancelled" | "subscription_expired"
>;

export interface SubscriptionLifecycleSnapshot {
	readonly status: string;
	readonly cancelAtPeriodEnd: boolean;
	readonly canceledAt: Date | null;
	readonly currentPeriodEnd: Date | null;
	readonly endedAt: Date | null;
}

/**
 * Derive the lifecycle event we should record from a subscription snapshot delivered by Polar.
 */
export const getLifecycleEventFromSubscriptionUpdate = (
	subscription: SubscriptionLifecycleSnapshot,
	now: Date = new Date(),
): Exclude<SubscriptionLifecycleEventType, "subscription_renewed"> | null => {
	if (subscription.endedAt !== null) return "subscription_expired";

	const currentPeriodEnded =
		subscription.currentPeriodEnd === null ||
		subscription.currentPeriodEnd.getTime() <= now.getTime();

	if (
		(subscription.status === "canceled" ||
			subscription.status === "unpaid" ||
			subscription.status === "incomplete_expired") &&
		currentPeriodEnded
	) {
		return "subscription_expired";
	}

	if (subscription.cancelAtPeriodEnd || subscription.canceledAt !== null) {
		return "subscription_cancelled";
	}

	if (subscription.status === "active" || subscription.status === "trialing") {
		return "subscription_started";
	}

	return null;
};

/**
 * Renewal should be recorded when the current billing period end advances beyond what we've already
 * seen from the initial start row and latest renewal row.
 */
export const shouldRecordSubscriptionRenewal = (params: {
	readonly startedPeriodEnd: string | null;
	readonly latestRenewalPeriodEnd: string | null;
	readonly currentPeriodEnd: string | null;
}): boolean => {
	if (params.currentPeriodEnd === null) return false;
	if (params.currentPeriodEnd === params.startedPeriodEnd) return false;
	if (params.currentPeriodEnd === params.latestRenewalPeriodEnd) return false;
	return true;
};
