import { ALL_FACETS } from "@workspace/domain/constants/big-five";
import { LIFE_DOMAINS } from "@workspace/domain/constants/life-domain";
import { describe, expect, it } from "vitest";
import {
	assessmentResults,
	bigfiveFacetNameEnum,
	conversation,
	conversationEvidence,
	conversationTypeEnum,
	evidenceDomainEnum,
	message,
	publicProfile,
} from "../drizzle/schema";

/**
 * Schema validation tests for two-tier architecture tables (Story 9.1)
 *
 * Verify table structure matches architecture spec before migration.
 */
describe("pgEnum values match domain constants", () => {
	it("evidence_domain enum includes all active LIFE_DOMAINS", () => {
		for (const domain of LIFE_DOMAINS) {
			expect(evidenceDomainEnum.enumValues).toContain(domain);
		}
	});

	it("bigfive_facet_name enum should have values from ALL_FACETS", () => {
		expect(bigfiveFacetNameEnum.enumValues).toEqual([...ALL_FACETS]);
	});

	it("evidence_domain should have exactly 6 values (solo removed in Story C.1)", () => {
		expect(evidenceDomainEnum.enumValues).toHaveLength(6);
		expect(evidenceDomainEnum.enumValues).not.toContain("solo");
	});

	it("bigfive_facet_name should have exactly 30 values", () => {
		expect(bigfiveFacetNameEnum.enumValues).toHaveLength(30);
	});
});

describe("Assessment Session Schema", () => {
	it("should have all required columns", () => {
		expect(conversation.id).toBeDefined();
		expect(conversation.userId).toBeDefined();
		expect(conversation.status).toBeDefined();
		expect(conversation.finalizationProgress).toBeDefined();
		expect(conversation.messageCount).toBeDefined();
		expect(conversation.createdAt).toBeDefined();
		expect(conversation.updatedAt).toBeDefined();
	});

	it("should have conversationType and metadata columns (Story 45-1)", () => {
		expect(conversation.conversationType).toBeDefined();
		expect(conversation.metadata).toBeDefined();
	});

	it("conversation_type enum should have ADR-39 values", () => {
		expect(conversationTypeEnum.enumValues).toEqual([
			"assessment",
			"extension",
			"coach",
			"journal",
			"career",
		]);
	});
});

describe("Assessment Message Schema", () => {
	it("should have core message columns", () => {
		expect(message.id).toBeDefined();
		expect(message.conversationId).toBeDefined();
		expect(message.role).toBeDefined();
		expect(message.content).toBeDefined();
		expect(message.createdAt).toBeDefined();
	});
});

describe("Conversation Evidence Schema (v2 — Story 18-1)", () => {
	it("should have all required columns", () => {
		expect(conversationEvidence.id).toBeDefined();
		expect(conversationEvidence.conversationId).toBeDefined();
		expect(conversationEvidence.messageId).toBeDefined();
		expect(conversationEvidence.bigfiveFacet).toBeDefined();
		expect(conversationEvidence.strength).toBeDefined();
		expect(conversationEvidence.confidence).toBeDefined();
		expect(conversationEvidence.domain).toBeDefined();
		expect(conversationEvidence.note).toBeDefined();
		expect(conversationEvidence.createdAt).toBeDefined();
	});
});

describe("Assessment Results Schema", () => {
	it("should have JSONB and TEXT columns", () => {
		expect(assessmentResults.id).toBeDefined();
		expect(assessmentResults.conversationId).toBeDefined();
		expect(assessmentResults.facets).toBeDefined();
		expect(assessmentResults.traits).toBeDefined();
		expect(assessmentResults.domainCoverage).toBeDefined();
		expect(assessmentResults.portrait).toBeDefined();
		expect(assessmentResults.createdAt).toBeDefined();
	});
});

describe("Public Profile Schema", () => {
	it("should have dual FK (conversation + result)", () => {
		expect(publicProfile.conversationId).toBeDefined();
		expect(publicProfile.assessmentResultId).toBeDefined();
	});
});
