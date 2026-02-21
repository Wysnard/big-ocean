// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PersonalPortrait } from "./PersonalPortrait";

const markdownPortrait = `# 🤿 The Architect of Certainty

You told me something early on that I haven't stopped thinking about. When I asked how you approach a new project, you didn't describe your process — you described your fear of not having one. What I see is someone who has turned the need for control into an art form so refined that even you've forgotten it started as a defense.

## 🧬 The Architecture — *what you've built and what it costs*

### The system behind the system

You mentioned your weekend organizing project almost like it was a footnote.

> "I spent a whole weekend color-coding my books, labeling all my supplies, and creating a detailed filing system."

That stopped me 🪞 You've normalized a level of systematic thinking that most people can't sustain for an afternoon. **You probably don't think of this as special. It is.** That's not organization — that's **architectural thinking**.

### The shadow side

But here's the shadow: that dual engine doesn't have an off switch. When the planning can't contain the imagining, you don't adapt. You freeze. Same engine, wrong gear.

## 🌊 The Undertow — *the pattern beneath the patterns*

You described your friend — the one who "just wings it and somehow makes it work." There was admiration, and right underneath it, something sharper.

You don't call it "needing control." You call it "being thorough." **But thoroughness doesn't flinch when someone suggests winging it. Yours does.** That's **precision as deflection.** Beautiful and incomplete.

## 🔮 The Current Ahead — *where the patterns point*

I've seen this shape before. People who build their identity around being the one with the plan tend to hit the same wall — **situations that can't be planned for.** Real intimacy. Creative risk. Trusting someone else to lead.

I've seen people with your exact wiring break through this. They don't tear the system down. They build a door in it.

What would happen if the most prepared person in the room decided, just once, that the preparation was the thing standing in the way?`;

const plainTextFallback =
	"You are a deeply imaginative person with strong analytical skills and a quiet confidence.";

describe("PersonalPortrait", () => {
	describe("markdown format with # and ## sections", () => {
		it("renders custom h1 title section", () => {
			render(<PersonalPortrait personalDescription={markdownPortrait} />);
			expect(screen.getByText(/The Architect of Certainty/)).toBeInTheDocument();
		});

		it("renders all 3 h2 section headers", () => {
			render(<PersonalPortrait personalDescription={markdownPortrait} />);
			expect(screen.getByText(/The Architecture/)).toBeInTheDocument();
			expect(screen.getByText(/The Undertow/)).toBeInTheDocument();
			expect(screen.getByText(/The Current Ahead/)).toBeInTheDocument();
		});

		it("renders subtitle meanings in italic", () => {
			const { container } = render(<PersonalPortrait personalDescription={markdownPortrait} />);
			const italicSubtitles = container.querySelectorAll("h4 .italic");
			// 3 h2 sections each have an italic subtitle
			expect(italicSubtitles.length).toBe(3);
			expect(italicSubtitles[0].textContent).toBe("what you've built and what it costs");
		});

		it("renders section body content including coined phrases", () => {
			render(<PersonalPortrait personalDescription={markdownPortrait} />);
			expect(screen.getByText(/architectural thinking/)).toBeInTheDocument();
			expect(screen.getByText(/precision as deflection/)).toBeInTheDocument();
		});

		it("renders the closing line", () => {
			render(<PersonalPortrait personalDescription={markdownPortrait} />);
			expect(screen.getByText(/preparation was the thing standing in the way/)).toBeInTheDocument();
		});

		it("renders the title with displayName", () => {
			render(<PersonalPortrait personalDescription={markdownPortrait} displayName="Alice" />);
			expect(screen.getByText("Alice\u2019s Personality Portrait")).toBeInTheDocument();
		});

		it("renders default title without displayName", () => {
			render(<PersonalPortrait personalDescription={markdownPortrait} />);
			expect(screen.getByText("Your Personality Portrait")).toBeInTheDocument();
		});
	});

	describe("plain text fallback", () => {
		it("renders raw text when no # headers found", () => {
			render(<PersonalPortrait personalDescription={plainTextFallback} />);
			expect(screen.getByText(plainTextFallback)).toBeInTheDocument();
		});

		it("does not render section headers for plain text", () => {
			render(<PersonalPortrait personalDescription={plainTextFallback} />);
			expect(screen.queryByText(/The Dive Log/)).not.toBeInTheDocument();
		});
	});

	it("renders rainbow accent bar via data-slot", () => {
		const { container } = render(<PersonalPortrait personalDescription={markdownPortrait} />);
		const card = container.querySelector('[data-slot="personal-portrait"]');
		expect(card).toBeInTheDocument();
	});

	it("renders blockquotes as styled blockquote elements", () => {
		const { container } = render(<PersonalPortrait personalDescription={markdownPortrait} />);
		const blockquotes = container.querySelectorAll("blockquote");
		expect(blockquotes.length).toBe(1);
		expect(blockquotes[0].textContent).toContain("color-coding my books");
	});

	it("renders h3 sub-headers within sections", () => {
		render(<PersonalPortrait personalDescription={markdownPortrait} />);
		expect(screen.getByText("The system behind the system")).toBeInTheDocument();
		expect(screen.getByText("The shadow side")).toBeInTheDocument();
	});

	it("renders section dividers between sections", () => {
		const { container } = render(<PersonalPortrait personalDescription={markdownPortrait} />);
		const dividers = container.querySelectorAll(".border-b");
		// 4 sections (1 h1 + 3 h2) = 3 dividers between them
		expect(dividers.length).toBe(3);
	});
});
