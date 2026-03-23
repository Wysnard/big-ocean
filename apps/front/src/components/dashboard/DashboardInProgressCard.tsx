/**
 * DashboardInProgressCard
 *
 * Displayed when user has an in-progress assessment (not yet completed).
 * Shows progress bar and Continue CTA. Absorbed from the old /profile route.
 */

import { Link } from "@tanstack/react-router";
import { Button } from "@workspace/ui/components/button";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@workspace/ui/components/card";
import { MessageCircle } from "lucide-react";

interface DashboardInProgressCardProps {
	sessionId: string;
	messageCount: number;
	freeTierMessageThreshold: number;
}

export function DashboardInProgressCard({
	sessionId,
	messageCount,
	freeTierMessageThreshold,
}: DashboardInProgressCardProps) {
	const progress =
		freeTierMessageThreshold > 0
			? Math.min(Math.round((messageCount / freeTierMessageThreshold) * 100), 100)
			: 0;

	return (
		<Card data-testid="dashboard-in-progress-card">
			<CardHeader>
				<CardTitle className="text-lg font-display">Your Conversation</CardTitle>
			</CardHeader>

			<CardContent className="space-y-4">
				<p className="text-sm text-muted-foreground">
					You're in the middle of a conversation with Nerin. Pick up where you left off.
				</p>

				{/* Progress bar */}
				<div className="space-y-1.5">
					<div className="flex items-center justify-between text-xs text-muted-foreground">
						<span>
							{messageCount} / {freeTierMessageThreshold} messages
						</span>
						<span>{progress}%</span>
					</div>
					<div className="h-1.5 w-full rounded-full bg-muted">
						<div
							className="h-full rounded-full bg-primary transition-all"
							style={{ width: `${progress}%` }}
						/>
					</div>
				</div>
			</CardContent>

			<CardFooter>
				<Button className="w-full min-h-11" asChild>
					<Link to="/chat" search={{ sessionId }}>
						<MessageCircle className="w-4 h-4 mr-2" />
						Continue Your Conversation
					</Link>
				</Button>
			</CardFooter>
		</Card>
	);
}
