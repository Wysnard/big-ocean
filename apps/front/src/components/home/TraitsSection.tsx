import { getTraitColor, getTraitGradient, type TraitName } from "@workspace/domain";
import React, { type ReactNode } from "react";
import {
	OceanCircle,
	OceanDiamond,
	OceanHalfCircle,
	OceanRectangle,
	OceanTriangle,
} from "../ocean-shapes";
import { TraitCard } from "./TraitCard";

interface TraitConfig {
	shape: (props: { size: number; color: string }) => ReactNode;
	title: string;
	humanDescription: string;
	facets: string[];
}

const TRAIT_CONFIG: Record<TraitName, TraitConfig> = {
	openness: {
		shape: ({ size, color }) => <OceanCircle size={size} color={color} />,
		title: "Openness",
		humanDescription:
			"How curious are you? How open to new ideas, experiences, and ways of seeing the world?",
		facets: [
			"Imagination",
			"Curiosity",
			"Emotionality",
			"Adventurousness",
			"Intellect",
			"Liberalism",
		],
	},
	conscientiousness: {
		shape: ({ size, color }) => <OceanHalfCircle size={size} color={color} />,
		title: "Conscientiousness",
		humanDescription: "How organized and driven are you? Do you plan ahead or go with the flow?",
		facets: [
			"Self-Efficacy",
			"Orderliness",
			"Dutifulness",
			"Achievement",
			"Self-Discipline",
			"Cautiousness",
		],
	},
	extraversion: {
		shape: ({ size, color }) => <OceanRectangle size={size} color={color} />,
		title: "Extraversion",
		humanDescription:
			"How do you recharge? Do crowds energize you, or do you need your quiet corner?",
		facets: [
			"Friendliness",
			"Gregariousness",
			"Assertiveness",
			"Activity",
			"Excitement-Seeking",
			"Cheerfulness",
		],
	},
	agreeableness: {
		shape: ({ size, color }) => <OceanTriangle size={size} color={color} />,
		title: "Agreeableness",
		humanDescription:
			"How do you navigate conflict? Are you the peacemaker or the one who speaks hard truths?",
		facets: ["Trust", "Morality", "Altruism", "Cooperation", "Modesty", "Sympathy"],
	},
	neuroticism: {
		shape: ({ size, color }) => <OceanDiamond size={size} color={color} />,
		title: "Neuroticism",
		humanDescription:
			"How do you handle stress and uncertainty? What does your emotional weather look like?",
		facets: ["Anxiety", "Anger", "Depression", "Self-Consciousness", "Immoderation", "Vulnerability"],
	},
};

const TRAIT_ORDER = [
	"openness",
	"conscientiousness",
	"extraversion",
	"agreeableness",
	"neuroticism",
] as const;

const SHAPE_SIZE_MOBILE = 32;
const SHAPE_SIZE_DESKTOP = 40;

function useResponsiveShapeSize() {
	const [size, setSize] = React.useState(SHAPE_SIZE_MOBILE);

	React.useEffect(() => {
		const mql = window.matchMedia("(min-width: 640px)");
		const update = () => setSize(mql.matches ? SHAPE_SIZE_DESKTOP : SHAPE_SIZE_MOBILE);
		update();
		mql.addEventListener("change", update);
		return () => mql.removeEventListener("change", update);
	}, []);

	return size;
}

export function TraitsSection() {
	const shapeSize = useResponsiveShapeSize();

	return (
		<section data-slot="traits-section" className="mx-auto max-w-5xl px-6 py-16">
			<h2 className="mb-2 text-center text-3xl font-bold text-foreground">
				Five Dimensions of the Deep
			</h2>
			<p className="mb-12 text-center text-muted-foreground">
				Each trait is a layer of your personality waiting to be explored
			</p>
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
				{TRAIT_ORDER.map((key) => {
					const trait = TRAIT_CONFIG[key];
					const color = getTraitColor(key);
					return (
						<TraitCard
							key={key}
							shapeElement={trait.shape({ size: shapeSize, color })}
							title={trait.title}
							color={color}
							gradient={getTraitGradient(key)}
							glow={`0 0 24px ${color}`}
							humanDescription={trait.humanDescription}
							facets={trait.facets}
							isLarge={key === "openness"}
						/>
					);
				})}
			</div>
		</section>
	);
}
