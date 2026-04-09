/**
 * PWYW Modal — Pay What You Wish (Story 3.4)
 *
 * Unified Vincent voice: opening hook -> origin story -> portrait excerpt -> PWYW philosophy -> CTA
 * Uses Radix Dialog primitives from packages/ui for focus management and accessibility.
 */

import { Button } from "@workspace/ui/components/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@workspace/ui/components/dialog";
import { Loader2, Sparkles } from "lucide-react";
import { type RefObject, useRef } from "react";
import { MAIN_CONTENT_ID } from "@/components/PageMain";

interface PwywModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onCheckout: () => void;
	isCheckoutLoading?: boolean;
	restoreFocusRef?: RefObject<HTMLElement | null>;
}

/** Short excerpt from Vincent's portrait, demonstrating depth and specificity */
const VINCENT_PORTRAIT_EXCERPT = `You didn't describe your process — you described your fear of not having one. What I see is someone who has turned the need for certainty into an art form so refined that even you've forgotten it started as protection.

That weekend you spent color-coding your books wasn't organization. It was architectural thinking — a level of systematic care most people can't sustain for an afternoon. You probably don't think of this as special. It is.`;

export function PwywModal({
	open,
	onOpenChange,
	onCheckout,
	isCheckoutLoading = false,
	restoreFocusRef,
}: PwywModalProps) {
	const unlockButtonRef = useRef<HTMLButtonElement>(null);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				data-testid="pwyw-modal"
				className="max-w-md sm:max-w-lg md:max-w-xl lg:max-w-4xl lg:p-10"
				showCloseButton
				aria-describedby={undefined}
				onOpenAutoFocus={(event) => {
					event.preventDefault();
					unlockButtonRef.current?.focus();
				}}
				onCloseAutoFocus={(event) => {
					event.preventDefault();
					const restoreTarget = restoreFocusRef?.current ?? document.getElementById(MAIN_CONTENT_ID);
					if (restoreTarget instanceof HTMLElement) {
						restoreTarget.focus();
					}
				}}
			>
				<DialogHeader>
					<DialogTitle className="text-xl font-display text-center">
						Before you see your portrait
					</DialogTitle>
				</DialogHeader>

				{/* Scrollable content — header and footer stay fixed */}
				<div className="-mx-6 lg:-mx-10 max-h-[50vh] overflow-y-auto px-6 lg:px-10">
					<div className="space-y-5">
						{/* Founder's letter — unified Vincent voice */}
						<div className="rounded-xl bg-muted/50 p-4 space-y-3">
							<p className="text-sm leading-relaxed text-foreground/85">
								What you just did with Nerin — that wasn't a personality quiz. And what she wrote about you
								isn't a report.
							</p>
							<p className="text-sm leading-relaxed text-foreground/85">
								I know, because she did it to me first.
							</p>
							<p className="text-sm leading-relaxed text-foreground/85">
								I spent years living as the person other people described — nonchalant, undisciplined,
								someone who doesn't commit. Then out of curiosity, I built Nerin — an AI that listens to how
								you think, not just what you say. I made the mistake of turning her on myself. She told me I
								was wrong about who I was. I laughed. She showed me proof from my own words. Something
								cracked open.
							</p>
							<p className="text-sm leading-relaxed text-foreground/85">
								Turns out I was never undisciplined. I was just waiting for something worth the discipline.
								The portrait is why I built Big Ocean.
							</p>
							<p className="text-sm leading-relaxed text-foreground/85">
								This is a piece of what she wrote about me:
							</p>
						</div>

						{/* Vincent's portrait excerpt */}
						<blockquote className="rounded-lg border-l-2 border-primary/40 bg-primary/5 px-4 py-3 text-sm leading-relaxed text-foreground/80 italic">
							{VINCENT_PORTRAIT_EXCERPT}
						</blockquote>

						{/* Post-excerpt — still Vincent's voice */}
						<div className="space-y-2 text-center">
							<p className="text-sm leading-relaxed text-foreground/85 italic">
								I still re-read mine — usually when I forget why I'm doing this.
							</p>
							<p className="text-sm leading-relaxed text-foreground/90">
								Yours is ready. Written from everything you just shared with Nerin. I can't put a price on
								something this personal. So I won't.
							</p>
							<p className="text-xs text-muted-foreground text-right italic">— Vincent, founder</p>
						</div>
					</div>
				</div>

				{/* Sticky footer — always visible below scroll area */}
				<div className="space-y-3 pt-2">
					<Button
						ref={unlockButtonRef}
						data-testid="pwyw-unlock-button"
						size="lg"
						className="w-full min-h-12 text-base font-medium"
						onClick={onCheckout}
						disabled={isCheckoutLoading}
					>
						{isCheckoutLoading ? <Loader2 className="motion-safe:animate-spin" /> : <Sparkles />}
						Unlock your portrait
					</Button>

					<p className="text-sm text-center text-muted-foreground font-medium">
						Pay what you wish — starting at EUR 1
					</p>

					<p className="text-xs text-center text-muted-foreground">
						Includes one relationship credit — compare your personality with someone who matters to you.
					</p>
				</div>
			</DialogContent>
		</Dialog>
	);
}
