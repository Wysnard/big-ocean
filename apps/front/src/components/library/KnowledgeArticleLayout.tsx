import type { ReactNode } from "react";
import { PageMain } from "@/components/PageMain";
import type { LibraryTier } from "@/lib/library-content";
import { AssessmentCTA } from "./AssessmentCTA";
import { LibraryNav } from "./LibraryNav";

interface KnowledgeArticleLayoutProps {
	title: string;
	description: string;
	tier: LibraryTier;
	children: ReactNode;
	supplementary?: ReactNode;
	ctaText?: string;
}

export function KnowledgeArticleLayout({
	title,
	description,
	tier,
	children,
	supplementary,
	ctaText,
}: KnowledgeArticleLayoutProps) {
	return (
		<>
			<LibraryNav activeTier={tier} articleTitle={title} />
			<PageMain title={title} className="bg-background px-4 py-10 sm:px-6 lg:px-8">
				<div className="mx-auto max-w-6xl">
					<div className="rounded-[2rem] border border-border/70 bg-linear-to-br from-primary/[0.04] via-background to-primary/[0.07] p-6 shadow-sm sm:p-8">
						<header className="max-w-3xl">
							<p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
								Knowledge Library
							</p>
							<h1 className="mt-3 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
								{title}
							</h1>
							<p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">{description}</p>
						</header>
					</div>

					<div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
						<article className="rounded-[2rem] border border-border/70 bg-background p-6 shadow-sm sm:p-8">
							<div className="space-y-5 text-base leading-8 text-foreground/90 [&_h2]:mt-10 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h3]:mt-6 [&_h3]:text-lg [&_h3]:font-semibold [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1 [&_li]:ml-5 [&_blockquote]:border-l-2 [&_blockquote]:border-primary/30 [&_blockquote]:pl-4 [&_blockquote]:my-4 [&_blockquote]:italic [&_blockquote]:text-foreground/60 [&_strong]:font-semibold">
								{children}
							</div>
						</article>

						<div className="space-y-6">
							{supplementary}
							<AssessmentCTA tier={tier} ctaText={ctaText} />
						</div>
					</div>
				</div>
			</PageMain>
		</>
	);
}
