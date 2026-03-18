/**
 * Email Handler (Story 31-7)
 *
 * Thin HTTP adapter for email-related operations.
 */

import { HttpApiBuilder } from "@effect/platform";
import { BigOceanApi } from "@workspace/contracts";
import { Effect } from "effect";
import { checkDropOff } from "../use-cases/check-drop-off.use-case";

export const EmailGroupLive = HttpApiBuilder.group(BigOceanApi, "email", (handlers) =>
	Effect.gen(function* () {
		return handlers.handle("checkDropOff", () => checkDropOff);
	}),
);
