/**
 * Config module exports - Infrastructure implementations
 */

// Re-export domain config types (interface + Context.Tag)
export { AppConfig, type AppConfigService } from "@workspace/domain";

// Live implementation (reads from environment)
export { AppConfigLive, loadConfig } from "./app-config.live.js";

// Test utilities
export {
  createTestAppConfig,
  AppConfigTestLive,
  defaultTestConfig,
} from "./app-config.testing.js";
