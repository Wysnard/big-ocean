import { vi } from "vitest";

vi.mock("@workspace/infrastructure/repositories/relationship-invitation.drizzle.repository");
vi.mock("@workspace/infrastructure/repositories/relationship-analysis.drizzle.repository");

import { beforeEach, describe, expect, it } from "@effect/vitest";

import {
	AssessmentResultRepository,
	AssessmentSessionRepository,
	FinalizationEvidenceRepository,
	LoggerRepository,
	RelationshipAnalysisGeneratorRepository,
	RelationshipAnalysisRepository,
	RelationshipInvitationRepository,
} from "@workspace/domain";
import { _resetMockState as resetAnalysisMock } from "@workspace/infrastructure/repositories/__mocks__/relationship-analysis.drizzle.repository";
import { _resetMockState as resetInvitationMock } from "@workspace/infrastructure/repositories/__mocks__/relationship-invitation.drizzle.repository";
import { RelationshipAnalysisDrizzleRepositoryLive } from "@workspace/infrastructure/repositories/relationship-analysis.drizzle.repository";
import { RelationshipInvitationDrizzleRepositoryLive } from "@workspace/infrastructure/repositories/relationship-invitation.drizzle.repository";
import { Effect, Exit, Layer } from "effect";
import { acceptInvitation } from "../accept-invitation.use-case";
import { refuseInvitation } from "../refuse-invitation.use-case";

const mockLogger = {
	info: vi.fn(),
	error: vi.fn(),
	warn: vi.fn(),
	debug: vi.fn(),
};

const mockSessionRepo = {
	create: vi.fn(),
	getById: vi.fn(),
	updateStatus: vi.fn(),
	updateMessageCount: vi.fn(),
	updateUserId: vi.fn(),
	findSessionByUserId: vi.fn(),
	createAnonymousSession: vi.fn(),
	getByAnonymousToken: vi.fn(),
	updateOceanCodeAndArchetype: vi.fn(),
};

const mockResultsRepo = {
	getBySessionId: vi.fn(),
	getByUserId: vi.fn(),
	upsert: vi.fn(),
	getById: vi.fn(),
	delete: vi.fn(),
};

const mockEvidenceRepo = {
	getByResultId: vi.fn(),
	saveBatch: vi.fn(),
	existsForSession: vi.fn(),
};

const mockAnalysisGen = {
	generateAnalysis: vi.fn(),
};

const TestLayer = Layer.mergeAll(
	RelationshipInvitationDrizzleRepositoryLive,
	RelationshipAnalysisDrizzleRepositoryLive,
	Layer.succeed(LoggerRepository, mockLogger),
	Layer.succeed(AssessmentSessionRepository, mockSessionRepo),
	Layer.succeed(AssessmentResultRepository, mockResultsRepo),
	Layer.succeed(FinalizationEvidenceRepository, mockEvidenceRepo),
	Layer.succeed(RelationshipAnalysisGeneratorRepository, mockAnalysisGen),
) as Layer.Layer<
	| RelationshipInvitationRepository
	| RelationshipAnalysisRepository
	| LoggerRepository
	| AssessmentSessionRepository
	| AssessmentResultRepository
	| FinalizationEvidenceRepository
	| RelationshipAnalysisGeneratorRepository
>;

const INVITER_ID = "inviter-user-1";
const TOKEN = "test-token-abc";

const seedPendingInvitation = () =>
	Effect.gen(function* () {
		const repo = yield* RelationshipInvitationRepository;
		yield* repo.createWithCreditConsumption({
			inviterUserId: INVITER_ID,
			invitationToken: TOKEN,
			personalMessage: null,
			expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
		});
	});

const seedExpiredInvitation = () =>
	Effect.gen(function* () {
		const repo = yield* RelationshipInvitationRepository;
		yield* repo.createWithCreditConsumption({
			inviterUserId: INVITER_ID,
			invitationToken: TOKEN,
			personalMessage: null,
			expiresAt: new Date(Date.now() - 1000),
		});
	});

describe("refuseInvitation use-case", () => {
	beforeEach(() => {
		resetInvitationMock();
		resetAnalysisMock();
		vi.clearAllMocks();
	});

	it.effect("refuses invitation (happy path)", () =>
		Effect.gen(function* () {
			yield* seedPendingInvitation();

			const result = yield* refuseInvitation(TOKEN);

			expect(result.invitation).toBeDefined();
			expect(result.invitation.status).toBe("refused");
			expect(result.invitation.inviteeUserId).toBeNull();
		}).pipe(Effect.provide(TestLayer)),
	);

	it.effect("fails with InvitationAlreadyRespondedError when already accepted", () =>
		Effect.gen(function* () {
			yield* seedPendingInvitation();

			// Accept first
			yield* acceptInvitation({ token: TOKEN, inviteeUserId: "some-user" });

			// Try to refuse
			const exit = yield* Effect.exit(refuseInvitation(TOKEN));

			expect(Exit.isFailure(exit)).toBe(true);
			if (Exit.isFailure(exit)) {
				const cause = exit.cause;
				const error = cause._tag === "Fail" ? cause.error : null;
				expect((error as { _tag: string })._tag).toBe("InvitationAlreadyRespondedError");
			}
		}).pipe(Effect.provide(TestLayer)),
	);

	it.effect("fails with InvitationNotFoundError for expired invitation", () =>
		Effect.gen(function* () {
			yield* seedExpiredInvitation();

			const exit = yield* Effect.exit(refuseInvitation(TOKEN));

			expect(Exit.isFailure(exit)).toBe(true);
			if (Exit.isFailure(exit)) {
				const cause = exit.cause;
				const error = cause._tag === "Fail" ? cause.error : null;
				expect((error as { _tag: string })._tag).toBe("InvitationNotFoundError");
			}
		}).pipe(Effect.provide(TestLayer)),
	);

	it.effect("fails with InvitationNotFoundError for non-existent token", () =>
		Effect.gen(function* () {
			const exit = yield* Effect.exit(refuseInvitation("non-existent-token"));

			expect(Exit.isFailure(exit)).toBe(true);
			if (Exit.isFailure(exit)) {
				const cause = exit.cause;
				const error = cause._tag === "Fail" ? cause.error : null;
				expect((error as { _tag: string })._tag).toBe("InvitationNotFoundError");
			}
		}).pipe(Effect.provide(TestLayer)),
	);
});
