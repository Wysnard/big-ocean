import { Card, CardContent, CardFooter, CardHeader } from "@workspace/ui/components/card";
import { OceanHieroglyphSet } from "@workspace/ui/components/ocean-hieroglyph-set";
import { LoginForm } from "../auth/login-form";
import { useHomepagePhase } from "./DepthScrollProvider";
import { HomepageDynamicHook } from "./HomepageDynamicHook";

export function StickyAuthPanel() {
	const currentPhase = useHomepagePhase();

	return (
		<aside className="hidden lg:block" aria-label="Log in">
			{/* Match global Header (h-14): sticky below header, height = viewport minus header — avoid h-screen extending past fold */}
			<div className="sticky top-14 z-10 flex h-[calc(100dvh-3.5rem)] min-h-0 items-center px-6 py-8 xl:px-10">
				<Card
					data-homepage-slot="sticky-auth-panel"
					data-testid="sticky-auth-panel"
					data-phase={currentPhase}
					className="homepage-card-surface h-full w-full gap-0 overflow-hidden rounded-lg border-border/70 p-0 shadow-[0_22px_60px_rgba(26,26,46,0.12)] backdrop-blur"
				>
					<div className="flex min-h-0 flex-1 flex-col justify-center py-8">
						<CardHeader className="flex flex-col gap-8 border-0 px-8 pt-0 pb-4">
							<div className="flex items-center gap-2 text-foreground">
								<span className="font-heading text-2xl font-bold tracking-tight">big-</span>
								<OceanHieroglyphSet size={22} />
							</div>

							<div className="flex flex-col gap-4">
								<HomepageDynamicHook />
								<p className="max-w-sm text-sm leading-6 text-muted-foreground">
									~30 minutes with Nerin. A portrait written in language you'll recognize.
								</p>
							</div>
						</CardHeader>

						<CardContent className="px-8 py-0">
							<LoginForm variant="embed" />
						</CardContent>

						<CardFooter className="px-8 pt-4 pb-0">
							<p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
								~30 min · Free · No credit card
							</p>
						</CardFooter>
					</div>
				</Card>
			</div>
		</aside>
	);
}
