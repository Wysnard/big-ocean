/**
 * Health Endpoint Integration Tests
 *
 * Validates the /health endpoint against the Dockerized API.
 * This is the simplest integration test - validates server is running and migrations completed.
 *
 * Reference: Story 2.8 - Docker Setup for Integration Testing
 */

import { HealthCheckResponseSchema } from "@workspace/contracts";
import { Schema } from "effect";
import { describe, expect, test } from "vitest";

// API URL from environment (set by vitest.config.integration.ts)
const API_URL = process.env.API_URL || "http://localhost:4001";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

describe("GET /health", () => {
	test("returns 200 with status ok and valid schema", async () => {
		// Make real HTTP request to Dockerized API
		const response = await fetch(`${API_URL}/health`);

		// Assert HTTP status
		expect(response.status).toBe(200);
		expect(response.headers.get("content-type")).toContain("application/json");

		// Parse response body
		const data = await response.json();

		// Validate against contract schema
		// This will throw if the response doesn't match the expected schema
		const decoded = Schema.decodeUnknownSync(HealthCheckResponseSchema)(data);

		// Assert specific values
		expect(decoded.status).toBe("ok");
		expect(decoded.timestamp).toBeDefined();

		// Verify timestamp is a valid date (recent - within last minute)
		const timestampDate = new Date(decoded.timestamp.epochMillis);
		const now = new Date();
		const diffMs = Math.abs(now.getTime() - timestampDate.getTime());
		expect(diffMs).toBeLessThan(60_000); // Within 1 minute
	});

	test("validates Docker build and migrations ran successfully", async () => {
		// If health check passes, it means:
		// 1. Docker image built successfully
		// 2. PostgreSQL is running
		// 3. Database migrations completed
		// 4. Effect HTTP server started
		const response = await fetch(`${API_URL}/health`);

		// This test validates the entire Docker setup chain
		expect(response.ok).toBe(true);

		const data = await response.json();
		expect(data.status).toBe("ok");
	});

	test("includes CORS headers on all responses", async () => {
		// Make request with Origin header to trigger CORS
		const response = await fetch(`${API_URL}/health`, {
			headers: {
				Origin: FRONTEND_URL,
			},
		});

		// Verify CORS headers are present
		expect(response.headers.get("Access-Control-Allow-Origin")).toBe(FRONTEND_URL);
		expect(response.headers.get("Access-Control-Allow-Credentials")).toBe("true");
		expect(response.headers.get("Access-Control-Allow-Methods")).toContain("GET");
		expect(response.headers.get("Access-Control-Allow-Methods")).toContain("POST");
		expect(response.headers.get("Access-Control-Allow-Headers")).toContain("Content-Type");
		expect(response.headers.get("Access-Control-Max-Age")).toBe("86400");
	});

	test("handles OPTIONS preflight requests", async () => {
		// Make preflight request
		const response = await fetch(`${API_URL}/health`, {
			method: "OPTIONS",
			headers: {
				Origin: FRONTEND_URL,
				"Access-Control-Request-Method": "POST",
				"Access-Control-Request-Headers": "Content-Type",
			},
		});

		// Verify preflight response
		expect(response.status).toBe(204); // No Content
		expect(response.headers.get("Access-Control-Allow-Origin")).toBe(FRONTEND_URL);
		expect(response.headers.get("Access-Control-Allow-Methods")).toContain("POST");
		expect(response.headers.get("Access-Control-Allow-Headers")).toContain("Content-Type");
	});
});
