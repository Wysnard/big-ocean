/**
 * Effect-ts RPC Client
 *
 * Type-safe RPC client for frontend-backend communication.
 * Connects to the backend RPC endpoint at /rpc with NDJSON serialization.
 *
 * Based on the official @effect/rpc pattern.
 */

import { RpcClient, RpcResolver, RpcSerialization } from "@effect/rpc";
import { FetchHttpClient } from "@effect/platform";
import { Effect, Layer } from "effect";
import { BigOceanRpcs } from "@workspace/contracts";

/**
 * Get the API base URL from environment variables
 * Defaults to localhost:4000 for development
 */
const getApiBaseUrl = (): string => {
  // In Vite/TanStack Start, use import.meta.env for environment variables
  if (typeof import.meta !== "undefined" && import.meta.env) {
    return import.meta.env.VITE_API_URL || "http://localhost:4000";
  }
  // Fallback for server-side rendering
  return process.env.API_URL || "http://localhost:4000";
};

/**
 * RPC Protocol Layer
 *
 * Configures HTTP protocol with fetch client and NDJSON serialization.
 */
const ProtocolLayer = RpcClient.layerProtocolHttp({
  url: `${getApiBaseUrl()}/rpc`,
}).pipe(
  Layer.provide(FetchHttpClient.layer),
  Layer.provide(RpcSerialization.layerNdjson)
);

/**
 * Convenience function to call an RPC procedure
 *
 * Simplifies RPC calls for React hooks by handling Effect execution.
 *
 * @example
 * ```typescript
 * import { callRpc } from "./rpc-client";
 * import { StartAssessmentRpc } from "@workspace/contracts";
 *
 * const result = await callRpc(StartAssessmentRpc, { userId: "123" });
 * ```
 */
export const callRpc = async (rpc: any, payload: any): Promise<any> => {
  const effect = Effect.gen(function* () {
    // Get the resolver
    const resolver = yield* RpcResolver.make(BigOceanRpcs);

    // Resolve the RPC call
    return yield* resolver(rpc, payload);
  }).pipe(Effect.provide(ProtocolLayer));

  return Effect.runPromise(effect);
};
