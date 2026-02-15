/**
 * Assessment Card Component (Story 7.13)
 *
 * Displays a single assessment session summary.
 * Completion status is derived from messageCount >= freeTierMessageThreshold,
 * NOT from the stored status field (which is never set to "completed").
 *
 * Even completed assessments show "Keep Exploring" — users can always
 * continue the conversation with Nerin.
 */

import { Link } from "@tanstack/react-router";
import type { OceanCode5 } from "@workspace/domain";
import { Button } from "@workspace/ui/components/button";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@workspace/ui/components/card";
import { cn } from "@workspace/ui/lib/utils";
import { BarChart3, Check, Copy, Loader2, MessageCircle, Share2 } from "lucide-react";
import { useState } from "react";
import { useShareProfile } from "../../hooks/use-profile";
import { GeometricSignature } from "../ocean-shapes/GeometricSignature";

interface AssessmentCardProps {
	id: string;
	createdAt: string;
	messageCount: number;
	freeTierMessageThreshold: number;
	oceanCode5: string | null;
	archetypeName: string | null;
	className?: string;
}

function formatDate(dateString: string): string {
	const date = new Date(dateString);
	return date.toLocaleDateString(undefined, {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
}

export function AssessmentCard({
	id,
	createdAt,
	messageCount,
	freeTierMessageThreshold,
	oceanCode5,
	archetypeName,
	className,
}: AssessmentCardProps) {
	const isCompleted = messageCount >= freeTierMessageThreshold;
	const progress = Math.min(Math.round((messageCount / freeTierMessageThreshold) * 100), 100);

	const shareProfile = useShareProfile();
	const [shareUrl, setShareUrl] = useState<string | null>(null);
	const [shareError, setShareError] = useState<string | null>(null);
	const [copied, setCopied] = useState(false);

	const handleShare = async () => {
		setShareError(null);
		try {
			const result = await shareProfile.mutateAsync(id);
			setShareUrl(result.shareableUrl);
		} catch (err) {
			setShareError(err instanceof Error ? err.message : "Failed to create shareable link");
		}
	};

	const handleCopyLink = async () => {
		if (!shareUrl) return;
		try {
			await navigator.clipboard.writeText(shareUrl);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			const textarea = document.createElement("textarea");
			textarea.value = shareUrl;
			document.body.appendChild(textarea);
			textarea.select();
			document.execCommand("copy");
			document.body.removeChild(textarea);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		}
	};

	return (
		<Card
			data-slot="assessment-card"
			data-status={isCompleted ? "completed" : "in-progress"}
			className={cn(
				"transition-shadow hover:shadow-md",
				isCompleted && "border-primary/30",
				className,
			)}
		>
			<CardHeader>
				<div className="flex items-center justify-between">
					<CardTitle className="text-base font-heading">
						{isCompleted && archetypeName ? archetypeName : "Assessment"}
					</CardTitle>
					<span
						data-slot="status-badge"
						className={cn(
							"inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
							isCompleted ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
						)}
					>
						{isCompleted ? "Complete" : "In Progress"}
					</span>
				</div>
			</CardHeader>

			<CardContent className="flex flex-col gap-4">
				{/* Geometric signature for completed sessions */}
				{isCompleted && oceanCode5 && (
					<div className="flex justify-center py-2">
						<GeometricSignature oceanCode={oceanCode5 as OceanCode5} baseSize={24} animate={false} />
					</div>
				)}

				{/* Progress bar for in-progress sessions */}
				{!isCompleted && (
					<div data-slot="progress-section" className="space-y-1.5">
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
				)}

				<p className="text-xs text-muted-foreground">{formatDate(createdAt)}</p>
			</CardContent>

			<CardFooter className={cn(isCompleted && "flex-col gap-2")}>
				{isCompleted ? (
					<>
						<Button asChild variant="outline" size="sm" className="w-full">
							<Link to="/results/$assessmentSessionId" params={{ assessmentSessionId: id }}>
								<BarChart3 className="h-4 w-4" />
								View Results
							</Link>
						</Button>
						<Button asChild variant="ghost" size="sm" className="w-full">
							<Link to="/chat" search={{ sessionId: id }}>
								<MessageCircle className="h-4 w-4" />
								Keep Exploring
							</Link>
						</Button>

						{/* Share My Archetype (AC-2) */}
						{!shareUrl ? (
							<>
								{shareError && <p className="text-xs text-destructive w-full text-center">{shareError}</p>}
								<Button
									data-slot="share-archetype-btn"
									variant="outline"
									size="sm"
									className="w-full"
									onClick={handleShare}
									disabled={shareProfile.isPending}
								>
									{shareProfile.isPending ? (
										<>
											<Loader2 className="h-4 w-4 motion-safe:animate-spin" />
											Generating Link...
										</>
									) : (
										<>
											<Share2 className="h-4 w-4" />
											Share My Archetype
										</>
									)}
								</Button>
							</>
						) : (
							<div data-slot="share-link-display" className="w-full space-y-2">
								<div className="flex items-center gap-2 rounded-lg bg-muted/50 p-2">
									<code className="text-xs text-primary flex-1 truncate">{shareUrl}</code>
									<Button
										data-slot="share-copy-btn"
										onClick={handleCopyLink}
										size="sm"
										variant="ghost"
										className="shrink-0 h-7 w-7 p-0"
									>
										{copied ? (
											<Check className="h-3.5 w-3.5 text-success" />
										) : (
											<Copy className="h-3.5 w-3.5" />
										)}
									</Button>
								</div>
							</div>
						)}
					</>
				) : (
					<Button asChild size="sm" className="w-full">
						<Link to="/chat" search={{ sessionId: id }}>
							<MessageCircle className="h-4 w-4" />
							Continue
						</Link>
					</Button>
				)}
			</CardFooter>
		</Card>
	);
}
