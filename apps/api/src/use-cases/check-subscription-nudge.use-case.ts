import {
	AppConfig,
	LifecycleEmailRepository,
	LoggerRepository,
	ResendEmailRepository,
} from "@workspace/domain";
import { renderSubscriptionNudgeEmail } from "@workspace/infrastructure/email-templates/subscription-conversion-nudge";
import { Effect } from "effect";

export const checkSubscriptionNudge = Effect.gen(function* () {
	const config = yield* AppConfig;
	const lifecycleEmailRepo = yield* LifecycleEmailRepository;
	const emailRepo = yield* ResendEmailRepository;
	const logger = yield* LoggerRepository;

	const eligibleUsers = yield* lifecycleEmailRepo.findSubscriptionNudgeEligibleUsers(
		config.subscriptionNudgeThresholdDays,
	);

	if (eligibleUsers.length === 0) {
		logger.info("No subscription nudge eligible users found");
		return { emailsSent: 0 };
	}

	logger.info("Found subscription nudge eligible users", { count: eligibleUsers.length });

	let emailsSent = 0;

	for (const user of eligibleUsers) {
		const marked = yield* lifecycleEmailRepo.markSubscriptionNudgeEmailSent(user.userId).pipe(
			Effect.as(true),
			Effect.catchAll((err) => {
				logger.error("Failed to mark subscription nudge email sent", {
					userId: user.userId,
					error: err instanceof Error ? err.message : String(err),
				});
				return Effect.succeed(false);
			}),
		);

		if (!marked) {
			continue;
		}

		const subscriptionUrl = `${config.frontendUrl}/me`;
		const html = renderSubscriptionNudgeEmail({
			userName: user.userName,
			subscriptionUrl,
		});

		yield* emailRepo
			.sendEmail({
				to: user.userEmail,
				subject: "I have more I want to say about what comes next",
				html,
			})
			.pipe(
				Effect.tap(() => {
					logger.info("Subscription nudge email sent", {
						userId: user.userId,
						userEmail: user.userEmail,
						returnVisitCount: user.returnVisitCount,
						relationshipLetterCount: user.relationshipLetterCount,
					});
					emailsSent++;
					return Effect.void;
				}),
				Effect.catchAll((err) => {
					logger.error("Failed to send subscription nudge email (fail-open)", {
						userId: user.userId,
						userEmail: user.userEmail,
						error: err instanceof Error ? err.message : String(err),
					});
					return Effect.void;
				}),
			);
	}

	return { emailsSent };
});
