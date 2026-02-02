/**
 * Universal Vitest Setup
 *
 * This setup file works for both frontend (jsdom) and backend (node) tests.
 */

import { vi } from "vitest";

// Mock scrollIntoView for jsdom tests (not available in jsdom by default)
// This will only apply when Element is defined (i.e., in jsdom environment)
if (typeof Element !== "undefined") {
  Element.prototype.scrollIntoView = vi.fn();
}
