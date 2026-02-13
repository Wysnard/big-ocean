// @vitest-environment jsdom

import { render } from "@testing-library/react";
import { TRAIT_LETTER_MAP } from "@workspace/domain";
import { describe, expect, it, vi } from "vitest";
import { GeometricSignature } from "./GeometricSignature";

describe("GeometricSignature", () => {
	describe("letter-to-size mapping", () => {
		it("maps all High letters to large shapes (1.0x baseSize)", () => {
			// O=Open-minded, D=Disciplined, E=Extravert, W=Warm, S=Sensitive — all High
			const highCode = "ODEWS";
			const { container } = render(<GeometricSignature oceanCode={highCode} baseSize={32} />);
			const svgs = container.querySelectorAll("svg");

			expect(svgs).toHaveLength(5);
			for (const svg of svgs) {
				expect(svg.getAttribute("height")).toBe("32");
			}
		});

		it("maps all Low letters to small shapes (0.5x baseSize)", () => {
			// P=Practical, F=Flexible, I=Introvert, C=Candid, R=Resilient — all Low
			const lowCode = "PFICR";
			const { container } = render(<GeometricSignature oceanCode={lowCode} baseSize={32} />);
			const svgs = container.querySelectorAll("svg");

			expect(svgs).toHaveLength(5);
			for (const svg of svgs) {
				expect(svg.getAttribute("height")).toBe("16");
			}
		});

		it("maps all Mid letters to medium shapes (0.75x baseSize)", () => {
			// G=Grounded, B=Balanced, A=Ambivert, N=Negotiator, T=Temperate — all Mid
			const midCode = "GBANT";
			const { container } = render(<GeometricSignature oceanCode={midCode} baseSize={32} />);
			const svgs = container.querySelectorAll("svg");

			expect(svgs).toHaveLength(5);
			for (const svg of svgs) {
				expect(svg.getAttribute("height")).toBe("24");
			}
		});

		it("maps mixed codes to correct size tiers", () => {
			// O=High(32), B=Mid(24), I=Low(16), W=High(32), T=Mid(24)
			const { container } = render(<GeometricSignature oceanCode="OBIWT" baseSize={32} />);
			const svgs = container.querySelectorAll("svg");

			expect(svgs[0].getAttribute("height")).toBe("32"); // O → large
			expect(svgs[1].getAttribute("height")).toBe("24"); // B → medium
			expect(svgs[2].getAttribute("height")).toBe("16"); // I → small
			expect(svgs[3].getAttribute("height")).toBe("32"); // W → large
			expect(svgs[4].getAttribute("height")).toBe("24"); // T → medium
		});

		it("maps every valid trait letter to a known size", () => {
			for (const [, letters] of Object.entries(TRAIT_LETTER_MAP)) {
				const [low, mid, high] = letters;

				const { container: lowContainer } = render(
					<GeometricSignature oceanCode={`${low}${low}${low}${low}${low}`} baseSize={40} />,
				);
				const lowSvg = lowContainer.querySelector("svg");
				expect(lowSvg?.getAttribute("height")).toBe("20"); // 40 * 0.5

				const { container: midContainer } = render(
					<GeometricSignature oceanCode={`${mid}${mid}${mid}${mid}${mid}`} baseSize={40} />,
				);
				const midSvg = midContainer.querySelector("svg");
				expect(midSvg?.getAttribute("height")).toBe("30"); // 40 * 0.75

				const { container: highContainer } = render(
					<GeometricSignature oceanCode={`${high}${high}${high}${high}${high}`} baseSize={40} />,
				);
				const highSvg = highContainer.querySelector("svg");
				expect(highSvg?.getAttribute("height")).toBe("40"); // 40 * 1.0
			}
		});
	});

	describe("rendering", () => {
		it("renders 5 shapes in OCEAN order", () => {
			const { container } = render(<GeometricSignature oceanCode="ODEWS" />);
			const slots = container.querySelectorAll("[data-slot]");
			const shapeSlots = Array.from(slots)
				.map((el) => el.getAttribute("data-slot"))
				.filter((s) => s?.startsWith("ocean-shape-"));

			expect(shapeSlots).toEqual([
				"ocean-shape-o",
				"ocean-shape-c",
				"ocean-shape-e",
				"ocean-shape-a",
				"ocean-shape-n",
			]);
		});

		it("renders with data-slot='geometric-signature'", () => {
			const { container } = render(<GeometricSignature oceanCode="ODEWS" />);
			expect(container.querySelector("[data-slot='geometric-signature']")).not.toBeNull();
		});

		it("uses trait CSS variables for colors", () => {
			const { container } = render(<GeometricSignature oceanCode="ODEWS" />);
			const svgs = container.querySelectorAll("svg");

			expect(svgs[0].getAttribute("fill")).toBe("var(--trait-openness)");
			expect(svgs[1].getAttribute("fill")).toBe("var(--trait-conscientiousness)");
			expect(svgs[2].getAttribute("fill")).toBe("var(--trait-extraversion)");
			expect(svgs[3].getAttribute("fill")).toBe("var(--trait-agreeableness)");
			expect(svgs[4].getAttribute("fill")).toBe("var(--trait-neuroticism)");
		});

		it("uses default baseSize of 32", () => {
			// ODEWS = all High → baseSize * 1.0 = 32
			const { container } = render(<GeometricSignature oceanCode="ODEWS" />);
			const svg = container.querySelector("svg");
			expect(svg?.getAttribute("height")).toBe("32");
		});

		it("renders archetype name when provided", () => {
			const { container } = render(
				<GeometricSignature oceanCode="ODEWS" archetypeName="Creative Diplomat" />,
			);
			expect(container.textContent).toContain("Creative Diplomat");
		});

		it("does not render archetype name when omitted", () => {
			const { container } = render(<GeometricSignature oceanCode="ODEWS" />);
			const nameSpans = container.querySelectorAll("span.font-heading");
			expect(nameSpans).toHaveLength(0);
		});
	});

	describe("animation", () => {
		it("does not apply animation classes when animate is false", () => {
			const { container } = render(<GeometricSignature oceanCode="ODEWS" animate={false} />);
			const animatedElements = container.querySelectorAll("[class*='animate-shape-reveal']");
			expect(animatedElements).toHaveLength(0);
		});

		it("applies animation classes when animate is true", () => {
			const { container } = render(<GeometricSignature oceanCode="ODEWS" animate />);
			const animatedElements = container.querySelectorAll("[class*='animate-shape-reveal']");
			expect(animatedElements).toHaveLength(5);
		});

		it("sets staggered animation delays when animate is true", () => {
			const { container } = render(<GeometricSignature oceanCode="ODEWS" animate />);
			const shapeWrappers = container.querySelectorAll(
				"[data-slot='geometric-signature'] > div > span",
			);

			expect(shapeWrappers).toHaveLength(5);
			for (let i = 0; i < 5; i++) {
				const style = shapeWrappers[i].getAttribute("style") ?? "";
				expect(style).toContain(`animation-delay: ${i * 200}ms`);
			}
		});

		it("applies fade-in animation delay to archetype name when animate is true", () => {
			const { container } = render(
				<GeometricSignature oceanCode="ODEWS" animate archetypeName="Creative Diplomat" />,
			);
			const nameSpan = container.querySelector("span.font-heading");
			expect(nameSpan).not.toBeNull();
			const style = nameSpan?.getAttribute("style") ?? "";
			expect(style).toContain("animation-delay: 1200ms");
		});
	});

	describe("edge cases", () => {
		it("handles short ocean codes gracefully (renders 5 shapes)", () => {
			const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
			const { container } = render(<GeometricSignature oceanCode="OD" />);
			const svgs = container.querySelectorAll("svg");
			expect(svgs).toHaveLength(5);
			warnSpy.mockRestore();
		});

		it("handles empty ocean code (renders 5 medium shapes)", () => {
			const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
			const { container } = render(<GeometricSignature oceanCode="" />);
			const svgs = container.querySelectorAll("svg");
			expect(svgs).toHaveLength(5);
			// Unknown letters fall back to medium (0.75 * 32 = 24)
			for (const svg of svgs) {
				expect(svg.getAttribute("height")).toBe("24");
			}
			warnSpy.mockRestore();
		});

		it("truncates codes longer than 5 characters", () => {
			const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
			const { container } = render(<GeometricSignature oceanCode="ODEWSX" />);
			const svgs = container.querySelectorAll("svg");
			expect(svgs).toHaveLength(5);
			warnSpy.mockRestore();
		});

		it("warns in development for invalid ocean codes", () => {
			const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

			render(<GeometricSignature oceanCode="XY" />);

			expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("Expected 5-letter OCEAN code"));
			expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Unknown trait letter "X"'));

			warnSpy.mockRestore();
		});
	});
});
