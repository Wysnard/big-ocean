import { Effect, Layer } from "effect";
import { describe, expect, it } from "vitest";
import { NerinDirectorError, NerinDirectorRepository } from "../nerin-director.repository";

describe("NerinDirectorRepository", () => {
	it("is a valid Context.Tag", () => {
		expect(NerinDirectorRepository.key).toBe("NerinDirectorRepository");
	});

	it("NerinDirectorError has correct tag", () => {
		const error = new NerinDirectorError({ message: "test", sessionId: "s1" });
		expect(error._tag).toBe("NerinDirectorError");
		expect(error.message).toBe("test");
		expect(error.sessionId).toBe("s1");
	});

	it("can be implemented with Layer.succeed and called", async () => {
		const testLayer = Layer.succeed(
			NerinDirectorRepository,
			NerinDirectorRepository.of({
				generateBrief: (_input) =>
					Effect.succeed({
						brief: "Test brief",
						tokenUsage: { input: 100, output: 50 },
					}),
			}),
		);

		const program = Effect.gen(function* () {
			const repo = yield* NerinDirectorRepository;
			return yield* repo.generateBrief({
				systemPrompt: "test prompt",
				messages: [],
				coverageTargets: {
					primaryFacet: { facet: "imagination", definition: "test def" },
					candidateDomains: [{ domain: "leisure", definition: "test domain def" }],
				},
				sessionId: "test-session",
			});
		});

		const result = await Effect.runPromise(program.pipe(Effect.provide(testLayer)));
		expect(result.brief).toBe("Test brief");
		expect(result.tokenUsage.input).toBe(100);
		expect(result.tokenUsage.output).toBe(50);
	});

	it("can propagate NerinDirectorError", async () => {
		const errorLayer = Layer.succeed(
			NerinDirectorRepository,
			NerinDirectorRepository.of({
				generateBrief: (_input) =>
					Effect.fail(
						new NerinDirectorError({
							message: "LLM failed",
							sessionId: "s1",
						}),
					),
			}),
		);

		const program = Effect.gen(function* () {
			const repo = yield* NerinDirectorRepository;
			return yield* repo.generateBrief({
				systemPrompt: "test",
				messages: [],
				coverageTargets: {
					primaryFacet: { facet: "imagination", definition: "test" },
					candidateDomains: [{ domain: "work", definition: "test" }],
				},
				sessionId: "s1",
			});
		});

		const exit = await Effect.runPromiseExit(program.pipe(Effect.provide(errorLayer)));
		expect(exit._tag).toBe("Failure");
	});
});
