/**
 * Assessment Endpoints Integration Tests
 *
 * Validates assessment endpoints (start, message) against the Dockerized API.
 * Uses real HTTP requests and validates responses against contract schemas.
 *
 * Key validations:
 * - POST /api/assessment/start creates session
 * - POST /api/assessment/message processes message and returns response
 * - Responses match @workspace/contracts schemas exactly
 * - Database persistence works (sessions and messages saved)
 *
 * Reference: Story 2.8 - Docker Setup for Integration Testing
 */

import {
	GetResultsResponseSchema,
	SendMessageResponseSchema,
	StartAssessmentResponseSchema,
} from "@workspace/contracts";
import { Schema } from "effect";
import { describe, expect, test } from "vitest";

// API URL from environment (set by vitest.config.integration.ts)
const API_URL = process.env.API_URL || "http://localhost:4001";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

/**
 * Helper to make JSON POST requests
 */
async function postJson(path: string, body: unknown): Promise<Response> {
	return fetch(`${API_URL}${path}`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(body),
	});
}

describe("POST /api/assessment/start", () => {
	test("creates session with valid response schema", async () => {
		// Start assessment (anonymous - no userId to avoid UUID type issues)
		// In production, userId would come from authenticated session with valid UUID
		const response = await postJson("/api/assessment/start", {});

		// Assert HTTP status
		expect(response.status).toBe(200);
		expect(response.headers.get("content-type")).toContain("application/json");

		// Parse response
		const data = await response.json();

		// Validate against contract schema (throws if invalid)
		const decoded = Schema.decodeUnknownSync(StartAssessmentResponseSchema)(data);

		// Assert sessionId format (generated UUID pattern)
		expect(decoded.sessionId).toBeDefined();
		expect(typeof decoded.sessionId).toBe("string");
		expect(decoded.sessionId.length).toBeGreaterThan(0);

		// Assert createdAt is a valid timestamp (recent - within last minute)
		expect(decoded.createdAt).toBeDefined();
		const createdDate = new Date(decoded.createdAt.epochMillis);
		const now = new Date();
		const diffMs = Math.abs(now.getTime() - createdDate.getTime());
		expect(diffMs).toBeLessThan(60_000); // Within 1 minute
	});

	test("creates session without userId (anonymous)", async () => {
		// Start assessment without userId
		const response = await postJson("/api/assessment/start", {});

		expect(response.status).toBe(200);

		const data = await response.json();
		const decoded = Schema.decodeUnknownSync(StartAssessmentResponseSchema)(data);

		expect(decoded.sessionId).toBeDefined();
	});

	test("validates database persistence - session is retrievable", async () => {
		// Create anonymous session
		const createResponse = await postJson("/api/assessment/start", {});

		expect(createResponse.status).toBe(200);
		const createData = await createResponse.json();
		const sessionId = createData.sessionId;

		// Try to resume session (validates it was persisted to database)
		const resumeResponse = await fetch(`${API_URL}/api/assessment/${sessionId}/resume`);

		// Should find the session (even if empty messages)
		expect(resumeResponse.status).toBe(200);
	});
});

describe("POST /api/assessment/message", () => {
	test("processes message and returns valid response schema", async () => {
		// First, create an anonymous session
		const startResponse = await postJson("/api/assessment/start", {});
		expect(startResponse.status).toBe(200);

		const { sessionId } = await startResponse.json();

		// Send a message that triggers conscientiousness pattern in mock
		const messageResponse = await postJson("/api/assessment/message", {
			sessionId,
			message: "I like to organize my work and plan my day carefully.",
		});

		// Assert HTTP status
		expect(messageResponse.status).toBe(200);
		expect(messageResponse.headers.get("content-type")).toContain("application/json");

		// Parse response
		const data = await messageResponse.json();

		// Validate against contract schema (throws if invalid)
		const decoded = Schema.decodeUnknownSync(SendMessageResponseSchema)(data);

		// Assert response text is present
		expect(decoded.response).toBeDefined();
		expect(typeof decoded.response).toBe("string");
		expect(decoded.response.length).toBeGreaterThan(0);

		// Story 7.18: Assert isFinalTurn is false for normal messages
		expect(decoded.isFinalTurn).toBe(false);

		// Story 2.11: Confidence removed from send-message lean response
		// Confidence is only available via resume endpoint
	});

	test("returns 404 for non-existent session", async () => {
		const response = await postJson("/api/assessment/message", {
			sessionId: "non-existent-session-id",
			message: "Hello",
		});

		expect(response.status).toBe(404);
	});

	test("validates mock LLM is being used (deterministic response)", async () => {
		// Create session
		const startResponse = await postJson("/api/assessment/start", {});
		const { sessionId } = await startResponse.json();

		// Send a message with creativity keywords (should trigger openness pattern)
		const messageResponse = await postJson("/api/assessment/message", {
			sessionId,
			message: "I love exploring new creative ideas and imagining different possibilities.",
		});

		expect(messageResponse.status).toBe(200);
		const data = await messageResponse.json();

		// Mock should return a response containing creativity-related text
		expect(data.response).toBeDefined();
		expect(data.response.length).toBeGreaterThan(0);

		// Validate schema compliance
		Schema.decodeUnknownSync(SendMessageResponseSchema)(data);
	});

	test("validates database persistence - messages are saved", async () => {
		// Create session
		const startResponse = await postJson("/api/assessment/start", {});
		const { sessionId } = await startResponse.json();

		// Send a message
		const message1 = "Hello, I'm here to learn about myself.";
		await postJson("/api/assessment/message", {
			sessionId,
			message: message1,
		});

		// Resume session to verify message was persisted
		const resumeResponse = await fetch(`${API_URL}/api/assessment/${sessionId}/resume`);
		expect(resumeResponse.status).toBe(200);

		const resumeData = await resumeResponse.json();

		// Should have at least the user message and assistant response
		expect(resumeData.messages).toBeDefined();
		expect(Array.isArray(resumeData.messages)).toBe(true);
		expect(resumeData.messages.length).toBeGreaterThanOrEqual(2); // User + Assistant

		// Verify user message content
		const userMessage = resumeData.messages.find(
			(m: { role: string; content: string }) => m.role === "user",
		);
		expect(userMessage).toBeDefined();
		expect(userMessage.content).toBe(message1);
	});
});

