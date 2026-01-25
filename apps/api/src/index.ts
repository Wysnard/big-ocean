import "dotenv/config";
import { createServer } from "node:http";
import { RPCHandler } from "@orpc/server/node";
import { CORSPlugin } from "@orpc/server/plugins";
import { onError } from "@orpc/server";
import router from "./router.js";
import logger from "./logger.js";

// Logging interceptor middleware
const loggingInterceptor = ({ context, input, next, path }: any) => {
  const startTime = Date.now();
  const procedurePath = path?.join(".") || "unknown";
  const contextLogger = context?.logger;

  contextLogger?.info(`[RPC] Procedure called: ${procedurePath}`, {
    procedure: procedurePath,
    hasInput: !!input,
    inputKeys: input ? Object.keys(input).join(", ") : "none",
    inputPreview:
      input && typeof input === "object"
        ? JSON.stringify(input).substring(0, 200)
        : String(input),
  });

  return next().then((result: any) => {
    const duration = Date.now() - startTime;
    contextLogger?.debug(`[RPC] Procedure completed: ${procedurePath}`, {
      procedure: procedurePath,
      duration: `${duration}ms`,
      hasResult: !!result,
    });
    return result;
  });
};

const handler = new RPCHandler(router, {
  plugins: [new CORSPlugin()],
  interceptors: [
    loggingInterceptor,
    onError((error) => {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`[RPC] Error`, {
        message,
        error: error instanceof Error ? error.stack : String(error),
      });
    }),
  ],
});

const server = createServer(async (req, res) => {
  const method = req.method || "UNKNOWN";
  const url = req.url || "UNKNOWN";
  const startTime = Date.now();

  // Health check endpoint (for Railway deployment validation)
  if (url === "/health" && method === "GET") {
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ status: "ok" }));
    logger.debug(`[HTTP] Health check`, { duration: `${Date.now() - startTime}ms` });
    return;
  }

  logger.http(`[HTTP] ${method} ${url}`, {
    method,
    path: url,
    userAgent: req.headers["user-agent"] || "unknown",
  });

  const result = await handler.handle(req, res, {
    context: { headers: req.headers, logger },
  });

  const duration = Date.now() - startTime;
  const statusCode = res.statusCode || 200;

  if (!result.matched) {
    res.statusCode = 404;
    logger.warn(`[HTTP] 404 - No procedure matched`, {
      method,
      path: url,
      duration: `${duration}ms`,
    });
    res.end("No procedure matched");
  } else {
    logger.debug(`[HTTP] Response sent`, {
      method,
      path: url,
      statusCode,
      duration: `${duration}ms`,
    });
  }
});

const host = process.env.HOST || "0.0.0.0";
const port = Number(process.env.PORT || 4000);

server.listen(port, host, () => {
  logger.info(`Server listening on http://${host}:${port}`);
});

server.on("error", (error) => {
  logger.error(`Server error: ${error.message}`, { error });
});

process.on("unhandledRejection", (reason) => {
  logger.error(`Unhandled Rejection: ${reason}`);
});

process.on("uncaughtException", (error) => {
  logger.error(`Uncaught Exception: ${error.message}`, { error });
  process.exit(1);
});
