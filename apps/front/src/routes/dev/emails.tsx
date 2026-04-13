import { createFileRoute, redirect } from "@tanstack/react-router";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { OceanHieroglyphSet } from "@workspace/ui/components/ocean-hieroglyph-set";
import { useEffect, useState } from "react";
import { ThemeToggle } from "../../components/ThemeToggle";
import type { RenderedTemplate } from "../../lib/email-preview.server";
import { getRenderedEmailTemplates } from "../../lib/email-preview.server";

export const Route = createFileRoute("/dev/emails")({
	beforeLoad: () => {
		if (import.meta.env.PROD) {
			throw redirect({ to: "/" });
		}
	},
	component: EmailPreviewPage,
});

/* ── Category badge ────────────────────────────────────── */

const CATEGORY_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
	auth: "default",
	engagement: "secondary",
	notification: "outline",
};

/* ── Viewport presets ──────────────────────────────────── */

type Viewport = "desktop" | "mobile";

const VIEWPORT_WIDTH: Record<Viewport, number> = {
	desktop: 640,
	mobile: 375,
};

/* ── Page ──────────────────────────────────────────────── */

function EmailPreviewPage() {
	const [templates, setTemplates] = useState<RenderedTemplate[]>([]);
	const [selected, setSelected] = useState<string>("");
	const [viewport, setViewport] = useState<Viewport>("desktop");

	useEffect(() => {
		getRenderedEmailTemplates().then((data) => {
			setTemplates(data);
			if (data.length > 0) {
				setSelected(data[0].id);
			}
		});
	}, []);

	const template = templates.find((t) => t.id === selected);

	if (templates.length === 0) {
		return (
			<div className="min-h-screen bg-background flex items-center justify-center">
				<p className="text-muted-foreground">Loading templates...</p>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-background flex flex-col">
			{/* Nav */}
			<nav className="sticky top-0 z-50 flex items-center justify-between gap-4 border-b bg-background/95 backdrop-blur px-6 py-3">
				<div className="flex items-center gap-1">
					<span className="text-xl font-heading font-bold tracking-tight text-foreground">big-</span>
					<OceanHieroglyphSet size={18} />
					<span className="ml-2 text-sm text-muted-foreground font-body">Email Templates</span>
				</div>
				<div className="flex items-center gap-2">
					{/* Viewport toggle */}
					<div className="flex items-center gap-1 rounded-lg border border-border p-1">
						<button
							type="button"
							onClick={() => setViewport("desktop")}
							className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
								viewport === "desktop"
									? "bg-accent text-foreground"
									: "text-muted-foreground hover:text-foreground"
							}`}
						>
							<svg
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
								className="inline-block mr-1"
								aria-hidden="true"
							>
								<rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
								<path d="M8 21h8M12 17v4" />
							</svg>
							Desktop
						</button>
						<button
							type="button"
							onClick={() => setViewport("mobile")}
							className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
								viewport === "mobile"
									? "bg-accent text-foreground"
									: "text-muted-foreground hover:text-foreground"
							}`}
						>
							<svg
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
								className="inline-block mr-1"
								aria-hidden="true"
							>
								<rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
								<path d="M12 18h.01" />
							</svg>
							Mobile
						</button>
					</div>
					<div className="border-l pl-2">
						<ThemeToggle />
					</div>
				</div>
			</nav>

			{/* Content */}
			<div className="flex flex-1 overflow-hidden">
				{/* Sidebar */}
				<aside className="w-72 shrink-0 border-r border-border bg-card/50 overflow-y-auto">
					<div className="p-4">
						<h2 className="text-sm font-semibold text-foreground mb-3">Templates</h2>
						<div className="space-y-1">
							{templates.map((t) => (
								<button
									key={t.id}
									type="button"
									onClick={() => setSelected(t.id)}
									className={`w-full text-left px-3 py-3 rounded-lg transition-colors ${
										selected === t.id
											? "bg-accent text-foreground"
											: "text-muted-foreground hover:text-foreground hover:bg-accent/50"
									}`}
								>
									<div className="flex items-center justify-between gap-2 mb-1">
										<span className="text-sm font-medium truncate">{t.name}</span>
										<Badge variant={CATEGORY_VARIANT[t.category]} className="text-[10px] shrink-0">
											{t.category}
										</Badge>
									</div>
									<p className="text-xs text-muted-foreground truncate">{t.subject}</p>
								</button>
							))}
						</div>
					</div>
				</aside>

				{/* Preview */}
				<main className="flex-1 overflow-y-auto bg-muted/30">
					{template && (
						<div className="p-6">
							{/* Template info header */}
							<div className="mb-4 flex items-center justify-between">
								<div>
									<h3 className="text-lg font-heading font-semibold text-foreground">{template.name}</h3>
									<p className="text-sm text-muted-foreground">Subject: {template.subject}</p>
								</div>
								<Button
									variant="outline"
									size="sm"
									onClick={() => {
										const w = window.open("", "_blank");
										if (w) {
											w.document.write(template.html);
											w.document.close();
										}
									}}
								>
									<svg
										width="14"
										height="14"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="2"
										strokeLinecap="round"
										strokeLinejoin="round"
										className="mr-1"
										aria-hidden="true"
									>
										<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
										<polyline points="15 3 21 3 21 9" />
										<line x1="10" y1="14" x2="21" y2="3" />
									</svg>
									Open in tab
								</Button>
							</div>

							{/* iframe preview */}
							<div className="flex justify-center">
								<div
									className="border border-border rounded-xl overflow-hidden shadow-lg bg-white transition-all duration-300"
									style={{ width: VIEWPORT_WIDTH[viewport] }}
								>
									<iframe
										title={`Email preview: ${template.name}`}
										srcDoc={template.html}
										className="w-full border-0"
										style={{ height: 720 }}
										sandbox="allow-same-origin"
									/>
								</div>
							</div>
						</div>
					)}
				</main>
			</div>
		</div>
	);
}
