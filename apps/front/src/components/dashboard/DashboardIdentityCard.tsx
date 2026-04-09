/**
 * DashboardIdentityCard (Story 38-3, Task 3)
 *
 * Displays archetype name, OCEAN code, and hieroglyph code as a summary card.
 * Links to the full results page. Optionally links to the public profile.
 */

import { Link } from "@tanstack/react-router";
import type { OceanCode5, TraitName } from "@workspace/domain";
import { BIG_FIVE_TRAITS, getTraitLevelLabel } from "@workspace/domain";
import { Button } from "@workspace/ui/components/button";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@workspace/ui/components/card";
import { OceanHieroglyphCode } from "@workspace/ui/components/ocean-hieroglyph-code";
import { Tooltip, TooltipContent, TooltipTrigger } from "@workspace/ui/components/tooltip";
import { ArrowRight, ExternalLink } from "lucide-react";
import { useId } from "react";

/** Capitalized trait labels for tooltip display */
const TRAIT_DISPLAY_NAMES: Record<TraitName, string> = {
	openness: "Openness",
	conscientiousness: "Conscientiousness",
	extraversion: "Extraversion",
	agreeableness: "Agreeableness",
	neuroticism: "Neuroticism",
};

interface DashboardIdentityCardProps {
	archetypeName: string;
	oceanCode5: OceanCode5;
	sessionId: string;
	dominantTrait: TraitName;
	publicProfileId?: string;
}

export function DashboardIdentityCard({
	archetypeName,
	oceanCode5,
	sessionId,
	dominantTrait,
	publicProfileId,
}: DashboardIdentityCardProps) {
	const tooltipBaseId = useId();

	return (
		<Card data-testid="dashboard-identity-card" className="relative overflow-hidden">
			{/* Subtle color accent from dominant trait */}
			<div
				className="absolute top-0 right-0 w-32 h-32 rounded-full -translate-y-1/2 translate-x-1/2 opacity-10"
				style={{ backgroundColor: `var(--trait-${dominantTrait})` }}
				aria-hidden="true"
			/>

			<CardHeader className="relative z-10">
				<CardTitle className="text-lg font-display">Your Archetype</CardTitle>
			</CardHeader>

			<CardContent className="relative z-10 space-y-4">
				{/* Hieroglyph Code */}
				<div className="flex justify-center">
					<OceanHieroglyphCode code={oceanCode5} size={36} />
				</div>

				{/* Archetype name + public profile link */}
				<div className="flex items-center justify-center gap-2">
					<h2
						data-testid="dashboard-archetype-name"
						className="text-2xl font-display font-bold text-center text-foreground"
					>
						{archetypeName}
					</h2>
					{publicProfileId && (
						<Tooltip>
							<TooltipTrigger asChild>
								<Link
									to="/public-profile/$publicProfileId"
									params={{ publicProfileId }}
									className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
									aria-label="View public profile"
								>
									<ExternalLink className="w-4 h-4" />
								</Link>
							</TooltipTrigger>
							<TooltipContent>View public profile</TooltipContent>
						</Tooltip>
					)}
				</div>

				{/* OCEAN code with tooltips */}
				<div className="flex items-center justify-center gap-1 font-mono text-xl tracking-[0.2em]">
					{oceanCode5.split("").map((letter, i) => {
						const traitName = BIG_FIVE_TRAITS[i];
						const levelLabel = getTraitLevelLabel(traitName, letter);
						const tooltipId = `${tooltipBaseId}-trait-${traitName}`;

						return (
							<Tooltip key={traitName}>
								<TooltipTrigger asChild>
									<button
										type="button"
										aria-describedby={tooltipId}
										className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
										data-trait={traitName}
									>
										{letter}
									</button>
								</TooltipTrigger>
								<TooltipContent id={tooltipId} side="bottom">
									{TRAIT_DISPLAY_NAMES[traitName]}: {levelLabel}
								</TooltipContent>
							</Tooltip>
						);
					})}
				</div>
			</CardContent>

			<CardFooter className="relative z-10">
				<Button variant="outline" className="w-full min-h-11" asChild>
					<Link to="/results/$conversationSessionId" params={{ conversationSessionId: sessionId }}>
						View Full Results
						<ArrowRight className="w-4 h-4 ml-2" />
					</Link>
				</Button>
			</CardFooter>
		</Card>
	);
}
