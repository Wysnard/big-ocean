/**
 * Tests for the Nerin Director mock repository.
 *
 * Verifies the mock follows the Layer.succeed pattern and returns
 * expected output shape.
 */
import { NerinDirectorRepository } from "@workspace/domain";
import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { NerinDirectorMockRepositoryLive } from "../nerin-director.mock.repository";

describe("Nerin Director Mock Repository", () => {
	const testInput = {
		systemPrompt: "test prompt",
		messages: [],
		coverageTargets: {
			primaryFacet: { facet: "imagination" as const, definition: "test def" },
			candidateDomains: [{ domain: "leisure" as const, definition: "test domain" }],
		},
		sessionId: "test-session",
	} as const;

	it("returns a deterministic three-beat brief", async () => {
		const program = Effect.gen(function* () {
			const repo = yield* NerinDirectorRepository;
			return yield* repo.generateBrief(testInput);
		});

		const result = await Effect.runPromise(
			program.pipe(Effect.provide(NerinDirectorMockRepositoryLive)),
		);

		expect(result.brief).toContain("Observation:");
		expect(result.brief).toContain("Connection:");
		expect(result.brief).toContain("Question:");
	});

	it("returns token usage", async () => {
		const program = Effect.gen(function* () {
			const repo = yield* NerinDirectorRepository;
			return yield* repo.generateBrief(testInput);
		});

		const result = await Effect.runPromise(
			program.pipe(Effect.provide(NerinDirectorMockRepositoryLive)),
		);

		expect(result.tokenUsage.input).toBeGreaterThan(0);
		expect(result.tokenUsage.output).toBeGreaterThan(0);
	});
});
