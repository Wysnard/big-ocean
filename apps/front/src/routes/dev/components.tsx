import { ClientOnly, createFileRoute, redirect } from "@tanstack/react-router";
import type {
	FacetName,
	FacetResult,
	OceanCode4,
	OceanCode5,
	TraitLevel,
	TraitResult,
} from "@workspace/domain";
import { TRAIT_TO_FACETS } from "@workspace/domain";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@workspace/ui/components/card";
import { NerinMessage } from "@workspace/ui/components/chat";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@workspace/ui/components/dialog";
import { Input } from "@workspace/ui/components/input";
import { OceanHieroglyph } from "@workspace/ui/components/ocean-hieroglyph";
import { OceanHieroglyphCode } from "@workspace/ui/components/ocean-hieroglyph-code";
import { OceanHieroglyphSet } from "@workspace/ui/components/ocean-hieroglyph-set";
import { OceanSkeleton } from "@workspace/ui/components/ocean-skeleton";
import { OceanSpinner } from "@workspace/ui/components/ocean-spinner";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@workspace/ui/components/sheet";
import { Switch } from "@workspace/ui/components/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@workspace/ui/components/tooltip";
import { useState } from "react";
import { ErrorBanner } from "../../components/ErrorBanner";
import { ArchetypeCard } from "../../components/results/ArchetypeCard";
import { ConfidenceRingCard } from "../../components/results/ConfidenceRingCard";
import { DetailZone } from "../../components/results/DetailZone";
import { PersonalityRadarChart } from "../../components/results/PersonalityRadarChart";
import { TraitCard } from "../../components/results/TraitCard";
import { ThemeToggle } from "../../components/ThemeToggle";

export const Route = createFileRoute("/dev/components")({
	beforeLoad: () => {
		if (import.meta.env.PROD) {
			throw redirect({ to: "/" });
		}
	},
	component: KitchenSinkPage,
});

/* ── Navigation ─────────────────────────────────────────── */

const SECTIONS = [
	{ id: "foundation", label: "Foundation" },
	{ id: "primitives", label: "Primitives" },
	{ id: "identity", label: "Identity" },
	{ id: "chat", label: "Chat" },
	{ id: "results", label: "Results" },
	{ id: "charts", label: "Charts" },
	{ id: "modals", label: "Modals" },
	{ id: "depth", label: "Depth Zones" },
] as const;

function StickyNav() {
	return (
		<nav className="sticky top-0 z-50 flex items-center justify-between gap-4 border-b bg-background/95 backdrop-blur px-6 py-3">
			<div className="flex items-center gap-1">
				<span className="text-xl font-heading font-bold tracking-tight text-foreground">big-</span>
				<OceanHieroglyphSet size={18} />
				<span className="ml-2 text-sm text-muted-foreground font-body">Kitchen Sink</span>
			</div>
			<div className="flex items-center gap-1">
				{SECTIONS.map((s) => (
					<a
						key={s.id}
						href={`#${s.id}`}
						className="px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
					>
						{s.label}
					</a>
				))}
				<div className="ml-2 border-l pl-2">
					<ThemeToggle />
				</div>
			</div>
		</nav>
	);
}

/* ── Helpers ────────────────────────────────────────────── */

function SectionHeading({ id, title, subtitle }: { id: string; title: string; subtitle: string }) {
	return (
		<div id={id} className="scroll-mt-16 mb-8">
			<h2 className="text-display font-heading font-bold text-foreground">{title}</h2>
			<p className="text-body text-muted-foreground mt-1">{subtitle}</p>
		</div>
	);
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
	return (
		<div className="mb-12">
			<h3 className="text-h3 font-heading font-semibold text-foreground mb-4 border-b border-border pb-2">
				{title}
			</h3>
			{children}
		</div>
	);
}

function Swatch({
	name,
	cssVar,
	isGradient,
}: {
	name: string;
	cssVar: string;
	isGradient?: boolean;
}) {
	return (
		<div className="flex flex-col items-center gap-2">
			<div
				className="w-16 h-16 rounded-xl border border-border shadow-sm"
				style={isGradient ? { background: `var(${cssVar})` } : { backgroundColor: `var(${cssVar})` }}
			/>
			<span className="text-caption text-muted-foreground text-center leading-tight">{name}</span>
		</div>
	);
}

/* ── Section 1: Foundation ──────────────────────────────── */

