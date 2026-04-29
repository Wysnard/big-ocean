/**
 * Portrait Job Queue Service
 *
 * Effect Queue that bridges finalize/retry paths Promise-safe `Queue.offer` calls
 * with the Effect-based portrait generation worker (ADR-7).
 *
 * Producer examples: Assessment Finalization (`generate-results`), manual retry (`retry-portrait`).
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
