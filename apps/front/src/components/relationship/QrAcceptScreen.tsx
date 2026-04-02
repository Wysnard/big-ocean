/**
 * QR Accept Screen Component (Story 34-3)
 *
 * Displays the consent gate for relationship analysis.
 * Shows initiator's archetype card, both users' confidence rings,
 * credit balance, and Accept/Refuse buttons.
 */

import { Link } from "@tanstack/react-router";
import { Button } from "@workspace/ui/components/button";
import { AlertCircle, ClipboardList, Loader2, UserX, XCircle } from "lucide-react";
import { ArchetypeCard } from "../results/ArchetypeCard";
import { ConfidenceRingCard } from "../results/ConfidenceRingCard";

export interface QrAcceptScreenProps {
	details: {
		tokenStatus: "valid" | "accepted" | "expired";
		initiator: {
			name: string;
			archetypeName: string;
			oceanCode4: string;
			oceanCode5: string;
			description: string;
			color: string;
			isCurated: boolean;
			overallConfidence: number;
		};
		acceptor: {
			overallConfidence: number;
			availableCredits: number;
			hasCompletedAssessment: boolean;
		};
	} | null;
	isLoading: boolean;
	error: Error | null;
	onAccept: () => void;
	onRefuse: () => void;
	isAccepting: boolean;
	isRefusing: boolean;
	acceptError: Error | null;
}

export function QrAcceptScreen({
	details,
	isLoading,
	error,
	onAccept,
	onRefuse,
	isAccepting,
	isRefusing,
	acceptError,
}: QrAcceptScreenProps) {
	// Loading state
	if (isLoading) {
		return (
			<div
				data-testid="qr-accept-loading"
				className="min-h-[calc(100dvh-3.5rem)] bg-background flex items-center justify-center px-6"
			>
				<Loader2 className="h-8 w-8 text-muted-foreground motion-safe:animate-spin" />
			</div>
		);
	}

	// Network error
	if (error) {
		const is404 = error.message?.includes("404") || error.message?.includes("not found");
		const isSelfInvite = error.message?.includes("self") || error.message?.includes("your own");

		if (is404) {
			return (
				<div
					data-testid="qr-accept-not-found"
					className="min-h-[calc(100dvh-3.5rem)] bg-background flex flex-col items-center justify-center px-6 text-center gap-4"
				>
					<XCircle className="h-12 w-12 text-muted-foreground" />
					<h1 className="text-xl font-semibold text-foreground">QR Code Not Found</h1>
					<p className="text-sm text-muted-foreground max-w-sm">
						This QR code doesn't exist or the link is invalid.
					</p>
				</div>
			);
		}

		if (isSelfInvite) {
			return <SelfInvitationState />;
		}

		return (
			<div
				data-testid="qr-accept-error"
				className="min-h-[calc(100dvh-3.5rem)] bg-background flex flex-col items-center justify-center px-6 text-center gap-4"
			>
				<AlertCircle className="h-12 w-12 text-destructive" />
				<h1 className="text-xl font-semibold text-foreground">Something went wrong</h1>
				<p className="text-sm text-muted-foreground max-w-sm">
					We couldn't load this invitation. Please try again.
				</p>
			</div>
		);
	}

	if (!details) return null;

	// Expired token
	if (details.tokenStatus === "expired") {
		return <ExpiredTokenState />;
	}

	// Already accepted
	if (details.tokenStatus === "accepted") {
		return (
			<div
				data-testid="qr-accept-already-accepted"
				className="min-h-[calc(100dvh-3.5rem)] bg-background flex flex-col items-center justify-center px-6 text-center gap-4"
			>
				<AlertCircle className="h-12 w-12 text-muted-foreground" />
				<h1 className="text-xl font-semibold text-foreground">Already Accepted</h1>
				<p className="text-sm text-muted-foreground max-w-sm">
					This QR code has already been used for a relationship analysis.
				</p>
			</div>
		);
	}

	// Acceptor hasn't completed their assessment
	if (!details.acceptor.hasCompletedAssessment) {
		return <AssessmentRequiredState initiatorName={details.initiator.name} />;
	}

	// Determine accept error type
	const isInsufficientCredits =
		acceptError?.message?.includes("402") || acceptError?.message?.includes("credit");

	return (
		<div
			data-testid="qr-accept-screen"
			className="min-h-[calc(100dvh-3.5rem)] bg-background flex flex-col items-center px-6 py-8 gap-6"
		>
			{/* Header */}
			<div className="text-center space-y-2 max-w-sm">
				<h1 className="text-2xl font-bold text-foreground">
					Discover your dynamic with {details.initiator.name}
				</h1>
				<p className="text-sm text-muted-foreground">
					A relationship analysis compares your personalities to reveal your unique dynamic together.
				</p>
			</div>

			{/* Initiator's Archetype Card */}
			<div className="w-full max-w-sm">
				<ArchetypeCard
					archetypeName={details.initiator.archetypeName}
					oceanCode4={details.initiator.oceanCode4 as never}
					oceanCode5={details.initiator.oceanCode5 as never}
					description={details.initiator.description}
					color={details.initiator.color}
					isCurated={details.initiator.isCurated}
					overallConfidence={details.initiator.overallConfidence}
				/>
			</div>

			{/* Confidence Rings */}
			<div className="w-full max-w-sm grid grid-cols-2 gap-4">
				<div data-testid="qr-accept-initiator-confidence">
					<p className="text-xs text-muted-foreground text-center mb-2">{details.initiator.name}</p>
					<ConfidenceRingCard confidence={details.initiator.overallConfidence / 100} messageCount={25} />
				</div>
				<div data-testid="qr-accept-acceptor-confidence">
					<p className="text-xs text-muted-foreground text-center mb-2">You</p>
					<ConfidenceRingCard confidence={details.acceptor.overallConfidence / 100} messageCount={25} />
				</div>
			</div>

			{/* Credit Balance */}
			<div
				data-testid="qr-accept-credit-balance"
				className="w-full max-w-sm text-center text-sm text-muted-foreground"
			>
				Uses 1 credit — {details.acceptor.availableCredits} available
			</div>

			{/* Accept Error */}
			{acceptError && !isInsufficientCredits && (
				<div
					data-testid="qr-accept-accept-error"
					className="w-full max-w-sm text-center text-sm text-destructive"
				>
					Something went wrong. Please try again.
				</div>
			)}

			{/* Insufficient Credits */}
			{isInsufficientCredits && (
				<div
					data-testid="qr-accept-no-credits"
					className="w-full max-w-sm text-center text-sm text-destructive"
				>
					You don't have enough credits. Purchase additional credits to continue.
				</div>
			)}

			{/* Action Buttons */}
			<div className="w-full max-w-sm flex flex-col gap-3">
				<Button
					data-testid="qr-accept-button"
					variant="default"
					className="w-full min-h-11"
					onClick={onAccept}
					disabled={isAccepting || isRefusing}
					aria-label={`Accept relationship analysis with ${details.initiator.name}`}
				>
					{isAccepting ? (
						<>
							<Loader2 className="h-4 w-4 mr-2 motion-safe:animate-spin" />
							Accepting...
						</>
					) : (
						"Accept"
					)}
				</Button>
				<Button
					data-testid="qr-refuse-button"
					variant="outline"
					className="w-full min-h-11"
					onClick={onRefuse}
					disabled={isAccepting || isRefusing}
					aria-label="Refuse relationship analysis"
				>
					{isRefusing ? (
						<>
							<Loader2 className="h-4 w-4 mr-2 motion-safe:animate-spin" />
							Refusing...
						</>
					) : (
						"Refuse"
					)}
				</Button>
			</div>
		</div>
	);
}

