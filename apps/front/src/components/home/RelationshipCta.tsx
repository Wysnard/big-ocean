import { Link } from "@tanstack/react-router";
import { QrCode, Sparkles, Users } from "lucide-react";

/**
 * Prominent CTA section for relationship analysis, shown in the homepage
 * conversation flow. Communicates the value of discovering relational dynamics
 * and briefly explains the QR-based flow.
 */
export function RelationshipCta() {
	return (
		<div
			data-slot="relationship-cta"
			data-testid="relationship-cta"
			className="mt-4 overflow-hidden rounded-xl border border-[var(--embed-border)] bg-[var(--embed-bg)] backdrop-blur-[4px] transition-[background,border-color] duration-[350ms]"
		>
			{/* Header */}
			<div className="px-5 pb-0 pt-5">
				<h4 className="font-heading text-[1.05rem] font-bold leading-snug text-foreground">
					Discover how you connect
				</h4>
				<p className="mt-1 text-[.88rem] leading-relaxed text-muted-foreground">
					Both of you talk to Nerin. Then see exactly where you align&nbsp;&mdash;&nbsp;and where
					you&nbsp;don&rsquo;t.
				</p>
			</div>

			{/* Steps */}
			<div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:gap-4">
				{[
					{
						icon: Users,
						label: "Each take the dive",
						detail: "~30 minutes with Nerin, separately",
					},
					{
						icon: QrCode,
						label: "Scan a QR code together",
						detail: "In person or share a link",
					},
					{
						icon: Sparkles,
						label: "See your dynamic",
						detail: "Where you complement and where you clash",
					},
				].map((step, i) => (
					<div
						key={step.label}
						className="flex items-start gap-3 sm:flex-1 sm:flex-col sm:items-center sm:text-center"
					>
						<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 sm:h-10 sm:w-10">
							<step.icon className="h-[18px] w-[18px] text-primary sm:h-5 sm:w-5" aria-hidden="true" />
						</div>
						<div>
							<span className="mb-0.5 font-mono text-[.6rem] tracking-[.06em] text-muted-foreground sm:block">
								STEP {i + 1}
							</span>
							<p className="text-[.82rem] font-semibold leading-snug text-foreground">{step.label}</p>
							<p className="text-[.76rem] leading-snug text-muted-foreground">{step.detail}</p>
						</div>
					</div>
				))}
			</div>

			{/* CTA */}
			<div className="px-5 pb-5">
				<Link
					to="/chat"
					data-testid="relationship-cta-button"
					className="flex min-h-[44px] w-full items-center justify-center rounded-lg bg-primary px-4 py-2.5 font-heading text-[.85rem] font-semibold text-white shadow-[0_4px_14px_rgba(255,0,128,.2)] transition-[transform,box-shadow] duration-200 hover:translate-y-[-1px] hover:shadow-[0_6px_20px_rgba(255,0,128,.3)]"
				>
					Start your conversation &rarr;
				</Link>
			</div>
		</div>
	);
}
