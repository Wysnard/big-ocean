/**
 * Payment Gateway Repository Interface (Story 13.2)
 *
 * Abstracts webhook verification behind a domain interface.
 * Production implementation uses Polar SDK's validateEvent.
 */

import { Context, Effect } from "effect";
import type { WebhookVerificationError } from "../errors/http.errors";
import type { PolarWebhookEvent } from "../types/purchase.types";

export class PaymentGatewayRepository extends Context.Tag("PaymentGatewayRepository")<
	PaymentGatewayRepository,
	{
		readonly verifyWebhook: (
			rawBody: string,
			headers: Record<string, string>,
		) => Effect.Effect<PolarWebhookEvent, WebhookVerificationError, never>;
	}
>() {}
