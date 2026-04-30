import {
	DatabaseError,
	LoggerRepository,
	type UserSummaryQuoteEntry,
	type UserSummaryRecord,
	type UserSummaryRefreshSource,
	UserSummaryRepository,
	type UserSummarySaveVersionInput,
	type UserSummaryThemeEntry,
} from "@workspace/domain";
import { Database } from "@workspace/infrastructure/context/database";
import { desc, eq, max } from "drizzle-orm";
import { Effect, Layer } from "effect";
import { userSummaryVersions } from "../db/drizzle/schema";

const REFRESH_SOURCES = [
	"assessment_completion",
	"conversation_extension",
	"subscriber_chat_completion",
	"monthly_checkin_aggregation",
] as const satisfies readonly UserSummaryRefreshSource[];

const parseRefreshSource = (raw: string): UserSummaryRefreshSource =>
	(REFRESH_SOURCES as readonly string[]).includes(raw)
		? (raw as UserSummaryRefreshSource)
		: "assessment_completion";

const mapThemes = (raw: unknown): readonly UserSummaryThemeEntry[] => {
	if (!Array.isArray(raw)) return [];
	return raw.filter(
		(t): t is UserSummaryThemeEntry =>
			t != null && typeof t === "object" && "theme" in t && "description" in t,
	) as UserSummaryThemeEntry[];
};

const mapQuotes = (raw: unknown): readonly UserSummaryQuoteEntry[] => {
	if (!Array.isArray(raw)) return [];
	return raw.filter(
		(q): q is UserSummaryQuoteEntry => q != null && typeof q === "object" && "quote" in q,
	) as UserSummaryQuoteEntry[];
};

type ContentShape = {
	readonly themes?: unknown;
	readonly quoteBank?: unknown;
	readonly summaryText?: string;
};

const mapRow = (row: typeof userSummaryVersions.$inferSelect): UserSummaryRecord => {
	const c = row.content as ContentShape;
	return {
		id: row.id,
		userId: row.userId,
		assessmentResultId: row.assessmentResultId,
		themes: mapThemes(c.themes),
		quoteBank: mapQuotes(c.quoteBank),
		summaryText: typeof c.summaryText === "string" ? c.summaryText : "",
		version: row.version,
		refreshSource: parseRefreshSource(row.refreshSource),
		generatedAt: row.generatedAt,
	};
};

export const UserSummaryDrizzleRepositoryLive = Layer.effect(
	UserSummaryRepository,
	Effect.gen(function* () {
		const db = yield* Database;
		const logger = yield* LoggerRepository;

		const toDatabaseError = (operation: string, error: unknown) => {
			logger.error("Database operation failed", {
				operation,
				error: error instanceof Error ? error.message : String(error),
			});
			return new DatabaseError({
				message: `Failed to ${operation}`,
			});
		};

		return UserSummaryRepository.of({
			saveVersion: (input: UserSummarySaveVersionInput) =>
				db
					.transaction((tx) =>
						Effect.gen(function* () {
							const agg = yield* tx
								.select({ v: max(userSummaryVersions.version) })
								.from(userSummaryVersions)
								.where(eq(userSummaryVersions.userId, input.userId))
								.pipe(Effect.mapError((e) => toDatabaseError("select max user summary version", e)));

							const maxV = agg[0]?.v;
							const nextVersion = typeof maxV === "number" ? maxV + 1 : Number(maxV ?? 0) + 1;

							const content = {
								themes: [...input.themes],
								quoteBank: [...input.quoteBank],
								summaryText: input.summaryText,
							};

							const rows = yield* tx
								.insert(userSummaryVersions)
								.values({
									userId: input.userId,
									assessmentResultId: input.assessmentResultId,
									version: nextVersion,
									content,
									refreshSource: input.refreshSource,
									tokenCount: input.tokenCount ?? null,
								})
								.returning()
								.pipe(Effect.mapError((e) => toDatabaseError("insert user summary version", e)));

							const inserted = rows[0];
							if (!inserted) {
								return yield* Effect.fail(
									new DatabaseError({ message: "Failed to insert user summary version" }),
								);
							}
							return mapRow(inserted);
						}),
					)
					.pipe(Effect.mapError((e) => toDatabaseError("save user summary version transaction", e))),

			getForAssessmentResult: (assessmentResultId) =>
				db
					.select()
					.from(userSummaryVersions)
					.where(eq(userSummaryVersions.assessmentResultId, assessmentResultId))
					.limit(1)
					.pipe(
						Effect.map((rows) => (rows[0] ? mapRow(rows[0]) : null)),
						Effect.mapError((e) => toDatabaseError("get user summary for assessment result", e)),
					),

			getCurrentForUser: (userId) =>
				db
					.select()
					.from(userSummaryVersions)
					.where(eq(userSummaryVersions.userId, userId))
					.orderBy(desc(userSummaryVersions.version))
					.limit(1)
					.pipe(
						Effect.map((rows) => (rows[0] ? mapRow(rows[0]) : null)),
						Effect.mapError((e) => toDatabaseError("get current user summary for user", e)),
					),
		});
	}),
);
