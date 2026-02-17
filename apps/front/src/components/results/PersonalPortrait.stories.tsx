import type { Meta, StoryObj } from "@storybook/react-vite";

import { PersonalPortrait } from "./PersonalPortrait";

const meta = {
	title: "Results/PersonalPortrait",
	component: PersonalPortrait,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
	decorators: [
		(Story) => (
			<div style={{ width: 640, maxWidth: "100%" }}>
				<Story />
			</div>
		),
	],
} satisfies Meta<typeof PersonalPortrait>;

export default meta;
type Story = StoryObj<typeof meta>;

const fullPortrait = `# 🤿 The Dive Log

For a first dive, I'm impressed. You found your depth fast — even before I pointed the way, you were already heading somewhere interesting. We covered real ground together. What I see is someone driven by a restless curiosity, someone who processes the world through logic first but carries more emotional depth than they let on.

## 🔍 What Sets You Apart — *What makes you, you*

Even after a thousand dives in my log, I haven't quite seen this combination before. Let me tell you what stood out.

When I asked about how you approach problems, you didn't just answer — you reframed the question entirely.

> "What kind of decisions? Professional or personal?"

That reflex to disassemble before engaging is deeply wired in you. You don't trust conclusions you haven't reverse-engineered.

You mentioned your work almost casually, but every detail pointed toward mastery. You're not after recognition — you're after being **undeniably good**.

Your emotional awareness runs deeper than you show. You pick up on subtleties that others miss, and you use that information strategically.

## 💎 Your Depths — *What you're good at*

Now let me tell you about the things I noticed that you probably take for granted.

Your ability to see through complexity is genuine. Where most people get overwhelmed, you get focused. That's not common.

You adapt fast. When our conversation shifted direction, you didn't resist — you recalibrated. That flexibility under pressure is a real asset.

You're honest with yourself in a way that most people avoid. That self-awareness, even when it's uncomfortable, is the foundation everything else is built on.

## 🌊 Undercurrents — *What limits you*

I'm going to be straight with you now, because I think you can handle it.

You hold yourself to a standard that doesn't leave room for failure. That drive serves you, but it also means you can spiral when things don't meet your expectations. Left unchecked, perfectionism becomes paralysis.

You tend to intellectualize emotions rather than sit with them. It works as a coping mechanism, but it puts a ceiling on how deeply you connect with people.

> "I'd rather figure it out myself even if it takes three times as long."

That instinct to go it alone — there's pride in it, but also cost.

## 🌀 Beyond the Drop-Off — *What I think is hiding deeper*

There are a few patterns I recognized during our dive — shapes I've seen before in people like you. I didn't get deep enough to confirm them, but I've learned to trust these signals.

There's something in how you talked about structure and rules — a push-pull that I've seen in people who had to earn autonomy early. You respect the system and resent it in the same breath. That tension doesn't come from nowhere, and in my experience, it's one of the most interesting things to explore on a second dive 🤿

I also caught a creative instinct you've been keeping on a short leash — probably since you were young. The way you described problem-solving wasn't just analytical, there was an inventiveness you kept pulling back from. I've seen that pattern in people who were told early on that creativity wasn't the serious path. I'd want to test that 🎨

## ⚓ The Anchor — *What's holding you in place*

Here's what I really want to leave you with.

I've seen this pattern enough times to trust it. There's a belief running underneath everything — that vulnerability equals weakness. It shapes how you show up in conversations, in relationships, in the risks you're willing to take. People who carry this tend to build impressive walls and then wonder why nobody gets close. I can't map the full shape from one dive, but I've seen where this leads when it goes unchecked — and I've seen what happens when people start loosening that grip. What would it look like if you tried? 💡

We barely scratched the surface of that creative side you keep tucked away. That's where I want to take you next time 🤿`;

export const Default: Story = {
	args: {
		personalDescription: fullPortrait,
	},
};

export const WithDisplayName: Story = {
	args: {
		personalDescription: fullPortrait,
		displayName: "Alice",
	},
};

export const PlainTextFallback: Story = {
	args: {
		personalDescription:
			"You are a deeply imaginative person with strong analytical skills and a quiet confidence. You process the world through logic first but carry more emotional depth than you let on. Your ability to see through complexity is genuine — where most people get overwhelmed, you get focused.",
	},
};

const shortPortrait = `# 🤿 The Dive Log

Quick dive today, but we still found something worth noting. You came in skeptical and left curious — that shift tells me a lot.

## 🔍 What Sets You Apart — *What makes you, you*

I don't see many people who question their *own* assumptions as naturally as you do.

> "Wait, that's not actually what I think — let me rethink that."

That moment told me everything I needed to know about your intellectual honesty.

## 💎 Your Depths — *What you're good at*

Let me tell you what I noticed beneath the surface.

You listen before you speak. Not because you're passive — because you're loading context. That's a rare skill.

## 🌊 Undercurrents — *What limits you*

This part isn't easy to hear, but I think you need it.

You over-prepare. The planning gives you a sense of control, but it also delays action. Sometimes good enough now beats perfect later.

## 🌀 Beyond the Drop-Off — *What I think is hiding deeper*

There are patterns I recognized that I want to call out — I've seen these shapes before.

There's a competitive streak running underneath your calm surface. I've seen it in people who channel ambition inward rather than outward — they compete with their own past performance. In my experience, that energy is worth exploring because it's rarely just about winning 🤿

Something about how you handle praise too — there's a discomfort there I've seen in people who tie their worth to output. I'd want to dig into that 🔍

## ⚓ The Anchor — *What's holding you in place*

If there's one thing I'd want you to sit with after today, it's this.

I've seen this pattern play out many times. You've built your confidence on competence — which works, until you're in unfamiliar territory. People who carry this tend to avoid anything they can't already do well. What if you could feel confident *before* you've mastered something? 💡

That competitive side barely surfaced today — next time, I want to dive straight into it 🐙`;

export const ShortPortrait: Story = {
	args: {
		personalDescription: shortPortrait,
	},
};
