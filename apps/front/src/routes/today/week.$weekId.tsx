import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, isRedirect, Link, notFound, redirect } from "@tanstack/react-router";
import { Button } from "@workspace/ui/components/button";
import { Schema as S } from "effect";
import { PageMain } from "@/components/PageMain";
import { WeeklyLetterReadingView } from "@/components/today/WeeklyLetterReadingView";
import { getWeeklyLetterQueryOptions, isWeeklyLetterApiError } from "@/hooks/use-weekly-letter";
import { getSession } from "@/lib/auth-client";

const WeekIdParams = S.Struct({
	weekId: S.String.pipe(S.pattern(/^\d{4}-W\d{2}$/)),
});

export const Route = createFileRoute("/today/week/$weekId")({
	ssr: false,
	params: {
		parse: (raw) => S.decodeUnknownSync(WeekIdParams)(raw),
		stringify: (params) => ({ weekId: params.weekId }),
	},
	beforeLoad: async () => {
		try {
			const { data: session } = await getSession();
			if (!session?.user) {
				throw redirect({ to: "/login", search: { sessionId: undefined, redirectTo: undefined } });
			}
		} catch (e) {
			if (isRedirect(e)) throw e;
			throw redirect({ to: "/login", search: { sessionId: undefined, redirectTo: undefined } });
		}
	},
	loader: async ({ params, context }) => {
		try {
			await context.queryClient.ensureQueryData(getWeeklyLetterQueryOptions(params.weekId));
		} catch (e) {
			if (isWeeklyLetterApiError(e)) {
				if (e.status === 404) throw notFound();
				if (e.status === 401) {
					throw redirect({ to: "/login", search: { sessionId: undefined, redirectTo: undefined } });
				}
			}
			throw e;
		}
	},
	notFoundComponent: WeeklyLetterNotFound,
	pendingComponent: WeeklyLetterPending,
	component: WeeklyLetterPage,
});

function WeeklyLetterPending() {
	return (
		<PageMain title="Loading letter" className="min-h-[calc(100dvh-3.5rem)] bg-background">
			<div
				className="mx-auto max-w-[65ch] px-6 py-16 space-y-4 animate-pulse"
				data-testid="weekly-letter-loading"
			>
				<div className="h-4 w-32 rounded bg-muted" />
				<div className="h-40 w-full rounded bg-muted/60" />
				<div className="h-4 w-full rounded bg-muted/40" />
				<div className="h-4 max-w-md w-full rounded bg-muted/40" />
			</div>
		</PageMain>
	);
}

function WeeklyLetterNotFound() {
	return (
		<PageMain title="Weekly letter" className="min-h-[calc(100dvh-3.5rem)] bg-background">
			<div className="mx-auto max-w-lg px-6 py-16 text-center" data-testid="weekly-letter-not-found">
				<p className="text-lg text-foreground">This letter isn&apos;t here yet.</p>
				<p className="text-muted-foreground mt-3 text-sm leading-relaxed">
					When there&apos;s a letter for this week, you&apos;ll find it from Today.
				</p>
				<Button asChild className="mt-8 rounded-full">
					<Link to="/today" data-testid="weekly-letter-not-found-back">
						Back to Today
					</Link>
				</Button>
			</div>
		</PageMain>
	);
}

function WeeklyLetterPage() {
	const { weekId } = Route.useParams();
	const { data } = useSuspenseQuery(getWeeklyLetterQueryOptions(weekId));

	return (
		<PageMain title="Your week with Nerin" className="bg-background">
			<WeeklyLetterReadingView content={data.content} />
		</PageMain>
	);
}
