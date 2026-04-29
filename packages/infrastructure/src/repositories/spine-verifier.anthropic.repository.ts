/**
 * Spine Verifier — Anthropic Messages API (ADR-51 Stage B).
 */

import Anthropic from "@anthropic-ai/sdk";
import {
	AppConfig,
	buildSpineVerifierUserPrompt,
	PortraitGenerationError,
	type SpineVerifierInput,
	SpineVerifierRepository,
} from "@workspace/domain";
import { LoggerRepository } from "@workspace/domain/repositories/logger.repository";
import type { SpineVerification } from "@workspace/domain/types/spine-verification";
import { Effect, Layer, Redacted } from "effect";
import { parseSpineVerificationJson, unwrapJsonFence } from "./portrait-spine-json";

export const SpineVerifierAnthropicRepositoryLive = Layer.effect(
	SpineVerifierRepository,
	Effect.gen(function* () {
		const config = yield* AppConfig;
		const logger = yield* LoggerRepository;

		return SpineVerifierRepository.of({
			verifySpineBrief: (input: SpineVerifierInput) =>
				Effect.gen(function* () {
					const briefJson = JSON.stringify(input.brief, null, 2);
					const userPrompt = buildSpineVerifierUserPrompt(briefJson);
					const client = new Anthropic({ apiKey: Redacted.value(config.anthropicApiKey) });

					logger.info("Portrait pipeline: spine verification started", {
						sessionId: input.sessionId,
						model: config.portraitSpineVerifierModelId,
					});

					const raw = yield* Effect.tryPromise({
						try: async () => {
							const response = await client.messages.create({
								model: config.portraitSpineVerifierModelId,
								max_tokens: 4096,
								temperature: 0,
								system:
									"You are Stage B (Spine Verifier). Reply with ONLY valid JSON — no markdown, no commentary.",
								messages: [{ role: "user", content: userPrompt }],
							});
							const text = response.content.map((b) => (b.type === "text" ? b.text : "")).join("");
							return unwrapJsonFence(text);
						},
						catch: (e) =>
							new PortraitGenerationError({
								sessionId: input.sessionId,
								message: "Spine verification failed",
								cause: e instanceof Error ? e.message : String(e),
								stage: "verify",
							}),
					});

					let verification: SpineVerification;
					try {
						verification = parseSpineVerificationJson(raw, input.sessionId);
					} catch (e) {
						return yield* Effect.fail(
							new PortraitGenerationError({
								sessionId: input.sessionId,
								message: e instanceof Error ? e.message : "SpineVerification validation failed",
								stage: "verify",
							}),
						);
					}

					logger.info("Portrait pipeline: spine verification completed", {
						sessionId: input.sessionId,
						passed: verification.passed,
					});

					return verification;
				}),
		});
	}),
);
