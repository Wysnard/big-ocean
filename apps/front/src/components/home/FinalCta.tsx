import { Link } from "@tanstack/react-router";

export function FinalCta() {
	return (
		<section
			data-slot="final-cta"
			data-testid="final-cta"
			className="mx-auto max-w-[900px] px-6 pb-32 pt-8 text-center sm:pb-40 min-[1200px]:max-w-[1000px] min-[1440px]:max-w-[1100px]"
		>
			<h2 className="mb-4 font-heading text-[clamp(1.8rem,4vw,2.8rem)] font-bold leading-tight text-foreground">
				A portrait you can return to.
			</h2>
			<p className="mx-auto mb-8 max-w-[480px] text-[1.05rem] leading-relaxed text-muted-foreground">
				Spend one focused conversation with Nerin. Leave with a written portrait of who you are—and
				somewhere steady to come back to as you grow.
			</p>
			<Link
				to="/chat"
				data-testid="final-cta-button"
				className="inline-flex min-h-[44px] items-center gap-[10px] rounded-xl bg-gradient-to-r from-primary to-secondary px-[38px] py-[16px] font-heading text-[1rem] font-semibold text-white transition-[transform,box-shadow] duration-200 hover:translate-y-[-2px] hover:shadow-[0_8px_28px_rgba(255,0,128,.28)]"
			>
				Start your conversation &rarr;
			</Link>
		</section>
	);
}
