import crypto from "node:crypto";
import { AppConfig } from "@workspace/domain";
import { LoggerRepository } from "@workspace/domain/repositories/logger.repository";
import {
	PushDeliveryError,
	PushSubscriptionExpiredError,
	PushUnavailableError,
	WebPushRepository,
} from "@workspace/domain/repositories/web-push.repository";
import { Effect, Layer, Redacted } from "effect";

const MAX_VAPID_TTL_SECONDS = 60 * 60 * 12;

const toBase64Url = (value: string | Buffer) =>
	Buffer.from(value).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");

const derToJose = (signature: Buffer) => {
	if (signature.length < 8) {
		throw new Error("DER signature too short");
	}

	let offset = 0;
	if (signature[offset++] !== 0x30) {
		throw new Error("Invalid DER signature: missing sequence tag");
	}

	const seqLength = signature[offset++];
	if (seqLength === undefined || seqLength >= 0x80) {
		throw new Error("Invalid DER signature: unsupported sequence length encoding");
	}

	if (signature[offset++] !== 0x02) {
		throw new Error("Invalid DER signature: missing r integer tag");
	}
	const rLength = signature[offset++];
	if (rLength === undefined || offset + rLength > signature.length) {
		throw new Error("Invalid DER signature: r length out of bounds");
	}
	const r = signature.subarray(offset, offset + rLength);
	offset += rLength;

	if (signature[offset++] !== 0x02) {
		throw new Error("Invalid DER signature: missing s integer tag");
	}
	const sLength = signature[offset++];
	if (sLength === undefined || offset + sLength > signature.length) {
		throw new Error("Invalid DER signature: s length out of bounds");
	}
	const s = signature.subarray(offset, offset + sLength);

	const normalize = (value: Buffer) => {
		const trimmed = value[0] === 0 ? value.subarray(1) : value;
		return trimmed.length >= 32
			? trimmed.subarray(trimmed.length - 32)
			: Buffer.concat([Buffer.alloc(32 - trimmed.length, 0), trimmed]);
	};

	return Buffer.concat([normalize(r), normalize(s)]);
};

const createVapidJwt = ({
	audience,
	subject,
	privateKey,
}: {
	audience: string;
	subject: string;
	privateKey: string;
}) => {
	const encodedHeader = toBase64Url(JSON.stringify({ alg: "ES256", typ: "JWT" }));
	const encodedPayload = toBase64Url(
		JSON.stringify({
			aud: audience,
			exp: Math.floor(Date.now() / 1000) + MAX_VAPID_TTL_SECONDS,
			sub: subject,
		}),
	);
	const unsignedToken = `${encodedHeader}.${encodedPayload}`;
	const signature = derToJose(crypto.sign("sha256", Buffer.from(unsignedToken), privateKey));
	return `${unsignedToken}.${toBase64Url(signature)}`;
};

export const WebPushFetchRepositoryLive = Layer.effect(
	WebPushRepository,
	Effect.gen(function* () {
		const config = yield* AppConfig;
		const logger = yield* LoggerRepository;

		return WebPushRepository.of({
			sendNotification: (subscription) =>
				Effect.tryPromise({
					try: async () => {
						if (!config.pushVapidPublicKey || !config.pushVapidPrivateKey || !config.pushVapidSubject) {
							throw new PushUnavailableError({
								reason: "Push VAPID configuration is missing",
							});
						}

						const privateKey = Redacted.value(config.pushVapidPrivateKey).replace(/\\n/g, "\n");
						const endpoint = new URL(subscription.endpoint);
						const audience = `${endpoint.protocol}//${endpoint.host}`;
						const token = createVapidJwt({
							audience,
							subject: config.pushVapidSubject,
							privateKey,
						});

						const response = await fetch(subscription.endpoint, {
							method: "POST",
							headers: {
								Authorization: `vapid t=${token}, k=${config.pushVapidPublicKey}`,
								"Crypto-Key": `p256ecdsa=${config.pushVapidPublicKey}`,
								"Content-Length": "0",
								TTL: "300",
								Urgency: "normal",
							},
						});

						if (response.ok) return;

						if (response.status === 404 || response.status === 410) {
							throw new PushSubscriptionExpiredError({
								endpoint: subscription.endpoint,
								status: response.status,
							});
						}

						const responseText = await response.text();
						throw new PushDeliveryError({
							endpoint: subscription.endpoint,
							status: response.status,
							reason: responseText || "Push delivery failed",
						});
					},
					catch: (error) => {
						if (
							error instanceof PushUnavailableError ||
							error instanceof PushSubscriptionExpiredError ||
							error instanceof PushDeliveryError
						) {
							return error;
						}

						logger.error("Web push request failed", {
							endpoint: subscription.endpoint,
							error: error instanceof Error ? error.message : String(error),
						});

						return new PushDeliveryError({
							endpoint: subscription.endpoint,
							reason: error instanceof Error ? error.message : String(error),
						});
					},
				}),
		});
	}),
);
