/**
 * Effect Schema Validation Tests
 *
 * Demonstrates @effect/schema usage for runtime validation and type safety.
 */

import * as S from "@effect/schema/Schema";
import { Effect, Either, Exit } from "effect";
import { describe, expect, it } from "vitest";

describe("Effect Schema Validation", () => {
	describe("Basic Schema Validation", () => {
		const PersonSchema = S.Struct({
			name: S.String,
			age: S.Number,
			email: S.String,
		});

		it("should validate valid data", () => {
			const data = { name: "Alice", age: 30, email: "alice@example.com" };
			const result = S.decodeUnknownEither(PersonSchema)(data);

			expect(Either.isRight(result)).toBe(true);
			if (Either.isRight(result)) {
				expect(result.right).toEqual(data);
			}
		});

		it("should reject invalid data", () => {
			const data = { name: "Alice", age: "thirty", email: "alice@example.com" };
			const result = S.decodeUnknownEither(PersonSchema)(data);

			expect(Either.isLeft(result)).toBe(true);
		});

		it("should reject missing required fields", () => {
			const data = { name: "Alice" };
			const result = S.decodeUnknownEither(PersonSchema)(data);

			expect(Either.isLeft(result)).toBe(true);
		});
	});

	describe("Personality Trait Schema", () => {
		const TraitScoreSchema = S.Number.pipe(
			S.filter((n) => n >= 0 && n <= 1, {
				message: () => "Trait score must be between 0 and 1",
			}),
		);

		const PersonalityTraitsSchema = S.Struct({
			openness: TraitScoreSchema,
			conscientiousness: TraitScoreSchema,
			extraversion: TraitScoreSchema,
			agreeableness: TraitScoreSchema,
			neuroticism: TraitScoreSchema,
		});

		it("should validate valid trait scores", () => {
			const traits = {
				openness: 0.65,
				conscientiousness: 0.8,
				extraversion: 0.45,
				agreeableness: 0.9,
				neuroticism: 0.3,
			};
			const result = S.decodeUnknownEither(PersonalityTraitsSchema)(traits);

			expect(Either.isRight(result)).toBe(true);
		});

		it("should reject scores outside 0-1 range", () => {
			const traits = {
				openness: 1.5, // Invalid: > 1
				conscientiousness: 0.8,
				extraversion: 0.45,
				agreeableness: 0.9,
				neuroticism: 0.3,
			};
			const result = S.decodeUnknownEither(PersonalityTraitsSchema)(traits);

			expect(Either.isLeft(result)).toBe(true);
		});

		it("should reject negative scores", () => {
			const traits = {
				openness: 0.65,
				conscientiousness: -0.2, // Invalid: < 0
				extraversion: 0.45,
				agreeableness: 0.9,
				neuroticism: 0.3,
			};
			const result = S.decodeUnknownEither(PersonalityTraitsSchema)(traits);

			expect(Either.isLeft(result)).toBe(true);
		});
	});

	describe("Session Schema", () => {
		const SessionIdSchema = S.String.pipe(
			S.filter((s) => s.startsWith("session_"), {
				message: () => "Session ID must start with 'session_'",
			}),
		);

		const SessionSchema = S.Struct({
			id: SessionIdSchema,
			userId: S.optional(S.String),
			createdAt: S.DateFromSelf, // Use DateFromSelf for Date instances
			precision: S.Struct({
				openness: S.Number,
				conscientiousness: S.Number,
				extraversion: S.Number,
				agreeableness: S.Number,
				neuroticism: S.Number,
			}),
		});

		it("should validate valid session", () => {
			const session = {
				id: "session_abc123",
				userId: "user_456",
				createdAt: new Date(),
				precision: {
					openness: 0.5,
					conscientiousness: 0.5,
					extraversion: 0.5,
					agreeableness: 0.5,
					neuroticism: 0.5,
				},
			};
			const result = S.decodeUnknownEither(SessionSchema)(session);

			expect(Either.isRight(result)).toBe(true);
		});

		it("should allow optional userId", () => {
			const session = {
				id: "session_xyz789",
				createdAt: new Date(),
				precision: {
					openness: 0.5,
					conscientiousness: 0.5,
					extraversion: 0.5,
					agreeableness: 0.5,
					neuroticism: 0.5,
				},
			};
			const result = S.decodeUnknownEither(SessionSchema)(session);

			expect(Either.isRight(result)).toBe(true);
		});

		it("should reject invalid session ID format", () => {
			const session = {
				id: "invalid_format", // Missing 'session_' prefix
				createdAt: new Date(),
				precision: {
					openness: 0.5,
					conscientiousness: 0.5,
					extraversion: 0.5,
					agreeableness: 0.5,
					neuroticism: 0.5,
				},
			};
			const result = S.decodeUnknownEither(SessionSchema)(session);

			expect(Either.isLeft(result)).toBe(true);
		});
	});

	describe("Async Validation with Effect", () => {
		const EmailSchema = S.String.pipe(
			S.filter((s) => s.includes("@"), {
				message: () => "Email must contain @",
			}),
		);

		it("should validate asynchronously with Effect", async () => {
			const validateEmail = (email: string) =>
				Effect.gen(function* () {
					const result = S.decodeUnknownEither(EmailSchema)(email);
					if (Either.isLeft(result)) {
						return yield* Effect.fail("Invalid email");
					}
					return result.right;
				});

			const validResult = await Effect.runPromise(validateEmail("test@example.com"));
			expect(validResult).toBe("test@example.com");

			// Test invalid email using runPromiseExit to check Exit result
			const invalidExit = await Effect.runPromiseExit(validateEmail("invalid-email"));
			expect(Exit.isFailure(invalidExit)).toBe(true);
		});
	});

	describe("Schema Transformations", () => {
		// Use DateFromNumber which is a built-in schema transformation
		const TimestampSchema = S.DateFromNumber;

		it("should transform number to Date", () => {
			const timestamp = Date.now();
			const result = S.decodeUnknownEither(TimestampSchema)(timestamp);

			expect(Either.isRight(result)).toBe(true);
			if (Either.isRight(result)) {
				expect(result.right).toBeInstanceOf(Date);
				expect(result.right.getTime()).toBe(timestamp);
			}
		});

		it("should encode Date back to number", () => {
			const date = new Date("2026-01-31T00:00:00Z");
			const encoded = S.encode(TimestampSchema)(date);

			expect(Either.isRight(encoded)).toBe(true);
			if (Either.isRight(encoded)) {
				expect(typeof encoded.right).toBe("number");
				expect(encoded.right).toBe(date.getTime());
			}
		});
	});
});
