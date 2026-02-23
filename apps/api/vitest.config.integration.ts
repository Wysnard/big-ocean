// Vitest Configuration for Integration Tests
//
// Extends base config with integration-specific settings:
// - Global setup/teardown for Docker Compose lifecycle
// - Different test file patterns (tests/integration/*.test.ts)
// - Environment variables for test API URL
// - Longer timeouts for Docker operations
//
// Reference: Story 2.8 - Docker Setup for Integration Testing

import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globals: true,
		environment: "node",
		// Only run integration tests
		include: ["tests/integration/**/*.test.ts"],
		// Exclude unit tests
		exclude: ["src/**/*.test.ts"],
		// Global setup/teardown for Docker lifecycle
		globalSetup: ["./scripts/integration-setup.ts"],
		globalTeardown: ["./scripts/integration-teardown.ts"],
		// Timeout for Docker-based tests (30 seconds per test)
		testTimeout: 30_000,
		// Environment variables for tests
		env: {
			// API URL for integration tests (matches compose.test.yaml port mapping)
			API_URL: "http://localhost:4001",
		},
		// Coverage not needed for integration tests (they test the whole stack)
		coverage: {
			enabled: false,
		},
		// Fail fast on first error for integration tests
		bail: 1,
		// Sequential execution for integration tests (avoid race conditions)
		sequence: {
			concurrent: false,
		},
	},
});