function FoundationSection() {
	return (
		<section className="mb-20">
			<SectionHeading
				id="foundation"
				title="Foundation"
				subtitle="The raw design tokens that define Big Ocean's visual language"
			/>

			<SubSection title="Semantic Colors">
				<div className="flex flex-wrap gap-4">
					<Swatch name="Primary" cssVar="--primary" />
					<Swatch name="Primary Hover" cssVar="--primary-hover" />
					<Swatch name="Secondary" cssVar="--secondary" />
					<Swatch name="Tertiary" cssVar="--tertiary" />
					<Swatch name="Accent" cssVar="--accent" />
					<Swatch name="Background" cssVar="--background" />
					<Swatch name="Card" cssVar="--card" />
					<Swatch name="Muted" cssVar="--muted" />
					<Swatch name="Border" cssVar="--border" />
					<Swatch name="Destructive" cssVar="--destructive" />
					<Swatch name="Success" cssVar="--success" />
					<Swatch name="Warning" cssVar="--warning" />
				</div>
			</SubSection>

			<SubSection title="Trait Colors">
				<div className="flex flex-wrap gap-4">
					<Swatch name="Openness" cssVar="--trait-openness" />
					<Swatch name="Conscientiousness" cssVar="--trait-conscientiousness" />
					<Swatch name="Extraversion" cssVar="--trait-extraversion" />
					<Swatch name="Agreeableness" cssVar="--trait-agreeableness" />
					<Swatch name="Neuroticism" cssVar="--trait-neuroticism" />
				</div>
				<h4 className="text-body-sm font-semibold text-foreground mt-6 mb-3">Accent Pairs</h4>
				<div className="flex flex-wrap gap-4">
					<Swatch name="O Accent" cssVar="--trait-openness-accent" />
					<Swatch name="C Accent" cssVar="--trait-conscientiousness-accent" />
					<Swatch name="E Accent" cssVar="--trait-extraversion-accent" />
					<Swatch name="A Accent" cssVar="--trait-agreeableness-accent" />
					<Swatch name="N Accent" cssVar="--trait-neuroticism-accent" />
				</div>

				<h4 className="text-body-sm font-semibold text-foreground mt-6 mb-3">Facet Colors (30)</h4>
				{(
					[
						{
							trait: "Openness",
							facets: [
								"imagination",
								"artistic_interests",
								"emotionality",
								"adventurousness",
								"intellect",
								"liberalism",
							],
						},
						{
							trait: "Conscientiousness",
							facets: [
								"self_efficacy",
								"orderliness",
								"dutifulness",
								"achievement_striving",
								"self_discipline",
								"cautiousness",
							],
						},
						{
							trait: "Extraversion",
							facets: [
								"friendliness",
								"gregariousness",
								"assertiveness",
								"activity_level",
								"excitement_seeking",
								"cheerfulness",
							],
						},
						{
							trait: "Agreeableness",
							facets: ["trust", "morality", "altruism", "cooperation", "modesty", "sympathy"],
						},
						{
							trait: "Neuroticism",
							facets: [
								"anxiety",
								"anger",
								"depression",
								"self_consciousness",
								"immoderation",
								"vulnerability",
							],
						},
					] as const
				).map((group) => (
					<div key={group.trait} className="mt-3">
						<p className="text-caption text-muted-foreground mb-2 font-semibold uppercase tracking-wide">
							{group.trait}
						</p>
						<div className="flex flex-wrap gap-3">
							{group.facets.map((f) => (
								<Swatch key={f} name={f.replace(/_/g, " ")} cssVar={`--facet-${f}`} />
							))}
						</div>
					</div>
				))}
			</SubSection>

			<SubSection title="Gradients">
				<div className="flex flex-wrap gap-4">
					<div className="flex flex-col items-center gap-2">
						<div
							className="w-48 h-16 rounded-xl border border-border"
							style={{ background: "var(--gradient-celebration)" }}
						/>
						<span className="text-caption text-muted-foreground">Celebration</span>
					</div>
					<div className="flex flex-col items-center gap-2">
						<div
							className="w-48 h-16 rounded-xl border border-border"
							style={{ background: "var(--gradient-progress)" }}
						/>
						<span className="text-caption text-muted-foreground">Progress</span>
					</div>
					<div className="flex flex-col items-center gap-2">
						<div
							className="w-48 h-16 rounded-xl border border-border"
							style={{ background: "var(--gradient-surface-glow)" }}
						/>
						<span className="text-caption text-muted-foreground">Surface Glow</span>
					</div>
				</div>
				<h4 className="text-body-sm font-semibold text-foreground mt-6 mb-3">Trait Gradients</h4>
				<div className="flex flex-wrap gap-4">
					{(
						["openness", "conscientiousness", "extraversion", "agreeableness", "neuroticism"] as const
					).map((t) => (
						<div key={t} className="flex flex-col items-center gap-2">
							<div
								className="w-32 h-12 rounded-xl border border-border"
								style={{ background: `var(--gradient-trait-${t})` }}
							/>
							<span className="text-caption text-muted-foreground capitalize">{t}</span>
						</div>
					))}
				</div>
			</SubSection>

			<SubSection title="Typography">
				<div className="space-y-4">
					<div>
						<span className="text-caption text-muted-foreground">
							Display Hero · Space Grotesk · 3.5rem
						</span>
						<p style={{ fontSize: "var(--text-display-hero)", fontFamily: "var(--font-heading)" }}>
							big-ocean
						</p>
					</div>
					<div>
						<span className="text-caption text-muted-foreground">Display XL · Space Grotesk · 3rem</span>
						<p style={{ fontSize: "var(--text-display-xl)", fontFamily: "var(--font-heading)" }}>
							Discover who you are
						</p>
					</div>
					<div>
						<span className="text-caption text-muted-foreground">Display · Space Grotesk · 2.25rem</span>
						<p style={{ fontSize: "var(--text-display)", fontFamily: "var(--font-heading)" }}>
							Your personality portrait
						</p>
					</div>
					<div>
						<span className="text-caption text-muted-foreground">H1 · Space Grotesk · 1.875rem</span>
						<p style={{ fontSize: "var(--text-h1)", fontFamily: "var(--font-heading)" }}>
							Assessment Results
						</p>
					</div>
					<div>
						<span className="text-caption text-muted-foreground">H2 · Space Grotesk · 1.5rem</span>
						<p style={{ fontSize: "var(--text-h2)", fontFamily: "var(--font-heading)" }}>
							Trait Breakdown
						</p>
					</div>
					<div>
						<span className="text-caption text-muted-foreground">H3 · Space Grotesk · 1.25rem</span>
						<p style={{ fontSize: "var(--text-h3)", fontFamily: "var(--font-heading)" }}>Facet Detail</p>
					</div>
					<div>
						<span className="text-caption text-muted-foreground">H4 · Space Grotesk · 1.125rem</span>
						<p style={{ fontSize: "var(--text-h4)", fontFamily: "var(--font-heading)" }}>
							Evidence Panel
						</p>
					</div>
					<div>
						<span className="text-caption text-muted-foreground">Body · DM Sans · 1rem</span>
						<p style={{ fontSize: "var(--text-body)", fontFamily: "var(--font-body)" }}>
							The Big Five personality model captures the broadest dimensions of human personality through
							five independent trait domains.
						</p>
					</div>
					<div>
						<span className="text-caption text-muted-foreground">Body Small · DM Sans · 0.875rem</span>
						<p style={{ fontSize: "var(--text-body-sm)", fontFamily: "var(--font-body)" }}>
							Each trait is broken into six facets for a more nuanced picture.
						</p>
					</div>
					<div>
						<span className="text-caption text-muted-foreground">Caption · DM Sans · 0.75rem</span>
						<p style={{ fontSize: "var(--text-caption)", fontFamily: "var(--font-body)" }}>
							Score: 85/120 · Confidence: 72%
						</p>
					</div>
					<div>
						<span className="text-caption text-muted-foreground">Data · JetBrains Mono · 1rem</span>
						<p style={{ fontSize: "var(--text-data)", fontFamily: "var(--font-data)" }}>
							OCEAN Code: HHMHM · Score: 92.4
						</p>
					</div>
				</div>
			</SubSection>

			<SubSection title="Spacing Scale">
				<div className="flex flex-wrap items-end gap-4">
					{[
						{ name: "1 (4px)", size: "4px" },
						{ name: "2 (8px)", size: "8px" },
						{ name: "3 (12px)", size: "12px" },
						{ name: "4 (16px)", size: "16px" },
						{ name: "6 (24px)", size: "24px" },
						{ name: "8 (32px)", size: "32px" },
						{ name: "12 (48px)", size: "48px" },
						{ name: "16 (64px)", size: "64px" },
					].map((s) => (
						<div key={s.name} className="flex flex-col items-center gap-1">
							<div
								className="bg-primary/30 border border-primary/50 rounded"
								style={{ width: s.size, height: s.size }}
							/>
							<span className="text-caption text-muted-foreground">{s.name}</span>
						</div>
					))}
				</div>
			</SubSection>

			<SubSection title="Border Radius">
				<div className="flex flex-wrap gap-6">
					{[
						{ name: "Button (12px)", var: "--radius-button" },
						{ name: "Input (12px)", var: "--radius-input" },
						{ name: "Card (16px)", var: "--radius-card" },
						{ name: "Dialog (24px)", var: "--radius-dialog" },
						{ name: "Hero (32px)", var: "--radius-hero" },
						{ name: "Chat Bubble (16px)", var: "--radius-chat-bubble" },
						{ name: "Chat Sender (4px)", var: "--radius-chat-sender" },
						{ name: "Full", var: "--radius-full" },
					].map((r) => (
						<div key={r.name} className="flex flex-col items-center gap-2">
							<div
								className="w-20 h-20 bg-primary/20 border-2 border-primary/50"
								style={{ borderRadius: `var(${r.var})` }}
							/>
							<span className="text-caption text-muted-foreground text-center">{r.name}</span>
						</div>
					))}
				</div>
			</SubSection>
		</section>
	);
}

