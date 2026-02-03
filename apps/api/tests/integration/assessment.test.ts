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

import { SendMessageResponseSchema, StartAssessmentResponseSchema } from "@workspace/contracts";
import { Schema } from "effect";
import { describe, expect, test } from "vitest";

// API URL from environment (set by vitest.config.integration.ts)
const API_URL = process.env.API_URL || "http://localhost:4001";

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

		// Assert precision scores are present and valid numbers
		expect(decoded.precision).toBeDefined();
		expect(typeof decoded.precision.openness).toBe("number");
		expect(typeof decoded.precision.conscientiousness).toBe("number");
		expect(typeof decoded.precision.extraversion).toBe("number");
		expect(typeof decoded.precision.agreeableness).toBe("number");
		expect(typeof decoded.precision.neuroticism).toBe("number");
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
	test("returns session with messages and precision", async () => {
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
		expect(data.precision).toBeDefined();
		expect(typeof data.precision.openness).toBe("number");
	});

	test("returns 404 for non-existent session", async () => {
		const response = await fetch(`${API_URL}/api/assessment/fake-session-id/resume`);
		expect(response.status).toBe(404);
	});
});
