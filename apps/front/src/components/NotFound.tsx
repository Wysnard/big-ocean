import { Link } from "@tanstack/react-router";
import { Button } from "@workspace/ui/components/button";
import { BubblesDecoration, WaveDecoration } from "./OceanDecorative";

interface NotFoundProps {
	title?: string;
	description?: string;
}

export function NotFound({
	title = "Lost at sea",
	description = "The page you're looking for doesn't exist or has drifted away.",
}: NotFoundProps = {}) {
	return (
		<div
			data-testid="not-found-page"
			className="min-h-[calc(100dvh-3.5rem)] bg-background flex items-center justify-center px-6 relative overflow-hidden"
		>
			<div className="absolute top-12 left-1/2 -translate-x-1/2 w-80 pointer-events-none">
				<BubblesDecoration className="opacity-[0.06]" />
			</div>
			<div className="absolute bottom-0 left-0 right-0 pointer-events-none">
				<WaveDecoration className="opacity-[0.08]" />
			</div>

			<div className="text-center max-w-md relative z-10">
				<p className="text-7xl font-heading font-bold text-primary/20">404</p>
				<h1 className="text-2xl font-heading font-bold text-foreground mt-2">{title}</h1>
				<p className="text-muted-foreground mt-3">{description}</p>
				<div className="mt-6">
					<Button asChild>
						<Link to="/">Back to shore</Link>
					</Button>
				</div>
			</div>
		</div>
	);
}