/* ── Section 2: Primitives ──────────────────────────────── */

function PrimitivesSection() {
	return (
		<section className="mb-20">
			<SectionHeading
				id="primitives"
				title="Primitives"
				subtitle="Base UI components from shadcn/ui in all their variants"
			/>

			<SubSection title="Button">
				<div className="space-y-4">
					<div className="flex flex-wrap items-center gap-3">
						<Button variant="default">Primary</Button>
						<Button variant="secondary">Secondary</Button>
						<Button variant="outline">Outline</Button>
						<Button variant="ghost">Ghost</Button>
						<Button variant="link">Link</Button>
						<Button variant="destructive">Destructive</Button>
					</div>
					<div className="flex flex-wrap items-center gap-3">
						<Button size="sm">Small</Button>
						<Button size="default">Default</Button>
						<Button size="lg">Large</Button>
						<Button size="icon">+</Button>
					</div>
					<div className="flex flex-wrap items-center gap-3">
						<Button disabled>Disabled</Button>
						<Button variant="outline" disabled>
							Disabled Outline
						</Button>
					</div>
				</div>
			</SubSection>

			<SubSection title="Input">
				<div className="max-w-md space-y-3">
					<Input placeholder="Default input" />
					<Input placeholder="Disabled input" disabled />
					<Input type="email" placeholder="Email input" />
					<Input type="password" placeholder="Password input" />
				</div>
			</SubSection>

			<SubSection title="Badge">
				<div className="flex flex-wrap gap-3">
					<Badge variant="default">Default</Badge>
					<Badge variant="secondary">Secondary</Badge>
					<Badge variant="destructive">Destructive</Badge>
					<Badge variant="outline">Outline</Badge>
				</div>
			</SubSection>

			<SubSection title="Switch">
				<div className="flex items-center gap-6">
					<div className="flex items-center gap-2">
						<Switch defaultChecked />
						<span className="text-sm text-foreground">On</span>
					</div>
					<div className="flex items-center gap-2">
						<Switch />
						<span className="text-sm text-foreground">Off</span>
					</div>
					<div className="flex items-center gap-2">
						<Switch size="sm" defaultChecked />
						<span className="text-sm text-foreground">Small</span>
					</div>
					<div className="flex items-center gap-2">
						<Switch disabled />
						<span className="text-sm text-muted-foreground">Disabled</span>
					</div>
				</div>
			</SubSection>

			<SubSection title="Card">
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					<Card>
						<CardHeader>
							<CardTitle>Simple Card</CardTitle>
							<CardDescription>A basic card with header and content</CardDescription>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-foreground">
								Cards are the primary container for content in Big Ocean.
							</p>
						</CardContent>
					</Card>
					<Card>
						<CardHeader>
							<CardTitle>Card with Footer</CardTitle>
							<CardDescription>Includes actions at the bottom</CardDescription>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-foreground">Content area for information.</p>
						</CardContent>
						<CardFooter>
							<Button size="sm">Action</Button>
						</CardFooter>
					</Card>
					<Card className="border-primary/30">
						<CardHeader>
							<CardTitle>Highlighted Card</CardTitle>
							<CardDescription>With a primary border accent</CardDescription>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-foreground">For emphasizing important content.</p>
						</CardContent>
					</Card>
				</div>
			</SubSection>

			<SubSection title="Tooltip">
				<div className="flex gap-4">
					<Tooltip>
						<TooltipTrigger asChild>
							<Button variant="outline">Hover me</Button>
						</TooltipTrigger>
						<TooltipContent>This is a tooltip</TooltipContent>
					</Tooltip>
					<Tooltip>
						<TooltipTrigger asChild>
							<Button variant="ghost">And me</Button>
						</TooltipTrigger>
						<TooltipContent side="bottom">Tooltip on bottom</TooltipContent>
					</Tooltip>
				</div>
			</SubSection>

			<SubSection title="Error Banner">
				<ErrorBanner
					message="Something went wrong. Please try again."
					onRetry={() => {}}
					onDismiss={() => {}}
					autoDismissMs={0}
				/>
			</SubSection>
		</section>
	);
}

