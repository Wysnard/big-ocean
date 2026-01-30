/**
 * Effect-ts RPC Contracts
 *
 * Type-safe RPC contracts for frontend-backend communication.
 * Exports all services, error schemas, and shared data structures.
 */

import { AssessmentRpcs } from "./assessment.js";
import { ProfileRpcs } from "./profile.js";

// Services
export * from "./assessment.js";
export * from "./profile.js";

// Errors
export * from "./errors.js";

// Shared Schemas
export * from "./schemas.js";

/**
 * Combined RPC Group
 *
 * Merges all RPC groups into a single group for server and client.
 */
export const BigOceanRpcs = AssessmentRpcs.merge(ProfileRpcs);