function ExpiredTokenState() {
	return (
		<div
			data-testid="qr-accept-expired"
			className="min-h-[calc(100dvh-3.5rem)] bg-background flex flex-col items-center justify-center px-6 text-center gap-4"
		>
			<XCircle className="h-12 w-12 text-muted-foreground" />
			<h1 className="text-xl font-semibold text-foreground">QR Code Expired</h1>
			<p className="text-sm text-muted-foreground max-w-sm">
				This QR code has expired. Ask the person who invited you to generate a new one.
			</p>
		</div>
	);
}

function AssessmentRequiredState({ initiatorName }: { initiatorName: string }) {
	return (
		<div
			data-testid="qr-accept-assessment-required"
			className="min-h-[calc(100dvh-3.5rem)] bg-background flex flex-col items-center justify-center px-6 text-center gap-4"
		>
			<ClipboardList className="h-12 w-12 text-muted-foreground" />
			<h1 className="text-xl font-semibold text-foreground">Complete Your Assessment First</h1>
			<p className="text-sm text-muted-foreground max-w-sm">
				You need to complete your personality assessment before you can discover your dynamic with{" "}
				{initiatorName}.
			</p>
			<Button asChild className="min-h-11">
				<Link to="/">Start Your Assessment</Link>
			</Button>
		</div>
	);
}

function SelfInvitationState() {
	return (
		<div
			data-testid="qr-accept-self-invite"
			className="min-h-[calc(100dvh-3.5rem)] bg-background flex flex-col items-center justify-center px-6 text-center gap-4"
		>
			<UserX className="h-12 w-12 text-muted-foreground" />
			<h1 className="text-xl font-semibold text-foreground">That's Your Own Code</h1>
			<p className="text-sm text-muted-foreground max-w-sm">
				You can't analyze a relationship with yourself. Share this QR code with someone else to discover
				your dynamic together.
			</p>
		</div>
	);
}
