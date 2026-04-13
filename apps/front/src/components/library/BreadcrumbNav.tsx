import { Link } from "@tanstack/react-router";

type BreadcrumbItem = {
	label: string;
	to?: string;
};

interface BreadcrumbNavProps {
	items: BreadcrumbItem[];
}

export function BreadcrumbNav({ items }: BreadcrumbNavProps) {
	return (
		<nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
			<ol className="flex flex-wrap items-center gap-2">
				{items.map((item, index) => (
					<li key={`${item.label}-${item.to ?? "current"}`} className="flex items-center gap-2">
						{index > 0 ? <span aria-hidden="true">/</span> : null}
						{item.to ? (
							<Link
								to={item.to}
								data-testid={`library-breadcrumb-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
								className="transition-colors hover:text-foreground"
							>
								{item.label}
							</Link>
						) : (
							<span aria-current="page" className="text-foreground">
								{item.label}
							</span>
						)}
					</li>
				))}
			</ol>
		</nav>
	);
}
