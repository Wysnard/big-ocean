import { BIG_FIVE_TRAITS, TRAIT_TO_FACETS } from "@workspace/domain";
import { OceanCircle } from "../ocean-shapes/OceanCircle";
import { OceanDiamond } from "../ocean-shapes/OceanDiamond";
import { OceanHalfCircle } from "../ocean-shapes/OceanHalfCircle";
import { OceanRectangle } from "../ocean-shapes/OceanRectangle";
import { OceanTriangle } from "../ocean-shapes/OceanTriangle";

const TRAIT_DESCRIPTIONS: Record<string, string> = {
	openness:
		"Your appetite for novelty, imagination, and intellectual exploration. High scorers chase abstract ideas; low scorers prefer the practical and familiar.",
	conscientiousness:
		"Your relationship with structure, discipline, and long-term goals. How you navigate the tension between ambition and spontaneity.",
	extraversion:
		"Where you draw energy and how you spend it. Beyond introvert vs extrovert—your assertiveness, social warmth, and relationship with excitement.",
	agreeableness:
		"How you balance your needs with others'. Your capacity for trust, empathy, cooperation, and the strategies you use to navigate conflict.",
	neuroticism:
		"Your emotional landscape—intensity, frequency, and texture of negative emotions. Not a weakness. Understanding this is understanding your emotional OS.",
};

function TraitShape({ trait, size }: { trait: string; size: number }) {
	const color = `var(--trait-${trait})`;
	switch (trait) {
		case "openness":
			return <OceanCircle size={size} color={color} />;
		case "conscientiousness":
			return <OceanHalfCircle size={size} color={color} />;
		case "extraversion":
			return <OceanRectangle size={size} color={color} />;
		case "agreeableness":
			return <OceanTriangle size={size} color={color} />;
		case "neuroticism":
			return <OceanDiamond size={size} color={color} />;
		default:
			return null;
	}
}

function formatFacetName(facet: string): string {
	return facet
		.split("_")
		.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
		.join("-");
}

export function TraitCarouselEmbed() {
	return (
		<div
			data-slot="trait-carousel-embed"
			className="mt-[14px] flex flex-col gap-3 rounded-xl border border-[var(--embed-border)] bg-[var(--embed-bg)] p-5 backdrop-blur-[4px] transition-[background,border-color] duration-[350ms]"
		>
			{BIG_FIVE_TRAITS.map((trait) => {
				const facets = TRAIT_TO_FACETS[trait] ?? [];
				return (
					<div
						key={trait}
						className="flex gap-4 max-[900px]:flex-col max-[900px]:items-center max-[900px]:text-center"
					>
						<div className="flex w-[40px] shrink-0 items-start justify-center pt-1">
							<TraitShape trait={trait} size={32} />
						</div>
						<div className="min-w-0 flex-1">
							<div
								className="mb-1 font-heading text-[1.05rem] font-bold"
								style={{ color: `var(--trait-${trait})` }}
							>
								{trait.charAt(0).toUpperCase() + trait.slice(1)}
							</div>
							<p className="text-[.82rem] leading-[1.55] text-[var(--muted-dynamic)] transition-colors duration-[350ms]">
								{TRAIT_DESCRIPTIONS[trait]}
							</p>
							<div className="mt-2 flex flex-wrap gap-1 max-[900px]:justify-center">
								{facets.map((facet) => (
									<span
										key={facet}
										className="rounded-[5px] border px-2 py-[3px] font-mono text-[.58rem] transition-[background,border-color,color] duration-[350ms]"
										style={{
											background: "var(--pill-bg)",
											borderColor: "var(--pill-border)",
											color: "var(--pill-color)",
										}}
									>
										{formatFacetName(facet)}
									</span>
								))}
							</div>
						</div>
					</div>
				);
			})}
		</div>
	);
}
