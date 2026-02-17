import { Link } from "@tanstack/react-router";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { ChevronRight, Download, MessageCircle, User } from "lucide-react";

interface QuickActionsCardProps {
	sessionId: string;
	publicProfileId?: string;
}

const actions = [
	{
		key: "resume",
		icon: MessageCircle,
		title: "Resume Conversation",
		description: "Continue exploring your personality with Nerin",
		iconBg: "bg-primary/10 text-primary",
	},
	{
		key: "profile",
		icon: User,
		title: "View Public Profile",
		description: "See how others view your personality archetype",
		iconBg: "bg-[oklch(0.67_0.13_181/0.10)] text-[oklch(0.45_0.13_181)]",
	},
	{
		key: "download",
		icon: Download,
		title: "Download Report",
		description: "Get a PDF summary of your results",
		iconBg: "bg-muted text-muted-foreground",
	},
] as const;

export function QuickActionsCard({ sessionId, publicProfileId }: QuickActionsCardProps) {
	return (
		<Card data-slot="quick-actions-card">
			<CardHeader>
				<CardTitle className="text-lg font-display">Quick Actions</CardTitle>
			</CardHeader>
			<CardContent className="space-y-2">
				{actions.map((action) => {
					const Icon = action.icon;
					const isDisabled = action.key === "download" || (action.key === "profile" && !publicProfileId);

					const content = (
						<>
							<div className={`flex-shrink-0 rounded-lg p-2 ${action.iconBg}`}>
								<Icon className="size-4" />
							</div>
							<div className="flex-1 min-w-0">
								<p className="text-sm font-medium text-foreground">{action.title}</p>
								<p className="text-xs text-muted-foreground">{action.description}</p>
							</div>
							<ChevronRight className="size-4 text-muted-foreground flex-shrink-0" />
						</>
					);

					if (action.key === "resume") {
						return (
							<Button key={action.key} variant="action" size="action" asChild>
								<Link to="/chat" search={{ sessionId }}>
									{content}
								</Link>
							</Button>
						);
					}

					if (action.key === "profile" && publicProfileId) {
						return (
							<Button key={action.key} variant="action" size="action" asChild>
								<Link to="/public-profile/$publicProfileId" params={{ publicProfileId }}>
									{content}
								</Link>
							</Button>
						);
					}

					return (
						<Button key={action.key} variant="action" size="action" disabled={isDisabled}>
							{content}
						</Button>
					);
				})}
			</CardContent>
		</Card>
	);
}
