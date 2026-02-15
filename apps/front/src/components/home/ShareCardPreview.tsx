import { GeometricSignature } from "../ocean-shapes/GeometricSignature";
import { OceanShapeSet } from "../ocean-shapes/OceanShapeSet";
import { ResultPreviewEmbed } from "./ResultPreviewEmbed";

const TRAIT_BADGES = [
	{ label: "O: High", trait: "openness" },
	{ label: "C: High", trait: "conscientiousness" },
	{ label: "E: Mid", trait: "extraversion" },
	{ label: "A: High", trait: "agreeableness" },
	{ label: "N: Mid", trait: "neuroticism" },
];

export function ShareCardPreview() {
	return (
		<ResultPreviewEmbed ctaText="Share your archetype">
			{/* Social share card mockup */}
			<div
				data-slot="share-card-preview"
				className="mx-auto max-w-[400px] overflow-hidden rounded-2xl border shadow-lg"
				style={{
					aspectRatio: "1200/630",
					background: "var(--share-card-gradient)",
					borderColor: "var(--share-card-border)",
				}}
			>
				<div className="flex h-full flex-col items-center justify-center gap-3 p-6">
					{/* Brand mark */}
					<div className="flex items-center gap-1">
						<span className="font-heading text-sm font-bold text-foreground">
							big-
						</span>
						<OceanShapeSet size={16} />
					</div>

					{/* Archetype name */}
					<h3 className="font-heading text-xl font-bold text-foreground">
						The Explorer
					</h3>

					{/* Geometric Signature */}
					<GeometricSignature
						oceanCode="ODAWT"
						baseSize={24}
						animated={false}
					/>

					{/* Trait summary row */}
					<div className="flex flex-wrap justify-center gap-1">
						{TRAIT_BADGES.map((badge) => (
							<span
								key={badge.trait}
								className="rounded-md px-2 py-0.5 font-mono text-[.55rem] font-medium text-white"
								style={{
									background: `var(--trait-${badge.trait})`,
								}}
							>
								{badge.label}
							</span>
						))}
					</div>
				</div>
			</div>
		</ResultPreviewEmbed>
	);
}
