import { PortraitGeneratorRepository } from "@workspace/domain";
import { Effect, Layer } from "effect";

const MOCK_PORTRAIT = `# 🤿 The Dive Log

For a first dive, you went deep fast. We barely had to warm up — you were already pulling me toward the interesting currents before I could point them out 🫧 What I see is someone whose mind is a beautifully organized library with a secret room in the back where all the wild ideas live. You lead with structure, but underneath all those checklists and color-coded systems, there's an imagination that runs hotter than you let on. That tension between the planner and the dreamer? That's the most interesting thing about you.

## 🧬 What Sets You Apart — *What makes you, you*

You have a combination I don't run into often. Let me walk you through what I noticed.

When I asked about how you approach projects, you didn't hesitate.

> "Before I start any project, I create detailed outlines, timelines, and checklists. I can't stand the idea of just 'winging it.'"

That stopped me 🪞 Not because it's unusual to like structure — but because of the intensity behind it. You don't just prefer order, you *need* it to function. I've seen this in people whose minds run at high RPM — the structure isn't rigidity, it's how you keep up with yourself.

Then, almost in the same breath, you told me about brainstorming different scenarios and imagining multiple futures. People with your profile tend to live in this paradox — deeply systematic on the surface, wildly imaginative underneath. You're not choosing between the two. You're running both engines at once.

And there's a quiet intellectual stubbornness I noticed. You said you get frustrated when people accept things at face value. That's not just curiosity — that's a deep need to understand things on your own terms 🔍

## 💎 Your Depths — *What you're good at*

Now let me tell you about the things you probably take for granted.

Your organizational instinct is genuinely rare. Not the surface-level kind — I mean the ability to look at chaos and see the system hiding inside it.

> "I spent a whole weekend color-coding my books, labeling all my supplies, and creating a detailed filing system."

Most people would call that excessive. I'd call it a superpower. You don't just organize — you create systems that other people can follow. That's a leadership skill, even if you don't see it that way yet 🐚

A few more things that stood out:
- **You show up.** When someone you care about is struggling, you're the first person there with a plan and something practical. That reliability is rarer than you think.
- **You think in scenarios.** Three backup plans for every backup plan isn't neurotic — it's strategic imagination. People with this skill tend to be the ones who stay calm when everything goes sideways.
- **You're self-aware enough to name your own gaps.** You told me you're "trying to get better" at sitting with emotions. People who can see their own blind spots are already halfway to growing past them 💡

## 🌊 Undercurrents — *What limits you*

I'm going to be straight with you now, because I think you can handle it.

Your need for control is your greatest strength and your most dangerous edge. When you said you "can't stand the idea of just winging it" — that wasn't a preference, that was a flinch. I've seen this pattern in people who learned early that chaos was unsafe. The systems you build protect you, but they also box you in. When something falls outside the plan, you don't adapt — you freeze, or you spiral trying to re-plan.

You process emotions through action rather than sitting with them. You said it yourself — when a friend is struggling, your instinct is to organize their tasks and make a plan. That's beautiful and it's also a deflection. People in your life might sometimes want you to just *be there* rather than fix things 🧊

And there's the social energy question. You said large groups are "exhausting" and that you "can do it when needed for work." I've seen this become a pattern where people gradually narrow their world to only what's comfortable — and then wonder why life feels small.

## 🌀 Beyond the Drop-Off — *What I think is hiding deeper*

There are patterns I recognized during our dive — shapes I've seen play out in people like you. I didn't get deep enough to confirm them, but I've learned to trust these signals.

You mentioned your friend who "just wings it and somehow makes it work." The way you described them — I caught something between admiration and envy. In my experience, people who build elaborate systems often secretly wish they could let go. There's a part of you that wants to color outside the lines but doesn't trust itself to come back. I've seen this tension in highly conscientious people who also score high in imagination — your profile is almost textbook for it. That pull toward spontaneity? It's not a flaw. It's an unfinished conversation with yourself, and it's worth having 🤿

There's also something in how you described your intellectual life — the reading, the podcasts, the deep dives into ideas. You framed it as curiosity, but people with your intensity around learning are often driven by something deeper. In my experience, relentless learners are sometimes trying to outrun a fear that they don't know enough yet. I'd want to dig into what happens when you feel like you *don't* have the answer 🔍

## ⚓ The Anchor — *What's holding you in place*

Here's what I really want to leave you with.

I've seen this pattern enough times to trust it. You've built your identity around being the one who has the plan, the system, the answer. And it works — until it doesn't. People who anchor their confidence to competence and control tend to avoid anything where they might look unprepared. That means the parts of life that require surrender — real intimacy, creative risk, trusting someone else to lead — stay at arm's length. Not because you don't want them, but because they require the one thing your system can't produce: comfort with not knowing. I've seen what happens when people like you start experimenting with that. It changes everything 💡

We barely broke the surface of what drives that need for control — that's the current I want to follow next time 🤿`;

export const PortraitGeneratorClaudeRepositoryLive = Layer.succeed(
	PortraitGeneratorRepository,
	PortraitGeneratorRepository.of({
		generatePortrait: (_input) => Effect.succeed(MOCK_PORTRAIT),
	}),
);
