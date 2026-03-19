/**
 * PWYW Modal — Pay What You Wish (Story 3.4)
 *
 * Congratulations bridge -> Founder's love letter -> Vincent's portrait example -> CTA
 * Uses Radix Dialog primitives from packages/ui for focus management and accessibility.
 */

import { Button } from "@workspace/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@workspace/ui/components/dialog";
import { Loader2, Sparkles } from "lucide-react";

interface PwywModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onCheckout: () => void;
	isCheckoutLoading?: boolean;
}

/** Short excerpt from Vincent's portrait, demonstrating depth and specificity */
const VINCENT_PORTRAIT_EXCERPT = `You didn't describe your process — you described your fear of not having one. What I see is someone who has turned the need for certainty into an art form so refined that even you've forgotten it started as protection.

That weekend you spent color-coding your books wasn't organization. It was architectural thinking — a level of systematic care most people can't sustain for an afternoon. You probably don't think of this as special. It is.`;

export function PwywModal({ open, onOpenChange, onCheckout, isCheckoutLoading = false }: PwywModalProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				data-testid="pwyw-modal"
				className="max-w-md sm:max-w-lg max-h-[85dvh] overflow-y-auto"
				showCloseButton
			>
				<DialogHeader>
					<DialogTitle className="text-xl font-display text-center">
						Nerin wrote you a portrait
					</DialogTitle>
					<DialogDescription className="text-center text-muted-foreground">
						A personal letter about who you are, drawn from everything you shared.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-5 pt-2">
					{/* Congratulations bridge */}
					<p className="text-sm leading-relaxed text-foreground/90 text-center">
						You've just shared something rare — a real conversation about who you are.
						Not a quiz. Not a checklist. Nerin listened to the way you think, the things
						that light you up, and the patterns you might not see yourself.
					</p>

					{/* Founder's love letter */}
					<div className="rounded-xl bg-muted/50 p-4 space-y-2">
						<p className="text-sm leading-relaxed text-foreground/85">
							I built Big Ocean because I wanted something that didn't exist — a
							portrait of who someone really is, written by something that spent
							thirty minutes listening. Not a label. Not a type. A letter.
						</p>
						<p className="text-sm leading-relaxed text-foreground/85">
							The portrait Nerin writes is unlike anything a personality test has
							ever produced. It references your exact words, names the patterns
							you might not see, and speaks directly to you — not about you.
						</p>
						<p className="text-xs text-muted-foreground text-right italic">
							— Vincent, founder
						</p>
					</div>

					{/* Vincent's portrait example */}
					<div className="space-y-2">
						<p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
							From Vincent's portrait
						</p>
						<blockquote className="rounded-lg border-l-2 border-primary/40 bg-primary/5 px-4 py-3 text-sm leading-relaxed text-foreground/80 italic max-h-32 overflow-y-auto">
							{VINCENT_PORTRAIT_EXCERPT}
						</blockquote>
					</div>

					{/* Relationship credit mention */}
					<p className="text-xs text-center text-muted-foreground">
						Your payment also includes one relationship analysis credit — discover
						how your personality compares with someone who matters to you.
					</p>

					{/* CTA */}
					<Button
						data-testid="pwyw-unlock-button"
						className="w-full min-h-12 text-base font-medium"
						onClick={onCheckout}
						disabled={isCheckoutLoading}
					>
						{isCheckoutLoading ? (
							<Loader2 className="w-5 h-5 mr-2 motion-safe:animate-spin" />
						) : (
							<Sparkles className="w-5 h-5 mr-2" />
						)}
						Unlock your portrait
					</Button>

					<p className="text-xs text-center text-muted-foreground">
						Pay what you feel it's worth — minimum EUR 1
					</p>
				</div>
			</DialogContent>
		</Dialog>
	);
}
