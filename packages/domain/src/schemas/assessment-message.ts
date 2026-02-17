/**
 * Assessment Message Schemas — Character limit enforcement
 *
 * Defines the canonical message length constraint as a domain-level business rule.
 * Used by contracts (HTTP validation) and frontend (UI display).
 */

import { Schema as S } from "effect";

/** Maximum character length for a single assessment message */
export const ASSESSMENT_MESSAGE_MAX_LENGTH = 2000;

/**
 * Assessment message content schema.
 *
 * Constrains message text to a maximum of 2,000 characters.
 * Used by contracts for HTTP validation and frontend for UI display.
 */
export const AssessmentMessageContentSchema = S.String.pipe(
	S.maxLength(ASSESSMENT_MESSAGE_MAX_LENGTH),
);
