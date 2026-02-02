import { vi, afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock scrollIntoView for jsdom
Element.prototype.scrollIntoView = vi.fn();
