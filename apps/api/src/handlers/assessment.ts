/**
 * Assessment Presenters (HTTP Handlers)
 *
 * Thin presenter layer that connects HTTP requests to use cases.
 * Handles HTTP request/response transformation only.
 * Business logic lives in use cases.
 *
 * Errors propagate directly from use cases (contract errors) to HTTP responses.
 * Effect/Platform automatically handles HTTP status codes via .addError() declarations.
 */

import { HttpApiBuilder, HttpServerResponse } from "@effect/platform";
import { DateTime, Effect } from "effect";
import { BigOceanApi } from "@workspace/contracts";
import {
  startAssessment,
  sendMessage,
  resumeSession,
  getResults,
} from "../use-cases/index.js";

export const AssessmentGroupLive = HttpApiBuilder.group(
  BigOceanApi,
  "assessment",
  (handlers) =>
    Effect.gen(function* () {
      return handlers
        .handle("start", ({ payload }) =>
          Effect.gen(function* () {
            // Call use case - errors propagate directly to HTTP
            const result = yield* startAssessment({
              userId: payload.userId,
            });

            // Format HTTP response
            return {
              sessionId: result.sessionId,
              createdAt: DateTime.unsafeMake(result.createdAt.getTime()),
            };
          }),
        )
        .handle("sendMessage", ({ payload }) =>
          Effect.gen(function* () {
            // Call use case - errors propagate directly to HTTP
            const result = yield* sendMessage({
              sessionId: payload.sessionId,
              message: payload.message,
            });

            // Format HTTP response
            return {
              response: result.response,
              precision: result.precision,
            };
          }),
        )
        .handle("getResults", ({ request }) =>
          Effect.gen(function* () {
            // Extract sessionId from URL path
            const url = new URL(request.url, "http://localhost");
            const pathParts = url.pathname.split("/");
            const sessionId = pathParts[pathParts.length - 2];

            if (!sessionId) {
              return HttpServerResponse.text("Missing session ID", {
                status: 400,
              });
            }

            // Call use case - errors propagate directly to HTTP
            const result = yield* getResults({ sessionId });

            // Format HTTP response
            return {
              oceanCode: result.oceanCode,
              archetypeName: result.archetypeName,
              traits: result.traits,
            };
          }),
        )
        .handle("resumeSession", ({ request }) =>
          Effect.gen(function* () {
            // Extract sessionId from URL path
            const url = new URL(request.url, "http://localhost");
            const pathParts = url.pathname.split("/");
            const sessionId = pathParts[pathParts.length - 2];

            if (!sessionId) {
              return HttpServerResponse.text("Missing session ID", {
                status: 400,
              });
            }

            // Call use case - errors propagate directly to HTTP
            const result = yield* resumeSession({ sessionId });

            // Format HTTP response
            return {
              messages: result.messages.map(
                (message: {
                  role: string;
                  content: string;
                  createdAt: Date;
                }) => ({
                  role: message.role as "user" | "assistant",
                  content: message.content,
                  timestamp: DateTime.unsafeMake(message.createdAt.getTime()),
                }),
              ),
              precision: result.precision,
            };
          }),
        );
    }),
);