/* ── Section 3: Identity ────────────────────────────────── */

function IdentitySection() {
	return (
		<section className="mb-20">
			<SectionHeading
				id="identity"
				title="Identity"
				subtitle="The components and visual elements that make Big Ocean unique"
			/>

			<SubSection title="Logo">
				<div className="flex items-center gap-8">
					<div className="flex items-center gap-1">
						<span className="text-xl font-heading font-bold tracking-tight text-foreground">big-</span>
						<OceanHieroglyphSet size={20} />
					</div>
					<div className="flex items-center gap-1">
						<span className="text-3xl font-heading font-bold tracking-tight text-foreground">big-</span>
						<OceanHieroglyphSet size={30} />
					</div>
					<div className="flex items-center gap-1 text-muted-foreground">
						<span className="text-xl font-heading font-bold tracking-tight">big-</span>
						<OceanHieroglyphSet size={20} mono />
					</div>
				</div>
			</SubSection>

			<SubSection title="Ocean Hieroglyph Set (OCEAN)">
				<div className="flex flex-wrap gap-8 items-end">
					<div className="flex flex-col items-center gap-2">
						<OceanHieroglyphSet size={32} />
						<span className="text-caption text-muted-foreground">Color (32px)</span>
					</div>
					<div className="flex flex-col items-center gap-2">
						<OceanHieroglyphSet size={48} />
						<span className="text-caption text-muted-foreground">Color (48px)</span>
					</div>
					<div className="flex flex-col items-center gap-2">
						<OceanHieroglyphSet size={32} mono />
						<span className="text-caption text-muted-foreground">Monochrome</span>
					</div>
				</div>
			</SubSection>

			<SubSection title="All Hieroglyphs">
				<div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-6">
					{(
						[
							{ name: "Circle (O)", letter: "O", trait: "openness" },
							{ name: "Half Circle (C)", letter: "C", trait: "conscientiousness" },
							{ name: "Rectangle (E)", letter: "E", trait: "extraversion" },
							{ name: "Triangle (A)", letter: "A", trait: "agreeableness" },
							{ name: "Diamond (N)", letter: "N", trait: "neuroticism" },
							{ name: "Cross (T)", letter: "T", trait: "openness" },
							{ name: "Cut Square (M)", letter: "M", trait: "openness" },
							{ name: "Oval (I)", letter: "I", trait: "extraversion" },
							{ name: "Quarter (B)", letter: "B", trait: "extraversion" },
							{ name: "Inverted Triangle (V)", letter: "V", trait: "neuroticism" },
							{ name: "Lollipop (P)", letter: "P", trait: "agreeableness" },
							{ name: "Reversed Half Circle (D)", letter: "D", trait: "agreeableness" },
							{ name: "Three Quarter Square (F)", letter: "F", trait: "conscientiousness" },
							{ name: "Double Quarter (S)", letter: "S", trait: "conscientiousness" },
							{ name: "Table (R)", letter: "R", trait: "neuroticism" },
						] satisfies Array<{ name: string; letter: TraitLevel; trait: string }>
					).map((shape) => (
						<div key={shape.letter} className="flex flex-col items-center gap-2">
							<span data-trait={shape.trait}>
								<OceanHieroglyph letter={shape.letter} style={{ width: 40, height: 40 }} />
							</span>
							<span className="text-caption text-muted-foreground text-center leading-tight">
								{shape.name}
							</span>
						</div>
					))}
				</div>
			</SubSection>

			<SubSection title="Ocean Hieroglyph Codes">
				<p className="text-sm text-muted-foreground mb-4">
					Each OCEAN code maps to a unique 5-glyph signature. Here are some examples:
				</p>
				<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
					{(["OCELR", "MCBPV", "TFIAN", "OSBDN", "TCEPN"] as OceanCode5[]).map((code) => (
						<div key={code} className="flex flex-col items-center gap-2">
							<OceanHieroglyphCode code={code} size={36} />
							<span
								className="text-sm font-data font-bold tracking-widest"
								style={{ fontFamily: "var(--font-data)" }}
							>
								{code}
							</span>
						</div>
					))}
				</div>
			</SubSection>
		</section>
	);
}

