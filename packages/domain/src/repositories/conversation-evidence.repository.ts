/**
 * Conversation Evidence Repository Interface
 *
 * Pure data access layer for conversation_evidence table.
 * No cap enforcement — caller responsibility (3-record cap enforced by use-case).
 *
 * Story 10.1
 */
import { Context, Effect } from "effect";
import * as S from "effect/Schema";
import type { FacetName } from "../constants/big-five";
import type { LifeDomain } from "../constants/life-domain";
import type { EvidenceInput } from "../types/evidence";

export class ConversationEvidenceError extends S.TaggedError<ConversationEvidenceError>()(
	"ConversationEvidenceError",
	{ message: S.String },
) {}

/** Input for saving conversation evidence — EvidenceInput + FK context */
export type ConversationEvidenceInput = EvidenceInput & {
	readonly sessionId: string;
	readonly messageId: string;
};

/** Full DB row returned from queries */
export interface ConversationEvidenceRecord {
	readonly id: string;
	readonly sessionId: string;
	readonly messageId: string;
	readonly bigfiveFacet: FacetName;
	readonly score: number;
	readonly confidence: number;
	readonly domain: LifeDomain;
	readonly createdAt: Date;
}

export class ConversationEvidenceRepository extends Context.Tag("ConversationEvidenceRepository")<
	ConversationEvidenceRepository,
	{
		readonly save: (
			records: ConversationEvidenceInput[],
		) => Effect.Effect<void, ConversationEvidenceError>;
		readonly findBySession: (
			sessionId: string,
		) => Effect.Effect<ConversationEvidenceRecord[], ConversationEvidenceError>;
		readonly countByMessage: (messageId: string) => Effect.Effect<number, ConversationEvidenceError>;
	}
>() {}
