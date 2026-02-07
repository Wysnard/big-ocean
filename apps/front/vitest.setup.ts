import { vi, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
// Adds DOM matchers like toBeInTheDocument, toHaveStyle, toHaveClass, toHaveAttribute
import '@testing-library/jest-dom/vitest'

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock scrollIntoView for jsdom
Element.prototype.scrollIntoView = vi.fn()
