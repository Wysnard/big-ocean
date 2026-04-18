import { cn } from "@workspace/ui/lib/utils";
import { LIBRARY_PROSE_H2_SCROLL_MT_CLASS } from "@/lib/library-layout";

/** Shared longform typography for library MDX (§21.8). */
export const LIBRARY_ARTICLE_PROSE_BASE =
	"space-y-5 text-base leading-8 text-foreground/90 [&_h2]:mt-10 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h3]:mt-6 [&_h3]:text-lg [&_h3]:font-semibold [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1 [&_li]:ml-5 [&_blockquote]:border-l-2 [&_blockquote]:border-primary/30 [&_blockquote]:pl-4 [&_blockquote]:my-4 [&_blockquote]:italic [&_blockquote]:text-foreground/60 [&_strong]:font-semibold";

/** Prose wrapper with scroll margin for in-page anchors under sticky nav (§21.2). */
export function libraryArticleProseClass() {
	return cn(LIBRARY_ARTICLE_PROSE_BASE, LIBRARY_PROSE_H2_SCROLL_MT_CLASS);
}
