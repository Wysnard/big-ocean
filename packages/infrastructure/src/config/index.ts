/**
 * Config module exports - Infrastructure implementations
 */

// Re-export domain config types
export {
  AppConfig,
  AppConfigLive,
  loadConfig,
  type AppConfigService,
} from "@workspace/domain";

// Test utilities
export {
  createTestAppConfig,
  AppConfigTestLive,
  defaultTestConfig,
} from "./app-config.testing.js";
