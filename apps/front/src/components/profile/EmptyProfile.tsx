/**
 * Empty Dashboard Component (Story 7.13)
 *
 * Shown when user has no assessment sessions.
 * Provides a CTA to start their first assessment.
 */

import { Link } from "@tanstack/react-router";
import { Button } from "@workspace/ui/components/button";
import { MessageCircle } from "lucide-react";

export function EmptyProfile() {
	return (
		<div
			data-slot="empty-dashboard"
			className="flex flex-col items-center justify-center py-16 px-6 text-center"
		>
			<div className="rounded-full bg-primary/10 p-4 mb-6">
				<MessageCircle className="h-8 w-8 text-primary" />
			</div>

			<h2 className="text-xl font-heading font-semibold text-foreground mb-2">No assessments yet</h2>

			<p className="text-muted-foreground text-sm max-w-sm mb-8">
				Start a conversation with Nerin to discover your personality profile through the Big Five
				framework.
			</p>

			<Button asChild size="lg">
				<Link to="/chat">
					<MessageCircle className="h-4 w-4" />
					Start Your Assessment
				</Link>
			</Button>
		</div>
	);
}