/* ── Ocean Loading Components ──────────────────────────── */

function OceanLoadingSection() {
	const [skeletonCount, setSkeletonCount] = useState(0);

	return (
		<section className="space-y-8">
			<SectionHeading
				id="ocean-loading"
				title="Ocean Loading"
				subtitle="Branded loading components built on the Ocean Hieroglyph system"
			/>

			<SubSection title="Ocean Spinner">
				<p className="text-sm text-muted-foreground mb-4">
					SVG morphing spinner using flubber. Each hieroglyph smoothly warps into the next.
				</p>
				<div className="flex flex-wrap gap-8 items-end">
					<div className="flex flex-col items-center gap-2">
						<OceanSpinner size={48} />
						<span className="text-caption text-muted-foreground">Default (48px)</span>
					</div>
					<div className="flex flex-col items-center gap-2">
						<OceanSpinner size={32} duration={2} />
						<span className="text-caption text-muted-foreground">Slow (2s)</span>
					</div>
					<div className="flex flex-col items-center gap-2">
						<OceanSpinner size={16} mono />
						<span className="text-caption text-muted-foreground">Inline Mono (16px)</span>
					</div>
					<div className="flex flex-col items-center gap-2">
						<OceanSpinner code="OCA" size={36} />
						<span className="text-caption text-muted-foreground">Custom Code</span>
					</div>
					<div className="flex flex-col items-center gap-2">
						<Button disabled>
							<OceanSpinner size={16} mono />
							Processing...
						</Button>
						<span className="text-caption text-muted-foreground">In Button</span>
					</div>
				</div>
			</SubSection>

			<SubSection title="Ocean Skeleton">
				<p className="text-sm text-muted-foreground mb-4">
					Progressive glyph assembly. Controlled via revealedCount or self-animating with autoReveal.
				</p>
				<div className="flex flex-wrap gap-8 items-end">
					<div className="flex flex-col items-center gap-2">
						<OceanSkeleton autoReveal />
						<span className="text-caption text-muted-foreground">Auto (default)</span>
					</div>
					<div className="flex flex-col items-center gap-2">
						<OceanSkeleton autoReveal interval={400} size={24} />
						<span className="text-caption text-muted-foreground">Fast (400ms, 24px)</span>
					</div>
					<div className="flex flex-col items-center gap-2">
						<OceanSkeleton autoReveal mono />
						<span className="text-caption text-muted-foreground">Mono</span>
					</div>
					<div className="flex flex-col items-center gap-2">
						<OceanSkeleton code="OCA" autoReveal size={36} />
						<span className="text-caption text-muted-foreground">Custom Code</span>
					</div>
				</div>

				<div className="mt-6 space-y-3">
					<p className="text-sm text-muted-foreground">
						Controlled mode — drag the slider to reveal glyphs:
					</p>
					<div className="flex items-center gap-4">
						<input
							type="range"
							min={0}
							max={5}
							value={skeletonCount}
							onChange={(e) => setSkeletonCount(Number(e.target.value))}
							className="w-48"
						/>
						<span className="text-sm font-data">{skeletonCount}/5</span>
					</div>
					<OceanSkeleton revealedCount={skeletonCount} size={40} />
				</div>
			</SubSection>
		</section>
	);
}

/* ── Mock Data ──────────────────────────────────────────── */

const MOCK_TRAITS: TraitResult[] = [
	{ name: "openness", score: 95, level: "H", confidence: 0.88 },
	{ name: "conscientiousness", score: 72, level: "M", confidence: 0.82 },
	{ name: "extraversion", score: 45, level: "M", confidence: 0.75 },
	{ name: "agreeableness", score: 88, level: "H", confidence: 0.91 },
	{ name: "neuroticism", score: 30, level: "L", confidence: 0.79 },
];

function makeMockFacets(): FacetResult[] {
	const scores: Record<string, number[]> = {
		openness: [16, 14, 18, 15, 17, 15],
		conscientiousness: [12, 11, 13, 12, 14, 10],
		extraversion: [8, 7, 9, 6, 8, 7],
		agreeableness: [15, 14, 16, 14, 15, 14],
		neuroticism: [5, 4, 6, 5, 5, 5],
	};
	const result: FacetResult[] = [];
	for (const trait of MOCK_TRAITS) {
		const facetNames = TRAIT_TO_FACETS[trait.name];
		const traitScores = scores[trait.name];
		for (let i = 0; i < facetNames.length; i++) {
			const score = traitScores[i];
			result.push({
				name: facetNames[i],
				traitName: trait.name,
				score,
				confidence: 0.7 + Math.random() * 0.25,
				level: score < 7 ? "L" : score < 14 ? "M" : "H",
				levelLabel: score < 7 ? "Low" : score < 14 ? "Moderate" : "High",
				levelDescription: "",
			});
		}
	}
	return result;
}

const MOCK_FACETS = makeMockFacets();

