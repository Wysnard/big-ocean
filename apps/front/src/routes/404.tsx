import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@workspace/ui/components/button";

export const Route = createFileRoute("/404")({
	component: NotFoundPage,
});

function NotFoundPage() {
	return (
		<div className="min-h-[calc(100dvh-3.5rem)] bg-background flex items-center justify-center px-6">
			<div className="text-center max-w-md">
				<h1 className="text-3xl font-bold text-foreground">404 Not Found</h1>
				<p className="text-muted-foreground mt-3">
					The page or assessment session you requested could not be found.
				</p>
				<div className="mt-6">
					<Button asChild>
						<Link to="/">Go Home</Link>
					</Button>
				</div>
			</div>
		</div>
	);
}
