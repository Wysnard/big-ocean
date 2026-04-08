// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { OceanCode5Schema } from "@workspace/domain";
import { TooltipProvider } from "@workspace/ui/components/tooltip";
import { beforeAll, describe, expect, it } from "vitest";
import { ProfileView } from "./ProfileView";

beforeAll(() => {
	global.ResizeObserver = class {
		observe() {}
		unobserve() {}
		disconnect() {}
	};
});

const traits = [
	{ name: "openness", score: 90, level: "O", confidence: 0.85 },
	{ name: "conscientiousness", score: 60, level: "B", confidence: 0.7 },
	{ name: "extraversion", score: 40, level: "E", confidence: 0.65 },
	{ name: "agreeableness", score: 80, level: "W", confidence: 0.75 },
	{ name: "neuroticism", score: 30, level: "C", confidence: 0.6 },
] as const;

const facets = [
	{
		name: "imagination",
		traitName: "openness",
		score: 18,
		confidence: 0.82,
		level: "high",
		levelLabel: "High",
		levelDescription: "",
	},
	{
		name: "artistic_interests",
		traitName: "openness",
		score: 16,
		confidence: 0.8,
		level: "high",
		levelLabel: "High",
		levelDescription: "",
	},
	{
		name: "emotionality",
		traitName: "openness",
		score: 14,
		confidence: 0.78,
		level: "moderate",
		levelLabel: "Moderate",
		levelDescription: "",
	},
	{
		name: "adventurousness",
		traitName: "openness",
		score: 15,
		confidence: 0.79,
		level: "moderate",
		levelLabel: "Moderate",
		levelDescription: "",
	},
	{
		name: "intellect",
		traitName: "openness",
		score: 17,
		confidence: 0.84,
		level: "high",
		levelLabel: "High",
		levelDescription: "",
	},
	{
		name: "liberalism",
		traitName: "openness",
		score: 10,
		confidence: 0.7,
		level: "moderate",
		levelLabel: "Moderate",
		levelDescription: "",
	},
	{
		name: "self_efficacy",
		traitName: "conscientiousness",
		score: 10,
		confidence: 0.74,
		level: "moderate",
		levelLabel: "Moderate",
		levelDescription: "",
	},
	{
		name: "orderliness",
		traitName: "conscientiousness",
		score: 11,
		confidence: 0.73,
		level: "moderate",
		levelLabel: "Moderate",
		levelDescription: "",
	},
	{
		name: "dutifulness",
		traitName: "conscientiousness",
		score: 9,
		confidence: 0.71,
		level: "moderate",
		levelLabel: "Moderate",
		levelDescription: "",
	},
	{
		name: "achievement_striving",
		traitName: "conscientiousness",
		score: 12,
		confidence: 0.75,
		level: "moderate",
		levelLabel: "Moderate",
		levelDescription: "",
	},
	{
		name: "self_discipline",
		traitName: "conscientiousness",
		score: 8,
		confidence: 0.68,
		level: "moderate",
		levelLabel: "Moderate",
		levelDescription: "",
	},
	{
		name: "cautiousness",
		traitName: "conscientiousness",
		score: 10,
		confidence: 0.72,
		level: "moderate",
		levelLabel: "Moderate",
		levelDescription: "",
	},
	{
		name: "friendliness",
		traitName: "extraversion",
		score: 8,
		confidence: 0.67,
		level: "moderate",
		levelLabel: "Moderate",
		levelDescription: "",
	},
	{
		name: "gregariousness",
		traitName: "extraversion",
		score: 6,
		confidence: 0.62,
		level: "moderate",
		levelLabel: "Moderate",
		levelDescription: "",
	},
	{
		name: "assertiveness",
		traitName: "extraversion",
		score: 7,
		confidence: 0.64,
		level: "moderate",
		levelLabel: "Moderate",
		levelDescription: "",
	},
	{
		name: "activity_level",
		traitName: "extraversion",
		score: 5,
		confidence: 0.61,
		level: "moderate",
		levelLabel: "Moderate",
		levelDescription: "",
	},
	{
		name: "excitement_seeking",
		traitName: "extraversion",
		score: 6,
		confidence: 0.63,
		level: "moderate",
		levelLabel: "Moderate",
		levelDescription: "",
	},
	{
		name: "cheerfulness",
		traitName: "extraversion",
		score: 8,
		confidence: 0.66,
		level: "moderate",
		levelLabel: "Moderate",
		levelDescription: "",
	},
	{
		name: "trust",
		traitName: "agreeableness",
		score: 13,
		confidence: 0.77,
		level: "high",
		levelLabel: "High",
		levelDescription: "",
	},
	{
		name: "morality",
		traitName: "agreeableness",
		score: 12,
		confidence: 0.75,
		level: "moderate",
		levelLabel: "Moderate",
		levelDescription: "",
	},
	{
		name: "altruism",
		traitName: "agreeableness",
		score: 14,
		confidence: 0.79,
		level: "high",
		levelLabel: "High",
		levelDescription: "",
	},
	{
		name: "cooperation",
		traitName: "agreeableness",
		score: 13,
		confidence: 0.78,
		level: "high",
		levelLabel: "High",
		levelDescription: "",
	},
	{
		name: "modesty",
		traitName: "agreeableness",
		score: 15,
		confidence: 0.8,
		level: "high",
		levelLabel: "High",
		levelDescription: "",
	},
	{
		name: "sympathy",
		traitName: "agreeableness",
		score: 13,
		confidence: 0.77,
		level: "high",
		levelLabel: "High",
		levelDescription: "",
	},
	{
		name: "anxiety",
		traitName: "neuroticism",
		score: 5,
		confidence: 0.6,
		level: "low",
		levelLabel: "Low",
		levelDescription: "",
	},
	{
		name: "anger",
		traitName: "neuroticism",
		score: 4,
		confidence: 0.58,
		level: "low",
		levelLabel: "Low",
		levelDescription: "",
	},
	{
		name: "depression",
		traitName: "neuroticism",
		score: 3,
		confidence: 0.57,
		level: "low",
		levelLabel: "Low",
		levelDescription: "",
	},
	{
		name: "self_consciousness",
		traitName: "neuroticism",
		score: 5,
		confidence: 0.6,
		level: "low",
		levelLabel: "Low",
		levelDescription: "",
	},
	{
		name: "immoderation",
		traitName: "neuroticism",
		score: 6,
		confidence: 0.61,
		level: "moderate",
		levelLabel: "Moderate",
		levelDescription: "",
	},
	{
		name: "vulnerability",
		traitName: "neuroticism",
		score: 7,
		confidence: 0.62,
		level: "moderate",
		levelLabel: "Moderate",
		levelDescription: "",
	},
] as const;

describe("ProfileView", () => {
	it("exposes labeled regions for archetype, portrait, and traits", () => {
		render(
			<TooltipProvider>
				<ProfileView
					archetypeName="The Beacon"
					oceanCode5={OceanCode5Schema.make("OCEAR")}
					description="A dynamic force who combines curiosity with execution."
					dominantTrait="openness"
					traits={traits}
					facets={facets}
					overallConfidence={0.82}
					fullPortraitContent="# The Beacon\n\nA vivid portrait."
					messageCount={25}
				/>
			</TooltipProvider>,
		);

		expect(screen.getByRole("region", { name: "Your archetype" })).toBeInTheDocument();
		expect(screen.getByRole("region", { name: "Your portrait" })).toBeInTheDocument();
		expect(screen.getByRole("region", { name: "Your traits" })).toBeInTheDocument();
		expect(screen.getByRole("heading", { level: 1, name: "The Beacon" })).toBeInTheDocument();
	});
});
