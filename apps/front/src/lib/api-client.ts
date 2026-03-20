/**
 * Effect HTTP API Client (Story 30-2)
 *
 * Type-safe API client derived from @workspace/contracts.
 * Uses FetchHttpClient with credentials: "include" for cookie-based auth.
 */

import { FetchHttpClient, HttpApiClient } from "@effect/platform";
import { BigOceanApi } from "@workspace/contracts";
import { Effect, Layer } from "effect";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

/**
 * Fetch layer with credentials: "include" for cookie-based auth.
 */
const FetchLive = FetchHttpClient.layer.pipe(
	Layer.provide(Layer.succeed(FetchHttpClient.RequestInit, { credentials: "include" })),
);

/**
 * Run an Effect program that requires HttpClient, providing the fetch layer.
 */
export const runApi = <A, E>(effect: Effect.Effect<A, E, never>) =>
	Effect.runPromise(effect) as Promise<A>;

/**
 * Create a typed API client Effect. Yield this inside Effect.gen to get
 * the fully-typed client with all endpoint methods.
 */
export const makeApiClient = HttpApiClient.make(BigOceanApi, {
	baseUrl: API_URL,
}).pipe(Effect.provide(FetchLive));