const MOCK_EVIDENCE = [
	{
		id: "ev-1",
		assessmentMessageId: "msg-1",
		facetName: "imagination" as FacetName,
		quote: "I often find myself daydreaming about completely different lives I could lead",
		score: 16,
		confidence: 0.82,
		domain: "solo",
		deviation: 3,
		highlightRange: { start: 0, end: 50 },
		createdAt: new Date(),
	},
	{
		id: "ev-2",
		assessmentMessageId: "msg-2",
		facetName: "imagination" as FacetName,
		quote: "When I read a book, I can see every detail of the world in my mind",
		score: 14,
		confidence: 0.75,
		domain: "leisure",
		deviation: 2,
		highlightRange: { start: 0, end: 40 },
		createdAt: new Date(),
	},
	{
		id: "ev-3",
		assessmentMessageId: "msg-3",
		facetName: "artistic_interests" as FacetName,
		quote: "I signed up for a pottery class even though I've never done anything artistic before",
		score: 12,
		confidence: 0.68,
		domain: "leisure",
		deviation: 1,
		highlightRange: { start: 0, end: 55 },
		createdAt: new Date(),
	},
	{
		id: "ev-4",
		assessmentMessageId: "msg-4",
		facetName: "adventurousness" as FacetName,
		quote: "Trying new foods in a foreign country is one of my favourite things",
		score: 8,
		confidence: 0.55,
		domain: "leisure",
		deviation: -1,
		highlightRange: { start: 0, end: 45 },
		createdAt: new Date(),
	},
	{
		id: "ev-5",
		assessmentMessageId: "msg-5",
		facetName: "intellect" as FacetName,
		quote: "I love debating ideas with people who think completely differently from me",
		score: 18,
		confidence: 0.9,
		domain: "work",
		deviation: 4,
		highlightRange: { start: 0, end: 50 },
		createdAt: new Date(),
	},
];

function getMockFacetDetails(traitName: string) {
	const facetNames = TRAIT_TO_FACETS[traitName as keyof typeof TRAIT_TO_FACETS] ?? [];
	return facetNames.map((name) => {
		const facet = MOCK_FACETS.find((f) => f.name === name);
		return {
			name: name as FacetName,
			score: facet?.score ?? 10,
			confidence: facet?.confidence ?? 0.75,
			evidence: MOCK_EVIDENCE.filter((ev) => ev.facetName === name),
		};
	});
}

/* ── Section 4: Chat ────────────────────────────────────── */

function ChatSection() {
	return (
		<section className="mb-20">
			<SectionHeading
				id="chat"
				title="Chat"
				subtitle="Conversation components as they appear in the assessment"
			/>

			<SubSection title="Nerin Messages">
				<div className="max-w-2xl space-y-3">
					<NerinMessage>
						<p>
							Welcome! I'm Nerin, and I'd love to learn more about you. Let's have a conversation to
							explore your personality. There are no right or wrong answers.
						</p>
					</NerinMessage>
					<NerinMessage>
						<p>Great energy! Tell me about a time you tried something completely new. How did it feel?</p>
					</NerinMessage>
				</div>
			</SubSection>

			<SubSection title="User Messages">
				<div className="max-w-2xl space-y-3">
					<div className="flex flex-row-reverse items-end gap-[11px]">
						<div
							className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-xs font-bold"
							style={{
								background:
									"linear-gradient(to bottom right, var(--user-avatar-from), var(--user-avatar-to))",
								color: "var(--user-avatar-fg)",
							}}
						>
							V
						</div>
						<div
							className="max-w-[88%] px-[22px] py-4 text-sm text-white"
							style={{
								background: "linear-gradient(to bottom right, var(--primary), var(--secondary))",
								borderRadius: "18px",
								borderBottomRightRadius: "5px",
							}}
						>
							<p>
								Hi Nerin! I recently signed up for a pottery class even though I've never done anything
								artistic before. It was scary at first but I loved how meditative it felt.
							</p>
						</div>
					</div>
				</div>
			</SubSection>

			<SubSection title="Chat Input Bar">
				<div className="max-w-2xl">
					<div
						className="flex items-end gap-2 px-6 py-3 border-t"
						style={{
							backgroundColor: "var(--input-bar-bg)",
							borderColor: "var(--input-bar-border)",
							backdropFilter: "blur(14px)",
						}}
					>
						<div
							className="flex-1 px-3 py-2 rounded-xl text-sm min-h-[40px]"
							style={{
								backgroundColor: "var(--input-field-bg)",
								border: "1px solid var(--input-field-border)",
								color: "var(--input-field-color)",
							}}
						>
							Type your message...
						</div>
						<Button size="icon" className="shrink-0 rounded-xl" aria-label="Send message">
							<svg
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
								aria-hidden="true"
							>
								<path d="M5 12h14M12 5l7 7-7 7" />
							</svg>
						</Button>
					</div>
				</div>
			</SubSection>

			<SubSection title="Typing Indicator">
				<div className="max-w-2xl">
					<NerinMessage>
						<div className="flex items-center gap-1 py-1">
							{[0, 1, 2].map((i) => (
								<span
									key={i}
									className="w-2 h-2 rounded-full bg-muted-foreground/50"
									style={{ animation: `float 1s ease-in-out ${i * 150}ms infinite` }}
								/>
							))}
						</div>
					</NerinMessage>
				</div>
			</SubSection>

			<SubSection title="Milestone Badge">
				<div className="max-w-2xl flex justify-center">
					<div className="inline-flex items-center gap-2 rounded-full border border-accent bg-accent/50 px-4 py-2 text-sm text-muted-foreground">
						<span>✨</span>
						<span>Halfway there — exploring deeper patterns</span>
					</div>
				</div>
			</SubSection>
		</section>
	);
}

