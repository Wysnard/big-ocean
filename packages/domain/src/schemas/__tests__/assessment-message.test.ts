/**
 * Assessment Message Schema Tests (Story 4.8)
 *
 * Validates the AssessmentMessageContentSchema and ASSESSMENT_MESSAGE_MAX_LENGTH constant.
 */

import { ASSESSMENT_MESSAGE_MAX_LENGTH, AssessmentMessageContentSchema } from "@workspace/domain";
import { Schema as S } from "effect";
import { describe, expect, it } from "vitest";

describe("AssessmentMessageContentSchema", () => {
	const decode = S.decodeEither(AssessmentMessageContentSchema);

	it("exports ASSESSMENT_MESSAGE_MAX_LENGTH as 2000", () => {
		expect(ASSESSMENT_MESSAGE_MAX_LENGTH).toBe(2000);
	});

	it("accepts an empty string", () => {
		const result = decode("");
		expect(result._tag).toBe("Right");
	});

	it("accepts a short message", () => {
		const result = decode("Hello, Nerin!");
		expect(result._tag).toBe("Right");
	});

	it("accepts a string of exactly 2000 characters", () => {
		const result = decode("a".repeat(2000));
		expect(result._tag).toBe("Right");
	});

	it("rejects a string of 2001 characters", () => {
		const result = decode("a".repeat(2001));
		expect(result._tag).toBe("Left");
	});

	it("rejects a very long string", () => {
		const result = decode("a".repeat(10000));
		expect(result._tag).toBe("Left");
	});
});