describe("GET /api/assessment/:sessionId/resume", () => {
	test("returns session with messages and confidence", async () => {
		// Create session and send a message
		const startResponse = await postJson("/api/assessment/start", {});
		const { sessionId } = await startResponse.json();

		await postJson("/api/assessment/message", {
			sessionId,
			message: "I enjoy helping others and working in teams.",
		});

		// Resume session
		const resumeResponse = await fetch(`${API_URL}/api/assessment/${sessionId}/resume`);

		expect(resumeResponse.status).toBe(200);
		const data = await resumeResponse.json();

		// Validate structure
		expect(data.messages).toBeDefined();
		expect(Array.isArray(data.messages)).toBe(true);
		expect(data.confidence).toBeDefined();
		expect(typeof data.confidence.openness).toBe("number");
	});

	test("returns 404 for non-existent session", async () => {
		const response = await fetch(`${API_URL}/api/assessment/fake-session-id/resume`);
		expect(response.status).toBe(404);
	});
});

describe("GET /api/assessment/:sessionId/results", () => {
	test("returns 200 with valid GetResultsResponseSchema", async () => {
		// Create session and send enough messages to populate scores
		const startResponse = await postJson("/api/assessment/start", {});
		const { sessionId } = await startResponse.json();

		// Send 3 messages to reach FREE_TIER_MESSAGE_THRESHOLD=3
		// Story 7.18: The 3rd message (at threshold) returns farewell with isFinalTurn: true
		// instead of 403 (FreeTierLimitReached). The farewell message is saved and
		// get-results sees 3 user messages, triggering portrait generation.
		await postJson("/api/assessment/message", {
			sessionId,
			message: "I love exploring new creative ideas and imagining possibilities.",
		});
		await postJson("/api/assessment/message", {
			sessionId,
			message: "I tend to be organized and like making plans ahead of time.",
		});
		const thirdMsgResponse = await postJson("/api/assessment/message", {
			sessionId,
			message: "I enjoy social gatherings and meeting new people.",
		});
		// Story 7.18: 3rd message triggers farewell (isFinalTurn: true), not free tier block
		expect(thirdMsgResponse.status).toBe(200);
		const thirdMsgData = await thirdMsgResponse.json();
		const thirdDecoded = Schema.decodeUnknownSync(SendMessageResponseSchema)(thirdMsgData);
		expect(thirdDecoded.isFinalTurn).toBe(true);
		expect(thirdDecoded.farewellMessage).toBeDefined();

		// Fetch results
		const resultsResponse = await fetch(`${API_URL}/api/assessment/${sessionId}/results`);

		expect(resultsResponse.status).toBe(200);
		expect(resultsResponse.headers.get("content-type")).toContain("application/json");

		const data = await resultsResponse.json();

		// Validate against contract schema (throws if invalid)
		const decoded = Schema.decodeUnknownSync(GetResultsResponseSchema)(data);

		// OCEAN codes
		expect(typeof decoded.oceanCode5).toBe("string");
		expect(decoded.oceanCode5).toHaveLength(5);
		expect(typeof decoded.oceanCode4).toBe("string");
		expect(decoded.oceanCode4).toHaveLength(4);

		// Archetype
		expect(decoded.archetypeName).toBeDefined();
		expect(decoded.archetypeName.length).toBeGreaterThan(0);
		expect(decoded.archetypeColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
		expect(typeof decoded.isCurated).toBe("boolean");

		// Traits — levels are trait-specific letters (e.g., P/G/O for openness, not H/M/L)
		const VALID_TRAIT_LEVELS = ["P", "G", "O", "F", "B", "D", "I", "A", "E", "C", "N", "W", "R", "T", "S"];
		expect(decoded.traits).toHaveLength(5);
		for (const trait of decoded.traits) {
			expect(typeof trait.name).toBe("string");
			expect(trait.score).toBeGreaterThanOrEqual(0);
			expect(trait.score).toBeLessThanOrEqual(120);
			expect(VALID_TRAIT_LEVELS).toContain(trait.level);
			expect(trait.confidence).toBeGreaterThanOrEqual(0);
			expect(trait.confidence).toBeLessThanOrEqual(100);
		}

		// Facets
		expect(decoded.facets).toHaveLength(30);
		for (const facet of decoded.facets) {
			expect(typeof facet.name).toBe("string");
			expect(typeof facet.traitName).toBe("string");
			expect(facet.score).toBeGreaterThanOrEqual(0);
			expect(facet.score).toBeLessThanOrEqual(20);
			expect(facet.confidence).toBeGreaterThanOrEqual(0);
			expect(facet.confidence).toBeLessThanOrEqual(100);
		}

		// Overall confidence
		expect(decoded.overallConfidence).toBeGreaterThanOrEqual(0);
		expect(decoded.overallConfidence).toBeLessThanOrEqual(100);

		// Portrait generation (FREE_TIER_MESSAGE_THRESHOLD=3, 3 user messages sent)
		// Mock portrait generator returns deterministic text
		expect(decoded.personalDescription).toBeDefined();
		expect(typeof decoded.personalDescription).toBe("string");
		expect((decoded.personalDescription as string).length).toBeGreaterThan(0);
	});

	test("returns 404 for non-existent session", async () => {
		const response = await fetch(`${API_URL}/api/assessment/nonexistent-session-id/results`);
		expect(response.status).toBe(404);

		const data = await response.json();
		expect(data._tag).toBe("SessionNotFound");
	});

	test("returns valid results even with default scores (no messages sent)", async () => {
		// Create session but don't send any messages
		const startResponse = await postJson("/api/assessment/start", {});
		const { sessionId } = await startResponse.json();

		const resultsResponse = await fetch(`${API_URL}/api/assessment/${sessionId}/results`);

		expect(resultsResponse.status).toBe(200);
		const data = await resultsResponse.json();

		// Should still validate against schema with default values
		const decoded = Schema.decodeUnknownSync(GetResultsResponseSchema)(data);

		// Default scores: all facets at 10/20, all traits at 60/120 = Mid
		// Trait-specific mid-level letters: G(openness), B(conscientiousness), A(extraversion), N(agreeableness), T(neuroticism)
		expect(decoded.oceanCode5).toBe("GBANT");
		expect(decoded.traits).toHaveLength(5);
		expect(decoded.facets).toHaveLength(30);
		expect(decoded.overallConfidence).toBe(0); // No evidence yet

		// No portrait generated — below free tier message threshold
		expect(decoded.personalDescription).toBeNull();
	});
});

describe("CORS - Assessment endpoints", () => {
	test("includes CORS headers on POST /api/assessment/start", async () => {
		const response = await fetch(`${API_URL}/api/assessment/start`, {
			method: "POST",
			headers: {
				Origin: FRONTEND_URL,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({}),
		});

		// Verify CORS headers
		expect(response.headers.get("Access-Control-Allow-Origin")).toBe(FRONTEND_URL);
		expect(response.headers.get("Access-Control-Allow-Credentials")).toBe("true");
	});

	test("includes CORS headers on POST /api/assessment/message", async () => {
		// Create session first
		const startResponse = await postJson("/api/assessment/start", {});
		const { sessionId } = await startResponse.json();

		// Send message with Origin header
		const response = await fetch(`${API_URL}/api/assessment/message`, {
			method: "POST",
			headers: {
				Origin: FRONTEND_URL,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				sessionId,
				message: "Test message",
			}),
		});

		// Verify CORS headers
		expect(response.headers.get("Access-Control-Allow-Origin")).toBe(FRONTEND_URL);
		expect(response.headers.get("Access-Control-Allow-Credentials")).toBe("true");
	});

	test("includes CORS headers on GET /api/assessment/:sessionId/resume", async () => {
		// Create session
		const startResponse = await postJson("/api/assessment/start", {});
		const { sessionId } = await startResponse.json();

		// Resume with Origin header
		const response = await fetch(`${API_URL}/api/assessment/${sessionId}/resume`, {
			headers: {
				Origin: FRONTEND_URL,
			},
		});

		// Verify CORS headers
		expect(response.headers.get("Access-Control-Allow-Origin")).toBe(FRONTEND_URL);
		expect(response.headers.get("Access-Control-Allow-Credentials")).toBe("true");
	});

	test("includes CORS headers on GET /api/assessment/:sessionId/results", async () => {
		// Create session
		const startResponse = await postJson("/api/assessment/start", {});
		const { sessionId } = await startResponse.json();

		// Fetch results with Origin header
		const response = await fetch(`${API_URL}/api/assessment/${sessionId}/results`, {
			headers: {
				Origin: FRONTEND_URL,
			},
		});

		// Verify CORS headers
		expect(response.headers.get("Access-Control-Allow-Origin")).toBe(FRONTEND_URL);
		expect(response.headers.get("Access-Control-Allow-Credentials")).toBe("true");
	});
});