/* ── Section 5: Results ─────────────────────────────────── */

function ResultsSection() {
	const [selectedTrait, setSelectedTrait] = useState<string | null>(null);

	return (
		<section className="mb-20">
			<SectionHeading
				id="results"
				title="Results"
				subtitle="Assessment results grid with real TraitCards, ArchetypeCard, and OCEAN layout"
			/>

			<SubSection title="Archetype Card">
				<div className="max-w-2xl">
					<ArchetypeCard
						archetypeName="The Contemplative Explorer"
						oceanCode4={"HMMH" as OceanCode4}
						oceanCode5={"OSBPR" as OceanCode5}
						description="A curious mind with a steady compass — you seek depth in ideas and warmth in connections, navigating the world with quiet confidence and open-hearted pragmatism."
						color="#A855F7"
						isCurated
						overallConfidence={84}
					/>
				</div>
			</SubSection>

			<SubSection title="Trait Cards Grid + Detail Zone">
				<p className="text-sm text-muted-foreground mb-4">
					Real TraitCard components with mock data. Click a card to expand its Detail Zone with facet
					evidence.
				</p>
				<div className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-5">
					{/* Row 1: O, C, E */}
					{MOCK_TRAITS.slice(0, 3).map((trait) => (
						<TraitCard
							key={trait.name}
							trait={trait}
							facets={MOCK_FACETS.filter((f) => f.traitName === trait.name)}
							isSelected={selectedTrait === trait.name}
							onToggle={(name) => setSelectedTrait(selectedTrait === name ? null : name)}
						/>
					))}

					{/* Detail Zone for Row 1 */}
					{selectedTrait &&
						["openness", "conscientiousness", "extraversion"].includes(selectedTrait) &&
						(() => {
							const trait = MOCK_TRAITS.find((t) => t.name === selectedTrait);
							if (!trait) return null;
							return (
								<DetailZone
									trait={trait}
									facetDetails={getMockFacetDetails(selectedTrait)}
									isOpen
									onClose={() => setSelectedTrait(null)}
									isLoading={false}
								/>
							);
						})()}

					{/* Row 2: A, N */}
					{MOCK_TRAITS.slice(3).map((trait) => (
						<TraitCard
							key={trait.name}
							trait={trait}
							facets={MOCK_FACETS.filter((f) => f.traitName === trait.name)}
							isSelected={selectedTrait === trait.name}
							onToggle={(name) => setSelectedTrait(selectedTrait === name ? null : name)}
						/>
					))}

					{/* Detail Zone for Row 2 */}
					{selectedTrait &&
						["agreeableness", "neuroticism"].includes(selectedTrait) &&
						(() => {
							const trait = MOCK_TRAITS.find((t) => t.name === selectedTrait);
							if (!trait) return null;
							return (
								<DetailZone
									trait={trait}
									facetDetails={getMockFacetDetails(selectedTrait)}
									isOpen
									onClose={() => setSelectedTrait(null)}
									isLoading={false}
								/>
							);
						})()}
				</div>
			</SubSection>

			<SubSection title="Score Levels">
				<div className="flex flex-wrap gap-4">
					{[
						{ label: "High", var: "--score-high" },
						{ label: "Medium", var: "--score-medium" },
						{ label: "Low", var: "--score-low" },
					].map((s) => (
						<div key={s.label} className="flex items-center gap-2">
							<div className="w-4 h-4 rounded-full" style={{ backgroundColor: `var(${s.var})` }} />
							<span className="text-sm text-foreground">{s.label}</span>
						</div>
					))}
				</div>
			</SubSection>
		</section>
	);
}

/* ── Section 6: Charts ──────────────────────────────────── */

function ChartsSection() {
	return (
		<section className="mb-20">
			<SectionHeading
				id="charts"
				title="Charts"
				subtitle="Data visualization components powered by Recharts"
			/>

			<SubSection title="Personality Radar Chart">
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-3xl">
					<PersonalityRadarChart traits={MOCK_TRAITS} />
					<PersonalityRadarChart traits={MOCK_TRAITS} showExternalLabels standalone />
				</div>
			</SubSection>

			<SubSection title="Confidence Ring">
				<div className="max-w-xs">
					<ConfidenceRingCard confidence={0.84} messageCount={12} />
				</div>
			</SubSection>
		</section>
	);
}

/* ── Section 7: Modals ──────────────────────────────────── */

