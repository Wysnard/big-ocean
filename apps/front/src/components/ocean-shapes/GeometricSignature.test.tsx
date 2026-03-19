// @vitest-environment jsdom

import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { GeometricSignature } from "./GeometricSignature";

describe("GeometricSignature", () => {
	describe("letter-to-shape mapping", () => {
		it("renders unique data-slot per letter for all High letters", () => {
			// O, C, E, A, N — all High
			const { container } = render(<GeometricSignature oceanCode="OCEAN" baseSize={32} />);
			const svgs = container.querySelectorAll("svg");

			expect(svgs).toHaveLength(5);
			expect(svgs[0].getAttribute("data-slot")).toBe("ocean-shape-o");
			expect(svgs[1].getAttribute("data-slot")).toBe("ocean-shape-c");
			expect(svgs[2].getAttribute("data-slot")).toBe("ocean-shape-e");
			expect(svgs[3].getAttribute("data-slot")).toBe("ocean-shape-a");
			expect(svgs[4].getAttribute("data-slot")).toBe("ocean-shape-n");
		});

		it("renders unique data-slot per letter for all Low letters", () => {
			// T, F, I, D, R — all Low
			const { container } = render(<GeometricSignature oceanCode="TFIDR" baseSize={32} />);
			const svgs = container.querySelectorAll("svg");

			expect(svgs).toHaveLength(5);
			expect(svgs[0].getAttribute("data-slot")).toBe("ocean-shape-t");
			expect(svgs[1].getAttribute("data-slot")).toBe("ocean-shape-f");
			expect(svgs[2].getAttribute("data-slot")).toBe("ocean-shape-i");
			expect(svgs[3].getAttribute("data-slot")).toBe("ocean-shape-d");
			expect(svgs[4].getAttribute("data-slot")).toBe("ocean-shape-r");
		});

		it("renders unique data-slot per letter for all Mid letters", () => {
			// M, S, B, P, V — all Mid
			const { container } = render(<GeometricSignature oceanCode="MSBPV" baseSize={32} />);
			const svgs = container.querySelectorAll("svg");

			expect(svgs).toHaveLength(5);
			expect(svgs[0].getAttribute("data-slot")).toBe("ocean-shape-m");
			expect(svgs[1].getAttribute("data-slot")).toBe("ocean-shape-s");
			expect(svgs[2].getAttribute("data-slot")).toBe("ocean-shape-b");
			expect(svgs[3].getAttribute("data-slot")).toBe("ocean-shape-p");
			expect(svgs[4].getAttribute("data-slot")).toBe("ocean-shape-v");
		});

		it("renders mixed codes with correct per-letter shapes", () => {
			// O=High, S=Mid, I=Low, A=High, V=Mid
			const { container } = render(<GeometricSignature oceanCode="OSIAV" baseSize={32} />);
			const svgs = container.querySelectorAll("svg");

			expect(svgs[0].getAttribute("data-slot")).toBe("ocean-shape-o");
			expect(svgs[1].getAttribute("data-slot")).toBe("ocean-shape-s");
			expect(svgs[2].getAttribute("data-slot")).toBe("ocean-shape-i");
			expect(svgs[3].getAttribute("data-slot")).toBe("ocean-shape-a");
			expect(svgs[4].getAttribute("data-slot")).toBe("ocean-shape-v");
		});

		it("renders all shapes at uniform baseSize", () => {
			const { container } = render(<GeometricSignature oceanCode="TFIDR" baseSize={48} />);
			const svgs = container.querySelectorAll("svg");

			expect(svgs).toHaveLength(5);
			for (const svg of svgs) {
				expect(svg.getAttribute("height")).toBe("48");
			}
		});

		it("renders all 15 valid letters with correct data-slot", () => {
			const ALL_LETTERS: Record<string, string> = {
				T: "ocean-shape-t",
				M: "ocean-shape-m",
				O: "ocean-shape-o",
				F: "ocean-shape-f",
				S: "ocean-shape-s",
				C: "ocean-shape-c",
				I: "ocean-shape-i",
				B: "ocean-shape-b",
				E: "ocean-shape-e",
				D: "ocean-shape-d",
				P: "ocean-shape-p",
				A: "ocean-shape-a",
				R: "ocean-shape-r",
				V: "ocean-shape-v",
				N: "ocean-shape-n",
			};

			for (const [letter, expectedSlot] of Object.entries(ALL_LETTERS)) {
				const code = `${letter}${letter}${letter}${letter}${letter}`;
				const { container } = render(<GeometricSignature oceanCode={code} baseSize={32} />);
				const svg = container.querySelector("svg");
				expect(svg?.getAttribute("data-slot")).toBe(expectedSlot);
			}
		});
	});

	describe("rendering", () => {
		it("renders 5 shapes in OCEAN order", () => {
			const { container } = render(<GeometricSignature oceanCode="OCEAN" />);
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
			const { container } = render(<GeometricSignature oceanCode="OCEAN" />);
			expect(container.querySelector("[data-slot='geometric-signature']")).not.toBeNull();
		});

		it("uses trait CSS variables for colors", () => {
			const { container } = render(<GeometricSignature oceanCode="OCEAN" />);
			const svgs = container.querySelectorAll("svg");

			expect(svgs[0].getAttribute("fill")).toBe("var(--trait-openness)");
			expect(svgs[1].getAttribute("fill")).toBe("var(--trait-conscientiousness)");
			expect(svgs[2].getAttribute("fill")).toBe("var(--trait-extraversion)");
			expect(svgs[3].getAttribute("fill")).toBe("var(--trait-agreeableness)");
			expect(svgs[4].getAttribute("fill")).toBe("var(--trait-neuroticism)");
		});

		it("uses default baseSize of 32", () => {
			const { container } = render(<GeometricSignature oceanCode="OCEAN" />);
			const svg = container.querySelector("svg");
			expect(svg?.getAttribute("height")).toBe("32");
		});

		it("renders archetype name when provided", () => {
			const { container } = render(
				<GeometricSignature oceanCode="OCEAN" archetypeName="Creative Diplomat" />,
			);
			expect(container.textContent).toContain("Creative Diplomat");
		});

		it("does not render archetype name when omitted", () => {
			const { container } = render(<GeometricSignature oceanCode="OCEAN" />);
			const nameSpans = container.querySelectorAll("span.font-heading");
			expect(nameSpans).toHaveLength(0);
		});
	});

	describe("animation", () => {
		it("does not apply animation classes when animate is false", () => {
			const { container } = render(<GeometricSignature oceanCode="OCEAN" animate={false} />);
			const animatedElements = container.querySelectorAll("[class*='animate-shape-reveal']");
			expect(animatedElements).toHaveLength(0);
		});

		it("applies animation classes when animate is true", () => {
			const { container } = render(<GeometricSignature oceanCode="OCEAN" animate />);
			const animatedElements = container.querySelectorAll("[class*='animate-shape-reveal']");
			expect(animatedElements).toHaveLength(5);
		});

		it("sets staggered animation delays when animate is true", () => {
			const { container } = render(<GeometricSignature oceanCode="OCEAN" animate />);
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
				<GeometricSignature oceanCode="OCEAN" animate archetypeName="Creative Diplomat" />,
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

		it("handles empty ocean code (renders 5 fallback shapes)", () => {
			const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
			const { container } = render(<GeometricSignature oceanCode="" />);
			const svgs = container.querySelectorAll("svg");
			expect(svgs).toHaveLength(5);
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
