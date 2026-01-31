import "dotenv/config";
import express, { Request, Response } from "express";
import cors from "cors";
import logger from "./logger.js";
import { auth } from "./setup.js";
import { securityHeaders } from "./middleware/security.js";

/**
 * Express App Setup
 */
const app = express();
const port = Number(process.env.PORT || 4000);

// Middleware
// CORS must come before security headers to set Access-Control headers first
const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:3001", // TanStack Start dev server (port 3001)
  "http://localhost:3000", // Fallback for legacy port
  "https://*.railway.app", // Railway preview deployments
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, Postman, curl)
    if (!origin) return callback(null, true);

    // Check if origin matches any allowed origin (including wildcards)
    const isAllowed = allowedOrigins.some(allowed => {
      if (allowed.includes("*")) {
        const regex = new RegExp(allowed.replace("*", ".*"));
        return regex.test(origin);
      }
      return allowed === origin;
    });

    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true,
}));

app.use(securityHeaders); // Security headers after CORS
app.use(express.json());

/**
 * Health Check Endpoint
 */
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok" });
  logger.debug("[HTTP] Health check passed");
});

/**
 * Better Auth Middleware
 *
 * Better Auth automatically handles all /api/auth/* routes.
 * Available endpoints:
 * - POST /api/auth/sign-up/email (signup)
 * - POST /api/auth/sign-in/email (signin)
 * - POST /api/auth/sign-out (signout)
 * - GET  /api/auth/get-session (get session)
 *
 * See: https://www.better-auth.com/docs/concepts/session-management
 */
app.use("/api/auth", async (req: Request, res: Response, next) => {
  try {
    // Convert Express request to Web API Request
    const url = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
    const headers = new Headers();
    Object.entries(req.headers).forEach(([key, value]) => {
      if (value) {
        headers.set(key, Array.isArray(value) ? value.join(", ") : value);
      }
    });

    const webRequest = new globalThis.Request(url, {
      method: req.method,
      headers,
      body: req.method !== "GET" && req.method !== "HEAD" ? JSON.stringify(req.body) : undefined,
    });

    // Handle Better Auth request
    const response = await auth.handler(webRequest);

    // Convert Web API Response to Express response
    res.status(response.status);
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    const body = await response.text();
    res.send(body);
  } catch (error: any) {
    logger.error("Better Auth handler error", { error: error.message });
    next(error);
  }
});

/**
 * Assessment Routes
 *
 * TODO: Implement assessment endpoints using Effect-ts for business logic
 * Example endpoints:
 * - POST /api/assessment/start
 * - POST /api/assessment/message
 * - GET  /api/assessment/:sessionId
 * - GET  /api/assessment/:sessionId/results
 */
app.post("/api/assessment/start", async (req: Request, res: Response) => {
  logger.info("Start assessment request");
  res.json({
    message: "Assessment start endpoint - coming soon",
    note: "Will use Effect-ts for business logic",
  });
});

/**
 * Profile Routes
 *
 * TODO: Implement profile endpoints using Effect-ts for business logic
 * Example endpoints:
 * - GET  /api/profile/:userId
 * - POST /api/profile/compare
 * - GET  /api/profile/similar
 */
app.get("/api/profile/:userId", async (req: Request, res: Response) => {
  logger.info("Get profile request", { userId: req.params.userId });
  res.json({
    message: "Profile endpoint - coming soon",
    note: "Will use Effect-ts for business logic",
  });
});

/**
 * Start Server
 */
app.listen(port, () => {
  logger.info(`Server started on http://0.0.0.0:${port}`);
  logger.info(`Better Auth routes: /api/auth/* (sign-up, sign-in, sign-out, get-session)`);
  logger.info(`Assessment routes: /api/assessment/* (start, message, results)`);
  logger.info(`Profile routes: /api/profile/* (get, compare, similar)`);
  logger.info(`Health check: GET /health`);
  logger.info(`Frontend CORS enabled for: ${process.env.FRONTEND_URL || "http://localhost:3000"}`);
});

/**
 * Error Handlers
 */
process.on("unhandledRejection", (reason) => {
  logger.error(`Unhandled Rejection: ${reason}`);
});

process.on("uncaughtException", (error) => {
  logger.error(`Uncaught Exception: ${error.message}`, { error });
  process.exit(1);
});
