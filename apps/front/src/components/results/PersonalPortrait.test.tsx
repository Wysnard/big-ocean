// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PersonalPortrait } from "./PersonalPortrait";

const markdownPortrait = `# 🤿 The Dive Log

For a first dive, you surprised me. We covered real ground together. What I see is someone driven by a restless curiosity.

## 🔍 What Sets You Apart — *What makes you, you*

Even after a thousand dives in my log, I haven't quite seen this combination before.

When I asked about decisions, you broke the question apart first.

> "What kind of decisions? Professional or personal?"

That reflex to disassemble before engaging is deeply wired in you.

## 💎 Your Depths — *What you're good at*

Now let me tell you about the things I noticed that you probably take for granted.

Your ability to see through complexity is genuine. That's not common.

## 🌊 Undercurrents — *What limits you*

I'm going to be straight with you now, because I think you can handle it.

You hold yourself to a standard that doesn't leave room for failure. Left unchecked, perfectionism becomes paralysis.

## 🌀 Beyond the Drop-Off — *What I think is hiding deeper*

There are a few patterns I recognized during our dive — shapes I've seen before in people like you. I didn't get deep enough to confirm them, but I've learned to trust these signals.

There's something in how you talked about authority — a push-pull I've seen in people who had to earn autonomy early. In my experience, it's one of the most interesting things to explore on a second dive 🤿

I also caught a creative instinct you've been keeping on a short leash. I've seen that pattern in people who were told early on that creativity wasn't the serious path. I'd want to test that 🎨

## ⚓ The Anchor — *What's holding you in place*

Here's what I really want to leave you with.

I've seen this pattern enough times to trust it. There's a belief running underneath everything — that vulnerability equals weakness. People who carry this tend to build impressive walls and then wonder why nobody gets close. What would it look like if you tried? 💡

We barely scratched the surface of that creative side. That's where I want to take you next time 🤿`;

const plainTextFallback =
	"You are a deeply imaginative person with strong analytical skills and a quiet confidence.";

describe("PersonalPortrait", () => {
	describe("markdown format with # and ## sections", () => {
		it("renders The Dive Log as h1 section", () => {
			render(<PersonalPortrait personalDescription={markdownPortrait} />);
			expect(screen.getByText(/The Dive Log/)).toBeInTheDocument();
		});

		it("renders all 5 h2 section headers", () => {
			render(<PersonalPortrait personalDescription={markdownPortrait} />);
			expect(screen.getByText(/What Sets You Apart/)).toBeInTheDocument();
			expect(screen.getByText(/Your Depths/)).toBeInTheDocument();
			expect(screen.getByText(/Undercurrents/)).toBeInTheDocument();
			expect(screen.getByText(/Beyond the Drop-Off/)).toBeInTheDocument();
			expect(screen.getByText(/The Anchor/)).toBeInTheDocument();
		});

		it("renders subtitle meanings in italic", () => {
			const { container } = render(<PersonalPortrait personalDescription={markdownPortrait} />);
			const italicSubtitles = container.querySelectorAll("h4 .italic");
			// 5 h2 sections each have an italic subtitle
			expect(italicSubtitles.length).toBe(5);
			expect(italicSubtitles[0].textContent).toBe("What makes you, you");
		});

		it("renders section body content including intros", () => {
			render(<PersonalPortrait personalDescription={markdownPortrait} />);
			expect(screen.getByText(/restless curiosity/)).toBeInTheDocument();
			expect(screen.getByText(/thousand dives in my log/)).toBeInTheDocument();
			expect(screen.getByText(/perfectionism becomes paralysis/)).toBeInTheDocument();
		});

		it("renders the closing line", () => {
			render(<PersonalPortrait personalDescription={markdownPortrait} />);
			expect(screen.getByText(/barely scratched the surface/)).toBeInTheDocument();
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
		expect(blockquotes[0].textContent).toContain("What kind of decisions?");
	});

	it("renders section dividers between sections", () => {
		const { container } = render(<PersonalPortrait personalDescription={markdownPortrait} />);
		const dividers = container.querySelectorAll(".border-b");
		// 6 sections (1 h1 + 5 h2) = 5 dividers between them
		expect(dividers.length).toBe(5);
	});
});
