/**
 * DashboardEmptyState (Story 38-3, Task 7)
 *
 * Displayed when user has no completed assessment.
 * Uses warm ocean-themed copy with CTA to start conversation.
 */

import { Link } from "@tanstack/react-router";
import { Button } from "@workspace/ui/components/button";
import { MessageCircle } from "lucide-react";

export function DashboardEmptyState() {
	return (
		<div
			data-testid="dashboard-empty-state"
			className="w-full max-w-xl mx-auto rounded-2xl border border-border bg-card p-8 text-center shadow-sm"
		>
			<div className="mb-6">
				<MessageCircle className="w-12 h-12 mx-auto text-primary mb-4" />
				<h2 className="text-xl font-heading font-bold text-foreground mb-2">Your ocean awaits</h2>
				<p className="text-sm text-muted-foreground leading-relaxed">
					Have a conversation with Nerin, our dive master, and discover what lies beneath the surface. In
					25 minutes, you'll receive your personality portrait, archetype, and OCEAN code.
				</p>
			</div>

			<Button className="min-h-11" asChild>
				<Link to="/chat">
					<MessageCircle className="w-4 h-4 mr-2" />
					Start Your Conversation
				</Link>
			</Button>
		</div>
	);
}
