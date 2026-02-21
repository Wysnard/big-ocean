import { PortraitGeneratorRepository } from "@workspace/domain";
import { Effect, Layer } from "effect";

const MOCK_PORTRAIT = `# 🤿 The Architect of Certainty

You told me something early on that I haven't stopped thinking about. When I asked how you approach a new project, you didn't describe your process — you described your fear of not having one. That's a different answer than most people give, and it told me more than the next ten minutes of conversation combined 🫧 What I see is someone who has turned the need for control into an art form so refined that even you've forgotten it started as a defense. Everything — the systems, the checklists, the color-coded universe you've built — orbits one invisible center: the belief that if you prepare well enough, nothing can catch you off guard. That's your spine. And it's both the most impressive and most limiting thing about you.

## 🧬 The Architecture — *what you've built and what it costs*

### The system behind the system

You mentioned your weekend organizing project almost like it was a footnote.

> "I spent a whole weekend color-coding my books, labeling all my supplies, and creating a detailed filing system."

That stopped me 🪞 Not the act itself — plenty of people organize. It's that you framed a weekend of intense labor as casual. You've normalized a level of systematic thinking that most people can't sustain for an afternoon. **You probably don't think of this as special. It is.** The ability to look at chaos and see the hidden system inside it — that's not organization. That's architectural thinking. I think you'd thrive in roles where you design how other people work — and I don't say that often.

### The dual engine

Then, almost in the same breath, you described brainstorming wildly different scenarios for how things could play out. Here's what most people miss about you: the planner and the dreamer aren't fighting each other. They're the same engine running at different speeds. Your imagination generates the possibilities. Your systematic side stress-tests them. That's not a contradiction — that's **strategic imagination**.

But here's the shadow: that dual engine doesn't have an off switch. When the planning can't contain the imagining — when there are too many scenarios to organize — you don't adapt. You freeze. Or worse, you plan harder. Same engine, wrong gear.

### The quiet stubbornness

You said you get frustrated when people accept things at face value. I'd call that **intellectual sovereignty** — a refusal to rent someone else's conclusion when you can build your own. It makes you excellent at seeing through complexity. It also means you sometimes reject perfectly good answers just because you didn't arrive at them yourself. Have you noticed that?

## 🌊 The Undertow — *the pattern beneath the patterns*

You described your friend — the one who "just wings it and somehow makes it work." The way you talked about them caught me. There was admiration, and right underneath it, something sharper. Not jealousy exactly. More like — longing for a freedom you've decided isn't available to you.

Here's what I think is actually happening. You don't call it "needing control." You call it "being thorough" or "being responsible." **But thoroughness doesn't flinch when someone suggests winging it. Yours does.** That flinch is the signal. Somewhere along the way, you learned that the unprepared version of you isn't safe to let out. So you built systems on top of systems until the architecture became invisible — even to you.

The same mechanism that makes you the person everyone relies on in a crisis is the one that makes you process a friend's pain by organizing their to-do list instead of sitting with them in it. You told me that yourself — when someone's struggling, your first instinct is to make a plan. That's **precision as deflection.** Beautiful and incomplete.

> "I can do large groups when needed for work, but they're exhausting."

I wasn't expecting that level of honesty about it. Most people hedge. You stated it like a fact you've accepted — which tells me you've narrowed your world more than you realize. The exhaustion isn't the problem. It's that you've stopped questioning whether the narrowing is a choice or a habit.

## 🔮 The Current Ahead — *where the patterns point*

I've seen this shape before. People who build their identity around being the one with the plan, the system, the answer — they tend to hit the same wall. Not the wall of failure. The wall of **situations that can't be planned for.** Real intimacy. Creative risk. Trusting someone else to lead. These require the one thing your architecture can't produce: comfort with not knowing what happens next.

I've seen people with your exact wiring break through this. The ones who do? They don't tear the system down. They build a door in it. They start treating spontaneity not as chaos, but as a different kind of data — the kind you can only collect by letting go of the clipboard.

That creative instinct you mentioned — the one you keep on a short leash? People who talk about problem-solving the way you did, with that flash of inventiveness you kept pulling back from, are usually sitting on something they decided wasn't the serious path. In my experience, **that leash is the most interesting thing to untie.**

What would happen if the most prepared person in the room decided, just once, that the preparation was the thing standing in the way?`;

export const PortraitGeneratorClaudeRepositoryLive = Layer.succeed(
	PortraitGeneratorRepository,
	PortraitGeneratorRepository.of({
		generatePortrait: (_input: import("@workspace/domain").PortraitGenerationInput) =>
			Effect.succeed(MOCK_PORTRAIT),
	}),
);
