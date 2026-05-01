import { AssessmentCompletionRepository, DatabaseError } from "@workspace/domain";
import { LoggerRepository } from "@workspace/domain/repositories/logger.repository";
import { Database } from "@workspace/infrastructure/context/database";
import { eq } from "drizzle-orm";
import { Effect, Layer } from "effect";
import { assessmentResults, conversation, publicProfile } from "../db/drizzle/schema";

export const AssessmentCompletionDrizzleRepositoryLive = Layer.effect(
	AssessmentCompletionRepository,
	Effect.gen(function* () {
		const db = yield* Database;
		const logger = yield* LoggerRepository;

		return AssessmentCompletionRepository.of({
			commitCompletionWithPublicProfile: (input) =>
				db
					.transaction((tx) =>
						Effect.gen(function* () {
							const updatedResults = yield* tx
								.update(assessmentResults)
								.set({ stage: "completed" })
								.where(eq(assessmentResults.conversationId, input.sessionId))
								.returning({ id: assessmentResults.id })
								.pipe(
									Effect.mapError((error) => {
										logger.error("Database operation failed", {
											operation: "commitCompletionWithPublicProfile.updateAssessmentResultsStage",
											sessionId: input.sessionId,
											error: error instanceof Error ? error.message : String(error),
										});
										return new DatabaseError({ message: "Failed to finalize assessment results" });
									}),
								);

							if (updatedResults.length === 0 || !updatedResults[0]) {
								return yield* Effect.fail(
									new DatabaseError({ message: "Assessment result missing during finalization commit" }),
								);
							}

							if (updatedResults[0].id !== input.assessmentResultId) {
								// Defensive: conversationId should map to a single assessment_results row.
								return yield* Effect.fail(
									new DatabaseError({ message: "Assessment result id mismatch during finalization commit" }),
								);
							}

							yield* tx
								.update(conversation)
								.set({
									status: "completed",
									finalizationProgress: "completed",
									updatedAt: new Date(),
								})
								.where(eq(conversation.id, input.sessionId))
								.pipe(
									Effect.mapError((error) => {
										logger.error("Database operation failed", {
											operation: "commitCompletionWithPublicProfile.updateConversationCompleted",
											sessionId: input.sessionId,
											error: error instanceof Error ? error.message : String(error),
										});
										return new DatabaseError({ message: "Failed to mark conversation completed" });
									}),
								);

							yield* tx
								.insert(publicProfile)
								.values({
									conversationId: input.sessionId,
									userId: input.userId,
									assessmentResultId: input.assessmentResultId,
								})
								.onConflictDoNothing({ target: publicProfile.conversationId })
								.pipe(
									Effect.mapError((error) => {
										logger.error("Database operation failed", {
											operation: "commitCompletionWithPublicProfile.insertPublicProfile",
											sessionId: input.sessionId,
											error: error instanceof Error ? error.message : String(error),
										});
										return new DatabaseError({ message: "Failed to provision public profile row" });
									}),
								);

							const rows = yield* tx
								.select({ id: publicProfile.id })
								.from(publicProfile)
								.where(eq(publicProfile.conversationId, input.sessionId))
								.limit(1)
								.pipe(
									Effect.mapError((error) => {
										logger.error("Database operation failed", {
											operation: "commitCompletionWithPublicProfile.verifyPublicProfile",
											sessionId: input.sessionId,
											error: error instanceof Error ? error.message : String(error),
										});
										return new DatabaseError({ message: "Failed to verify public profile row" });
									}),
								);

							if (rows.length === 0 || !rows[0]) {
								return yield* Effect.fail(
									new DatabaseError({ message: "Public profile row missing after finalization commit" }),
								);
							}

							return yield* Effect.void;
						}),
					)
					.pipe(
						Effect.mapError((error) => {
							if (error instanceof DatabaseError) {
								return error;
							}
							logger.error("Database operation failed", {
								operation: "commitCompletionWithPublicProfile.transaction",
								sessionId: input.sessionId,
								error: error instanceof Error ? error.message : String(error),
							});
							return new DatabaseError({ message: "Failed to finalize assessment in transaction" });
						}),
					),
		});
	}),
);
