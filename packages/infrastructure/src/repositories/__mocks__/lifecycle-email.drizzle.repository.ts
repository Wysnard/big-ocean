import { LifecycleEmailRepository } from "@workspace/domain";
import { Effect, Layer } from "effect";

const eligibleUsers = new Map<
	string,
	{
		userId: string;
		userEmail: string;
		userName: string;
		returnVisitCount: number;
		relationshipLetterCount: number;
		subscriptionNudgeEmailSentAt: Date | null;
	}
>();

export const _resetMockState = () => {
	eligibleUsers.clear();
};

export const _seedEligibleUser = (
	userId: string,
	overrides?: Partial<{
		userEmail: string;
		userName: string;
		returnVisitCount: number;
		relationshipLetterCount: number;
		subscriptionNudgeEmailSentAt: Date | null;
	}>,
) => {
	eligibleUsers.set(userId, {
		userId,
		userEmail: overrides?.userEmail ?? `${userId}@example.com`,
		userName: overrides?.userName ?? "Test User",
		returnVisitCount: overrides?.returnVisitCount ?? 3,
		relationshipLetterCount: overrides?.relationshipLetterCount ?? 0,
		subscriptionNudgeEmailSentAt: overrides?.subscriptionNudgeEmailSentAt ?? null,
	});
};

export const LifecycleEmailDrizzleRepositoryLive = Layer.succeed(
	LifecycleEmailRepository,
	LifecycleEmailRepository.of({
		findSubscriptionNudgeEligibleUsers: (_thresholdDays: number) =>
			Effect.sync(() =>
				[...eligibleUsers.values()]
					.filter((user) => user.subscriptionNudgeEmailSentAt == null)
					.map(({ subscriptionNudgeEmailSentAt: _ignored, ...user }) => user),
			),

		markSubscriptionNudgeEmailSent: (userId: string) =>
			Effect.sync(() => {
				const existing = eligibleUsers.get(userId);
				if (existing) {
					eligibleUsers.set(userId, {
						...existing,
						subscriptionNudgeEmailSentAt: new Date(),
					});
				}
			}),
	}),
);
