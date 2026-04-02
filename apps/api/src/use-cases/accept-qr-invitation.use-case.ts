/**
 * Accept QR Invitation Use-Case (Story 34-1)
 *
 * Validates QR token, consumes credit, accepts token,
 * creates relationship analysis placeholder, and forks generation daemon.
 */

import {
	AssessmentNotCompletedError,
	AssessmentResultRepository,
	AssessmentSessionRepository,
	DatabaseError,
	InsufficientCreditsError,
	PurchaseEventRepository,
	QrTokenRepository,
	RelationshipAnalysisRepository,
} from "@workspace/domain";
import { Effect } from "effect";
import { generateRelationshipAnalysis } from "./generate-relationship-analysis.use-case";

export const acceptQrInvitation = (input: { token: string; acceptedByUserId: string }) =>
	Effect.gen(function* () {
		const qrTokenRepo = yield* QrTokenRepository;
		const purchaseRepo = yield* PurchaseEventRepository;
		const analysisRepo = yield* RelationshipAnalysisRepository;
		const sessionRepo = yield* AssessmentSessionRepository;
		const resultRepo = yield* AssessmentResultRepository;

		// 1. Check acceptor's credit balance
		const capabilities = yield* purchaseRepo.getCapabilities(input.acceptedByUserId);
		if (capabilities.availableCredits < 1) {
			return yield* Effect.fail(
				new InsufficientCreditsError({ message: "No relationship credits available" }),
			);
		}

		// 2. Accept the QR token (atomic: checks active, not expired, not self)
		const accepted = yield* qrTokenRepo.accept(input);

		// 3. Check both users have completed assessments BEFORE consuming credit
		const generatorUserId = accepted.userId;
		const acceptorUserId = input.acceptedByUserId;

		const generatorSession = yield* sessionRepo.findSessionByUserId(generatorUserId);
		const acceptorSession = yield* sessionRepo.findSessionByUserId(acceptorUserId);

		const generatorResult = generatorSession
			? yield* resultRepo
					.getBySessionId(generatorSession.id)
					.pipe(
						Effect.catchTag("AssessmentResultError", () =>
							Effect.fail(new DatabaseError({ message: "Failed to load generator assessment result" })),
						),
					)
			: null;
		const acceptorResult = acceptorSession
			? yield* resultRepo
					.getBySessionId(acceptorSession.id)
					.pipe(
						Effect.catchTag("AssessmentResultError", () =>
							Effect.fail(new DatabaseError({ message: "Failed to load acceptor assessment result" })),
						),
					)
			: null;

		if (!generatorResult || !acceptorResult) {
			return yield* Effect.fail(
				new AssessmentNotCompletedError({
					message: "Both users must complete their assessment before a relationship analysis",
				}),
			);
		}

		// 4. Consume credit via purchase event (fail-open: duplicate = no-op)
		yield* purchaseRepo
			.insertEvent({
				userId: input.acceptedByUserId,
				eventType: "credit_consumed",
				polarCheckoutId: `credit-consumed-qr-${accepted.token}`,
				metadata: { qrTokenId: accepted.id },
			})
			.pipe(Effect.catchTag("DuplicateCheckoutError", () => Effect.void));

		// 5. Canonical user ordering: userAId = MIN, userBId = MAX
		const userAId = generatorUserId < acceptorUserId ? generatorUserId : acceptorUserId;
		const userBId = generatorUserId < acceptorUserId ? acceptorUserId : generatorUserId;
		const userAResultId = generatorUserId < acceptorUserId ? generatorResult.id : acceptorResult.id;
		const userBResultId = generatorUserId < acceptorUserId ? acceptorResult.id : generatorResult.id;

		// 6. Insert analysis placeholder
		const analysis = yield* analysisRepo.insertPlaceholder({
			userAId,
			userBId,
			userAResultId,
			userBResultId,
		});

		// 7. Fork daemon to generate analysis
		if (analysis) {
			yield* Effect.forkDaemon(
				generateRelationshipAnalysis({
					analysisId: analysis.id,
					inviterUserId: generatorUserId,
					inviteeUserId: acceptorUserId,
				}),
			);
		}

		return { analysisId: analysis?.id ?? "" };
	});
