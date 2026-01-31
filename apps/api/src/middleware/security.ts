/**
 * Security Headers Middleware
 *
 * Implements security best practices:
 * - HSTS: Enforce HTTPS
 * - X-Content-Type-Options: Prevent MIME sniffing
 * - X-Frame-Options: Clickjacking protection
 * - X-XSS-Protection: XSS protection
 * - Content-Security-Policy: Basic CSP
 */

import type { Request, Response, NextFunction } from "express";

export function securityHeaders(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // HSTS: Enforce HTTPS (only in production)
  if (process.env.NODE_ENV === "production") {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains"
    );
  }

  // Prevent MIME type sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");

  // Clickjacking protection
  res.setHeader("X-Frame-Options", "DENY");

  // XSS protection (for older browsers)
  res.setHeader("X-XSS-Protection", "1; mode=block");

  // Content Security Policy - only for HTML responses, not JSON/API
  if (!req.path.startsWith("/api/")) {
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
    );
  }

  next();
}
