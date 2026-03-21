// @vitest-environment jsdom

import { render } from "@testing-library/react";
import { CURATED_ARCHETYPES, lookupArchetype } from "@workspace/domain";
import { describe, expect, it } from "vitest";
import { ArchetypeCardTemplate } from "../archetype-card-template";

describe("ArchetypeCardTemplate", () => {
	describe("archetype-generic mode (no traitScores)", () => {
		it("renders archetype name", () => {
			const { container } = render(
				<ArchetypeCardTemplate
					archetypeName="The Beacon"
					oceanCode="OCEA"
					archetypeColor="#6B5CE7"
					description="A visionary leader."
					width={1200}
					height={630}
				/>,
			);
			expect(container.textContent).toContain("The Beacon");
		});

		it("renders short description when provided", () => {
			const { container } = render(
				<ArchetypeCardTemplate
					archetypeName="The Beacon"
					oceanCode="OCEA"
					archetypeColor="#6B5CE7"
					description="A visionary leader who inspires others."
					width={1200}
					height={630}
				/>,
			);
			expect(container.textContent).toContain("A visionary leader who inspires others.");
		});

		it("does not render description when not provided", () => {
			const { container } = render(
				<ArchetypeCardTemplate
					archetypeName="The Beacon"
					oceanCode="OCEA"
					archetypeColor="#6B5CE7"
					width={1200}
					height={630}
				/>,
			);
			expect(container.textContent).not.toContain("A visionary");
		});

		it("renders OCEAN code letters", () => {
			const { container } = render(
				<ArchetypeCardTemplate
					archetypeName="The Beacon"
					oceanCode="OCEA"
					archetypeColor="#6B5CE7"
					width={1200}
					height={630}
				/>,
			);
			expect(container.textContent).toContain("O");
			expect(container.textContent).toContain("C");
			expect(container.textContent).toContain("E");
			expect(container.textContent).toContain("A");
		});

		it("renders SVG shapes (5 total)", () => {
			const { container } = render(
				<ArchetypeCardTemplate
					archetypeName="The Beacon"
					oceanCode="OCEA"
					archetypeColor="#6B5CE7"
					width={1200}
					height={630}
				/>,
			);
			const svgs = container.querySelectorAll("svg");
			expect(svgs.length).toBe(5);
		});

		it("renders default label when no displayName", () => {
			const { container } = render(
				<ArchetypeCardTemplate
					archetypeName="The Beacon"
					oceanCode="OCEA"
					archetypeColor="#6B5CE7"
					width={1200}
					height={630}
				/>,
			);
			expect(container.textContent).toContain("PERSONALITY ARCHETYPE");
		});

		it("renders wordmark", () => {
			const { container } = render(
				<ArchetypeCardTemplate
					archetypeName="The Beacon"
					oceanCode="OCEA"
					archetypeColor="#6B5CE7"
					width={1200}
					height={630}
				/>,
			);
			expect(container.textContent).toContain("big-ocean");
		});
	});

	describe("personalized mode (with traitScores)", () => {
		it("renders display name in label", () => {
			const { container } = render(
				<ArchetypeCardTemplate
					archetypeName="The Beacon"
					oceanCode="OCEAR"
					displayName="Alex"
					traitScores={{
						openness: 95,
						conscientiousness: 72,
						extraversion: 88,
						agreeableness: 60,
						neuroticism: 45,
					}}
					dominantColor="#A855F7"
					width={1080}
					height={1920}
				/>,
			);
			expect(container.textContent).toContain("ALEX'S PERSONALITY");
		});
	});

	describe("all 81 archetypes", () => {
		it("every curated archetype code has a valid lookup", () => {
			const codes = Object.keys(CURATED_ARCHETYPES);
			expect(codes.length).toBe(81);

			for (const code of codes) {
				const archetype = lookupArchetype(code);
				expect(archetype.name).toBeTruthy();
				expect(archetype.description).toBeTruthy();
				expect(archetype.color).toMatch(/^#[0-9a-fA-F]{6}$/);
				expect(archetype.code4).toBe(code);
			}
		});

		it("every curated archetype can render a card template", () => {
			const codes = Object.keys(CURATED_ARCHETYPES);

			for (const code of codes) {
				const archetype = lookupArchetype(code);
				const { container } = render(
					<ArchetypeCardTemplate
						archetypeName={archetype.name}
						oceanCode={code}
						archetypeColor={archetype.color}
						description={archetype.description.slice(0, 100)}
						width={1200}
						height={630}
					/>,
				);
				expect(container.textContent).toContain(archetype.name);
			}
		});
	});
});
