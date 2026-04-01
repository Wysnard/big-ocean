/**
 * Portrait Job Queue Service
 *
 * Effect Queue that bridges the Promise-based webhook (Better Auth)
 * with the Effect-based portrait generation worker.
 *
 * Webhook → Queue.offer (Promise-safe) → Worker fiber → generateFullPortrait
 */

import { Context, type Queue } from "effect";

export interface PortraitJob {
	readonly sessionId: string;
	readonly userId: string;
}

export class PortraitJobQueue extends Context.Tag("PortraitJobQueue")<
	PortraitJobQueue,
	Queue.Queue<PortraitJob>
>() {}
