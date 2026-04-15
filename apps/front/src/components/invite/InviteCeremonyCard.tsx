import { ChevronRight } from "lucide-react";
import { useInviteCeremony } from "./InviteCeremonyProvider";

export type InviteCeremonyPlacement = "circle-bottom" | "me-section" | "public-profile";

interface InviteCeremonyCardProps {
	placement: InviteCeremonyPlacement;
}

export function InviteCeremonyCard({ placement }: InviteCeremonyCardProps) {
	const { openCeremony } = useInviteCeremony();

	return (
		<button
			type="button"
			data-testid="invite-ceremony-card"
			data-placement={placement}
			aria-label="Invite someone you care about into your Circle"
			onClick={() => {
				openCeremony();
			}}
			className="group flex w-full items-center justify-between gap-4 rounded-[2rem] border border-dashed border-border/80 bg-card/60 p-6 text-left shadow-sm transition-colors hover:border-primary/40 hover:bg-card sm:p-8"
		>
			<div className="space-y-1">
				<p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">Circle</p>
				<p className="font-heading text-lg font-semibold text-foreground sm:text-xl">
					Invite someone you care about
					<span className="ml-1 text-primary" aria-hidden="true">
						→
					</span>
				</p>
				<p className="text-sm leading-6 text-muted-foreground">
					Send a private invitation—link, QR, or share sheet.
				</p>
			</div>
			<ChevronRight
				className="size-6 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
				aria-hidden="true"
			/>
		</button>
	);
}
