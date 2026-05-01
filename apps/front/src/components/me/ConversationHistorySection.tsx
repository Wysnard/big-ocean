import { Link } from "@tanstack/react-router";
import type { SessionSummary } from "@workspace/contracts";
import { DateTime } from "effect";
import { BadgeCheck, Clock, Loader2, MessageCircle, MoreHorizontal } from "lucide-react";

type ConversationHistorySectionProps = {
	readonly sessions: readonly SessionSummary[];
	readonly isLoading?: boolean;
	readonly isError?: boolean;
};

const HISTORY_SKELETON_KEYS = ["history-skeleton-1", "history-skeleton-2", "history-skeleton-3"];

const STATUS_META: Record<
	SessionSummary["status"],
	{
		readonly label: string;
		readonly icon: typeof BadgeCheck;
		readonly description: string;
	}
> = {
	active: {
		label: "In progress",
		icon: MessageCircle,
		description: "Continue this conversation with Nerin.",
	},
	paused: {
		label: "Paused",
		icon: Clock,
		description: "Return to this paused conversation.",
	},
	finalizing: {
		label: "Finalizing",
		icon: Loader2,
		description: "Nerin is preparing this assessment.",
	},
	completed: {
		label: "Completed",
		icon: BadgeCheck,
		description: "Review this completed conversation.",
	},
	archived: {
		label: "Archived",
		icon: MoreHorizontal,
		description: "This conversation is archived.",
	},
};

function toDate(value: SessionSummary["createdAt"]): Date {
	if (value instanceof Date) return value;
	return DateTime.toDateUtc(value);
}

function formatConversationDate(date: Date): string {
	return new Intl.DateTimeFormat(undefined, {
		month: "short",
		day: "numeric",
		year: "numeric",
	}).format(date);
}

function getConversationLink(session: SessionSummary) {
	if (session.status === "active" || session.status === "paused") {
		return {
			to: "/chat" as const,
			search: { sessionId: session.id },
			label: "Continue",
		};
	}

	if (session.status === "finalizing" || session.status === "completed") {
		return {
			to: "/me/$conversationSessionId" as const,
			params: { conversationSessionId: session.id },
			label: session.status === "finalizing" ? "View" : "Review",
		};
	}

	return null;
}

export function ConversationHistorySection({
	sessions,
	isLoading = false,
	isError = false,
}: ConversationHistorySectionProps) {
	if (isLoading) {
		return (
			<div className="space-y-3" data-testid="conversation-history-loading" aria-busy="true">
				{HISTORY_SKELETON_KEYS.map((key) => (
					<div key={key} className="h-20 animate-pulse rounded-lg border border-border/60 bg-muted/40" />
				))}
			</div>
		);
	}

	if (isError) {
		return (
			<p className="text-sm leading-6 text-muted-foreground" data-testid="conversation-history-error">
				We couldn't load your conversation history right now.
			</p>
		);
	}

	if (sessions.length === 0) {
		return (
			<p className="text-sm leading-6 text-muted-foreground" data-testid="conversation-history-empty">
				Your conversations with Nerin will appear here.
			</p>
		);
	}

	return (
		<ol className="divide-y divide-border/60" data-testid="conversation-history-list">
			{sessions.map((session) => {
				const meta = STATUS_META[session.status];
				const Icon = meta.icon;
				const link = getConversationLink(session);
				const createdAt = toDate(session.createdAt);
				const title = session.archetypeName ?? "Conversation with Nerin";
				const subtitle =
					session.oceanCode5 != null
						? `${session.oceanCode5} · ${session.messageCount} turns`
						: `${session.messageCount} turns`;

				return (
					<li
						key={session.id}
						className="grid gap-4 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
						data-testid="conversation-history-item"
						data-session-status={session.status}
					>
						<div className="min-w-0">
							<div className="mb-2 flex flex-wrap items-center gap-2">
								<span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
									<Icon className="size-3.5" aria-hidden="true" />
									{meta.label}
								</span>
								<time className="text-xs text-muted-foreground" dateTime={createdAt.toISOString()}>
									{formatConversationDate(createdAt)}
								</time>
							</div>
							<h3 className="truncate text-base font-medium text-foreground">{title}</h3>
							<p className="mt-1 text-sm leading-6 text-muted-foreground">
								{subtitle} · {meta.description}
							</p>
						</div>

						{link?.to === "/chat" ? (
							<Link
								to="/chat"
								search={link.search}
								className="inline-flex min-h-11 items-center justify-center rounded-full border border-border/70 px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent"
								data-testid="conversation-history-action"
							>
								{link.label}
							</Link>
						) : link?.to === "/me/$conversationSessionId" ? (
							<Link
								to="/me/$conversationSessionId"
								params={link.params}
								className="inline-flex min-h-11 items-center justify-center rounded-full border border-border/70 px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent"
								data-testid="conversation-history-action"
							>
								{link.label}
							</Link>
						) : null}
					</li>
				);
			})}
		</ol>
	);
}
