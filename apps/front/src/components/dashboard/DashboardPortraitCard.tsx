/**
 * DashboardPortraitCard (Story 38-3, Task 4)
 *
 * Shows portrait status: locked (unlock CTA), generating (skeleton), or ready (read link).
 */

import { Link } from "@tanstack/react-router";
import type { PortraitStatus } from "@workspace/contracts";
import { Button } from "@workspace/ui/components/button";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@workspace/ui/components/card";
import { BookOpen, Loader2, Lock } from "lucide-react";

interface DashboardPortraitCardProps {
	portraitStatus: PortraitStatus | undefined;
	sessionId: string;
	onUnlockPortrait?: () => void;
}

export function DashboardPortraitCard({
	portraitStatus,
	sessionId,
	onUnlockPortrait,
}: DashboardPortraitCardProps) {
	const isLocked = !portraitStatus || portraitStatus === "none";
	const isGenerating = portraitStatus === "generating";
	const isReady = portraitStatus === "ready";
	const isFailed = portraitStatus === "failed";

	return (
		<Card data-testid="dashboard-portrait-card">
			<CardHeader>
				<CardTitle className="text-lg font-display">Your Portrait</CardTitle>
			</CardHeader>

			<CardContent>
				{isLocked && (
					<div className="text-center py-4">
						<Lock className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
						<p className="text-sm text-muted-foreground">
							Nerin has written a personal letter about who you are. Unlock it to read what he discovered.
						</p>
					</div>
				)}

				{isGenerating && (
					<div className="text-center py-4">
						<div className="flex items-center justify-center gap-2 mb-3">
							<Loader2 className="w-5 h-5 motion-safe:animate-spin text-primary" />
							<span className="text-sm font-medium text-foreground">Nerin is writing...</span>
						</div>
						<div className="space-y-2">
							<div className="h-3 w-full rounded bg-muted motion-safe:animate-pulse" />
							<div className="h-3 w-4/5 rounded bg-muted motion-safe:animate-pulse" />
							<div className="h-3 w-3/5 rounded bg-muted motion-safe:animate-pulse" />
						</div>
					</div>
				)}

				{isReady && (
					<div className="text-center py-4">
						<BookOpen className="w-8 h-8 mx-auto text-primary mb-3" />
						<p className="text-sm text-muted-foreground">
							Your portrait is ready. A personal letter from Nerin, just for you.
						</p>
					</div>
				)}

				{isFailed && (
					<div className="text-center py-4">
						<p className="text-sm text-muted-foreground">
							Portrait generation encountered an issue. You can retry from the results page.
						</p>
					</div>
				)}
			</CardContent>

			<CardFooter>
				{isLocked && onUnlockPortrait && (
					<Button
						data-testid="dashboard-unlock-portrait"
						className="w-full min-h-11"
						onClick={onUnlockPortrait}
					>
						<Lock className="w-4 h-4 mr-2" />
						Unlock Your Portrait
					</Button>
				)}

				{isReady && (
					<Button variant="outline" className="w-full min-h-11" asChild>
						<Link
							to="/results/$assessmentSessionId"
							params={{ assessmentSessionId: sessionId }}
							search={{ view: "portrait" }}
						>
							<BookOpen className="w-4 h-4 mr-2" />
							Read Your Portrait
						</Link>
					</Button>
				)}

				{isFailed && (
					<Button variant="outline" className="w-full min-h-11" asChild>
						<Link to="/results/$assessmentSessionId" params={{ assessmentSessionId: sessionId }}>
							Go to Results
						</Link>
					</Button>
				)}
			</CardFooter>
		</Card>
	);
}
