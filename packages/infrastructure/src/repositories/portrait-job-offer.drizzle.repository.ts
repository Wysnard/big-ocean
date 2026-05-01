import { DatabaseError, PortraitJobOfferRepository } from "@workspace/domain";
import { LoggerRepository } from "@workspace/domain/repositories/logger.repository";
import { Database } from "@workspace/infrastructure/context/database";
import { and, eq, like } from "drizzle-orm";
import { Effect, Layer } from "effect";
import { portraitJobOffers } from "../db/drizzle/schema";

export const PortraitJobOfferDrizzleRepositoryLive = Layer.effect(
	PortraitJobOfferRepository,
	Effect.gen(function* () {
		const db = yield* Database;
		const logger = yield* LoggerRepository;

		return PortraitJobOfferRepository.of({
			claimOffer: (input) =>
				Effect.gen(function* () {
					const inserted = yield* db
						.insert(portraitJobOffers)
						.values({
							conversationId: input.sessionId,
							userId: input.userId,
							jobKey: input.jobKey,
						})
						.onConflictDoNothing({
							target: [portraitJobOffers.conversationId, portraitJobOffers.jobKey],
						})
						.returning({ id: portraitJobOffers.id })
						.pipe(
							Effect.mapError((error) => {
								logger.error("Database operation failed", {
									operation: "portraitJobOffers.claimOffer",
									sessionId: input.sessionId,
									jobKey: input.jobKey,
									error: error instanceof Error ? error.message : String(error),
								});
								return new DatabaseError({ message: "Failed to claim portrait job offer" });
							}),
						);

					return inserted.length > 0;
				}),

			deleteOffersByJobKeyPrefix: (sessionId, jobKeyPrefix) =>
				db
					.delete(portraitJobOffers)
					.where(
						and(
							eq(portraitJobOffers.conversationId, sessionId),
							like(portraitJobOffers.jobKey, `${jobKeyPrefix}%`),
						),
					)
					.pipe(
						Effect.mapError((error) => {
							logger.error("Database operation failed", {
								operation: "portraitJobOffers.deleteOffersByJobKeyPrefix",
								sessionId,
								jobKeyPrefix,
								error: error instanceof Error ? error.message : String(error),
							});
							return new DatabaseError({ message: "Failed to delete portrait job offers" });
						}),
					),
		});
	}),
);
