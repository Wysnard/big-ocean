import { Context, Effect } from "effect";
import { DatabaseError } from "../errors/http.errors";

export interface SubscriptionNudgeEligibleUser {
	readonly userId: string;
	readonly userEmail: string;
	readonly userName: string;
	readonly returnVisitCount: number;
	readonly relationshipLetterCount: number;
}

export class LifecycleEmailRepository extends Context.Tag("LifecycleEmailRepository")<
	LifecycleEmailRepository,
	{
		/**
		 * Returns engaged free users who are eligible for the one-shot subscription nudge.
		 *
		 * Return visits are currently inferred from authenticated session rows until
		 * a dedicated visit-tracking event exists in the product analytics layer.
		 */
		readonly findSubscriptionNudgeEligibleUsers: (
			thresholdDays: number,
		) => Effect.Effect<Array<SubscriptionNudgeEligibleUser>, DatabaseError>;

		/**
		 * Mark the user-scoped subscription nudge as sent before delivery.
		 */
		readonly markSubscriptionNudgeEmailSent: (userId: string) => Effect.Effect<void, DatabaseError>;
	}
>() {}