function ModalsSection() {
	return (
		<section className="mb-20">
			<SectionHeading id="modals" title="Modals" subtitle="Dialog, Sheet, and overlay components" />

			<SubSection title="Dialog">
				<div className="flex flex-wrap gap-4">
					<Dialog>
						<DialogTrigger asChild>
							<Button variant="outline">Open Dialog</Button>
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>Confirm Action</DialogTitle>
								<DialogDescription>
									This is a dialog component. It centers on screen with an overlay backdrop.
								</DialogDescription>
							</DialogHeader>
							<div className="py-4">
								<p className="text-sm text-foreground">
									Dialog content goes here. This is where you'd place forms, confirmations, or detailed
									information.
								</p>
							</div>
							<DialogFooter>
								<Button variant="outline">Cancel</Button>
								<Button>Confirm</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>

					<Dialog>
						<DialogTrigger asChild>
							<Button variant="outline">Dialog with Form</Button>
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>Edit Profile</DialogTitle>
								<DialogDescription>Make changes to your profile here.</DialogDescription>
							</DialogHeader>
							<div className="space-y-4 py-4">
								<div className="space-y-2">
									<label htmlFor="dev-display-name" className="text-sm font-medium text-foreground">
										Display Name
									</label>
									<Input id="dev-display-name" placeholder="Enter your name" defaultValue="Vincentlay" />
								</div>
								<div className="space-y-2">
									<label htmlFor="dev-email" className="text-sm font-medium text-foreground">
										Email
									</label>
									<Input id="dev-email" type="email" placeholder="your@email.com" />
								</div>
							</div>
							<DialogFooter>
								<Button variant="outline">Cancel</Button>
								<Button>Save Changes</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>
				</div>
			</SubSection>

			<SubSection title="Sheet (Side Panel)">
				<div className="flex flex-wrap gap-4">
					<Sheet>
						<SheetTrigger asChild>
							<Button variant="outline">Open Right Sheet</Button>
						</SheetTrigger>
						<SheetContent side="right">
							<SheetHeader>
								<SheetTitle>Side Panel</SheetTitle>
								<SheetDescription>
									Slides in from the right. Great for settings, filters, or detail views.
								</SheetDescription>
							</SheetHeader>
							<div className="p-4 space-y-4">
								<Card>
									<CardHeader>
										<CardTitle>Panel Content</CardTitle>
									</CardHeader>
									<CardContent>
										<p className="text-sm text-muted-foreground">
											You can place any content inside a sheet — cards, forms, lists.
										</p>
									</CardContent>
								</Card>
							</div>
						</SheetContent>
					</Sheet>

					<Sheet>
						<SheetTrigger asChild>
							<Button variant="outline">Open Left Sheet</Button>
						</SheetTrigger>
						<SheetContent side="left">
							<SheetHeader>
								<SheetTitle>Navigation</SheetTitle>
								<SheetDescription>Left sheets work well for navigation or mobile menus.</SheetDescription>
							</SheetHeader>
							<div className="p-4 space-y-2">
								{["Home", "Assessment", "Results", "Profile", "Settings"].map((item) => (
									<div key={item} className="px-3 py-2 rounded-lg hover:bg-accent text-sm cursor-pointer">
										{item}
									</div>
								))}
							</div>
						</SheetContent>
					</Sheet>
				</div>
			</SubSection>
		</section>
	);
}

/* ── Section 5: Depth Zones ─────────────────────────────── */

function DepthSection() {
	return (
		<section className="mb-20">
			<SectionHeading
				id="depth"
				title="Depth Zones"
				subtitle="The ocean metaphor translated into visual hierarchy"
			/>

			<div className="space-y-0 rounded-2xl overflow-hidden border border-border">
				{[
					{ name: "Surface", var: "--depth-surface", desc: "Primary background, top-level content" },
					{
						name: "Shallows",
						var: "--depth-shallows",
						desc: "Slightly recessed areas, secondary panels",
					},
					{ name: "Mid", var: "--depth-mid", desc: "Deeper content zones, sidebars" },
					{ name: "Deep", var: "--depth-deep", desc: "Deepest layer, footer, immersive sections" },
				].map((zone) => (
					<div
						key={zone.name}
						className="px-8 py-12 flex items-center justify-between"
						style={{ backgroundColor: `var(${zone.var})` }}
					>
						<div>
							<h3 className="text-h3 font-heading font-bold text-foreground">{zone.name}</h3>
							<p className="text-sm text-muted-foreground mt-1">{zone.desc}</p>
						</div>
						<span
							className="text-caption font-data text-muted-foreground"
							style={{ fontFamily: "var(--font-data)" }}
						>
							{zone.var}
						</span>
					</div>
				))}
			</div>

			<div className="mt-8">
				<h3 className="text-h3 font-heading font-semibold text-foreground mb-4">Components at Depth</h3>
				<p className="text-sm text-muted-foreground mb-6">
					Seeing how components feel at different depth levels.
				</p>
				<div className="space-y-0 rounded-2xl overflow-hidden border border-border">
					{[
						{ name: "Surface", var: "--depth-surface" },
						{ name: "Shallows", var: "--depth-shallows" },
						{ name: "Mid", var: "--depth-mid" },
						{ name: "Deep", var: "--depth-deep" },
					].map((zone) => (
						<div
							key={zone.name}
							className="px-8 py-8 flex flex-wrap items-center gap-4"
							style={{ backgroundColor: `var(${zone.var})` }}
						>
							<span className="text-caption font-semibold text-muted-foreground w-20">{zone.name}</span>
							<Button size="sm">Button</Button>
							<Button size="sm" variant="outline">
								Outline
							</Button>
							<Badge>Badge</Badge>
							<Input className="max-w-[160px]" placeholder="Input..." />
							<OceanHieroglyphSet size={20} />
						</div>
					))}
				</div>
			</div>
		</section>
	);
}

/* ── Main Page ──────────────────────────────────────────── */

function KitchenSinkPage() {
	return (
		<div className="min-h-screen bg-background">
			<StickyNav />
			<main className="max-w-6xl mx-auto px-6 py-12">
				<FoundationSection />
				<PrimitivesSection />
				<IdentitySection />
				<ChatSection />
				<ResultsSection />
				<ChartsSection />
				<ModalsSection />
				<DepthSection />
				<ClientOnly fallback={null}>
					<OceanLoadingSection />
				</ClientOnly>

				<footer className="text-center py-12 border-t border-border">
					<p className="text-sm text-muted-foreground">
						big-ocean Kitchen Sink · Dev Only · Toggle theme to compare light & dark modes
					</p>
				</footer>
			</main>
		</div>
	);
}
