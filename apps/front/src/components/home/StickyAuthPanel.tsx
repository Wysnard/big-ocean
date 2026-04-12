/**
 * Sticky Auth Panel
 *
 * Right-side panel with logo, hook line, signup form (or continue link),
 * tagline, and OCEAN breathing shapes.
 */

import { Link } from "@tanstack/react-router";
import { OceanHieroglyphSet } from "@workspace/ui/components/ocean-hieroglyph-set";
import { HomepageSignupForm } from "./HomepageSignupForm";

interface StickyAuthPanelProps {
	isAuthenticated: boolean;
}

export function StickyAuthPanel({ isAuthenticated }: StickyAuthPanelProps) {
	return (
		<div
			data-slot="sticky-auth-panel"
			data-testid="sticky-auth-panel"
			className="flex h-full flex-col items-center justify-center px-8 py-12"
		>
			{/* Brand mark */}
			<div className="mb-4 flex items-center gap-1.5">
				<span className="font-heading text-2xl font-bold tracking-tight text-foreground">big-</span>
				<OceanHieroglyphSet size={20} />
			</div>

			{/* Hook line — static placeholder (Story 9.2 adds scroll-linked transitions) */}
			<p
				data-slot="hook-line"
				data-testid="hook-line"
				className="mb-6 text-center font-heading text-lg font-medium text-foreground"
			>
				A conversation that sees you.
			</p>

			{/* Auth-aware content */}
			<div className="w-full max-w-xs">
				{isAuthenticated ? (
					<Link
						to="/chat"
						data-testid="continue-to-nerin"
						className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-secondary font-heading text-base font-semibold text-white transition-[transform,box-shadow] duration-200 hover:translate-y-[-2px] hover:shadow-[0_8px_28px_rgba(255,0,128,.28)]"
					>
						Continue to Nerin &rarr;
					</Link>
				) : (
					<HomepageSignupForm />
				)}
			</div>

			{/* "Already have an account?" link */}
			{!isAuthenticated && (
				<p className="mt-3 text-sm text-muted-foreground">
					Already have an account?{" "}
					<Link
						to="/login"
						search={{ sessionId: undefined, redirectTo: undefined }}
						data-testid="login-link"
						className="font-medium text-foreground underline underline-offset-4 transition-colors hover:text-primary"
					>
						Log in
					</Link>
				</p>
			)}

			{/* Tagline */}
			<p
				data-slot="tagline"
				data-testid="tagline"
				className="mt-4 font-mono text-xs tracking-wide text-muted-foreground"
			>
				~30 min &middot; Free &middot; No credit card
			</p>

			{/* OCEAN breathing shapes — scaled for panel */}
			<div
				data-slot="ocean-shapes"
				data-testid="ocean-shapes"
				className="relative mt-8 h-[160px] w-full max-w-xs"
				aria-hidden="true"
			>
				{/* Openness Circle */}
				<div
					className="absolute top-[5px] left-[20px] h-[70px] w-[70px] rounded-full motion-safe:animate-[breathe_6s_ease-in-out_infinite]"
					style={{ backgroundColor: "var(--trait-openness)", opacity: 0.8 }}
				/>

				{/* Conscientiousness Rectangle */}
				<div
					className="absolute top-[25px] right-[15px] h-[72px] w-[48px] rotate-12 rounded-[6px] motion-safe:animate-[breathe_6s_ease-in-out_infinite]"
					style={{
						backgroundColor: "var(--trait-conscientiousness)",
						opacity: 0.75,
						animationDelay: "-1.2s",
					}}
				/>

				{/* Extraversion Triangle */}
				<div
					className="absolute bottom-[10px] left-[45px] motion-safe:animate-[breathe_6s_ease-in-out_infinite]"
					style={{
						width: 0,
						height: 0,
						borderLeft: "30px solid transparent",
						borderRight: "30px solid transparent",
						borderBottom: "60px solid var(--trait-extraversion)",
						opacity: 0.7,
						animationDelay: "-2.4s",
					}}
				/>

				{/* Agreeableness Half-circle */}
				<div
					className="absolute right-[25px] bottom-[15px] h-[32px] w-[64px] rounded-t-full motion-safe:animate-[breathe_6s_ease-in-out_infinite]"
					style={{
						backgroundColor: "var(--trait-agreeableness)",
						opacity: 0.75,
						animationDelay: "-3.6s",
					}}
				/>

				{/* Neuroticism Diamond */}
				<div
					className="absolute top-[65px] left-[120px] h-[36px] w-[36px] rotate-45 motion-safe:animate-[breathe_6s_ease-in-out_infinite]"
					style={{ backgroundColor: "var(--trait-neuroticism)", opacity: 0.85, animationDelay: "-4.8s" }}
				/>
			</div>
		</div>
	);
}
