/**
 * Idempotent public profile row for a completed assessment session.
 * Invoked during Assessment Finalization so read paths (e.g. getResults) only query profile state.
 */

import { AssessmentResultRepository, PublicProfileRepository } from "@workspace/domain";
import { Effect } from "effect";

export interface EnsurePublicProfileForSessionInput {
	readonly sessionId: string;
	readonly userId: string;
}

export const ensurePublicProfileForSession = (input: EnsurePublicProfileForSessionInput) =>
	Effect.gen(function* () {
		const profileRepo = yield* PublicProfileRepository;
		const resultRepo = yield* AssessmentResultRepository;
		const existing = yield* profileRepo.getProfileBySessionId(input.sessionId);
		if (existing !== null) {
			return existing;
		}
		const result = yield* resultRepo
			.getBySessionId(input.sessionId)
			.pipe(Effect.catchAll(() => Effect.succeed(null)));
		return yield* profileRepo.createProfile({
			sessionId: input.sessionId,
			userId: input.userId,
			...(result?.id ? { assessmentResultId: result.id } : {}),
		});
	});
