/**
 * Config module exports - Infrastructure implementations
 */

// Re-export domain config types (interface + Context.Tag)
export { AppConfig, type AppConfigService } from "@workspace/domain";
// Test utilities
export {
	AppConfigTestLive,
	createTestAppConfig,
	defaultTestConfig,
} from "../utils/test/app-config.testing";
// Live implementation (reads from environment)
export { AppConfigLive, loadConfig } from "./app-config.live";
