/**
 * Hand-Curated Archetype Data
 *
 * Maps 4-letter OCEAN codes (O,C,E,A) to memorable personality archetype names,
 * descriptions, and colors. Covers the 25 most common/meaningful combinations.
 * Remaining combinations (out of 81 total) use the fallback generator.
 *
 * Letter system:
 *   Openness:          P (Practical)  G (Grounded)    O (Open-minded)
 *   Conscientiousness: F (Flexible)   B (Balanced)    D (Disciplined)
 *   Extraversion:      I (Introvert)  A (Ambivert)    E (Extravert)
 *   Agreeableness:     C (Candid)     N (Negotiator)  W (Warm)
 */

/**
 * Teaser trait letter options for generating plausible but randomized OCEAN codes
 * Used in auth gates to show a teaser code that looks real but doesn't reveal actual results
 *
 * Maps trait index to available letters for that trait:
 * 0: Openness (P/G/O)
 * 1: Conscientiousness (F/B/D)
 * 2: Extraversion (I/A/E)
 * 3: Agreeableness (C/N/W)
 * 4: Neuroticism (R/T/S) - Note: N is used for Agreeableness
 */
export const TEASER_TRAIT_LETTERS = [
	["P", "G", "O"], // Openness
	["F", "B", "D"], // Conscientiousness
	["I", "A", "E"], // Extraversion
	["C", "N", "W"], // Agreeableness
	["R", "T", "S"], // Neuroticism
] as const;

/**
 * Curated archetype entry (without code4 and isCurated, which are derived).
 */
export interface CuratedArchetypeEntry {
	readonly name: string;
	readonly description: string;
	readonly color: string;
}

/**
 * Hand-curated archetype entries indexed by 4-letter OCEAN code.
 *
 * Each entry provides a memorable name, a rich description (1500-2500 characters),
 * and a representative hex color. The code order is O-C-E-A,
 * using trait-specific letters.
 */
export const CURATED_ARCHETYPES: Record<string, CuratedArchetypeEntry> = {
	// HHHH → ODEW
	ODEW: {
		name: "The Idealist",
		description:
			"Imaginative ideas don't just live in your head — they move through your hands, your plans, your conversations, and into the world as real, tangible change. A creative vision that would stay abstract for most people becomes a project with milestones when it reaches you, because the discipline to follow through is woven into everything you do. Social settings light you up in a particular way: not just as someone who enjoys company, but as someone who naturally draws others into shared purpose and collective energy. Friends know you as the one who rallies people around a cause, who turns a casual dinner into a brainstorming session for something meaningful, who finds the connective thread between what needs doing and who wants to help. There's a warmth in how you lead that never feels performative — it comes from genuine compassion and a deep-seated belief that people are capable of more than they realize. Community projects, volunteer efforts, creative collaborations — these aren't obligations for you but expressions of who you are at your core, the places where your energy feels most alive and most useful. The world isn't just something you observe; it's something you actively try to improve, and that drive is grounded in real care rather than abstract idealism. Every pursuit carries both heart and follow-through, which is why the things you build tend to last long after the initial excitement has faded and the crowd has moved on to the next shiny thing. That combination of vision and dedication is what makes your impact enduring rather than fleeting.",
		color: "#6B5CE7",
	},
	// HHHL → ODEC
	ODEC: {
		name: "The Visionary Planner",
		description:
			"A rich inner world of ideas meets the meticulous planning needed to make them real, and that combination sets you apart in ways that surprise people who assume creativity and discipline don't coexist. Bold concepts don't intimidate you — they energize you, and your outgoing confidence makes you a natural at presenting them to others with clarity, conviction, and the kind of structured reasoning that turns skeptics into enthusiastic supporters. Where many creative thinkers struggle with execution, your disciplined nature ensures that every idea gets mapped out, stress-tested, and refined before it ever reaches an audience. Social settings feel like opportunities rather than obligations, places where you can test-drive new thinking and gauge reactions in real time. At the same time, conventional wisdom doesn't hold much sway when your vision calls for something different — challenging established norms comes naturally when you've already thought three steps ahead and can articulate exactly why the old way falls short. Half-measures feel wrong to you on a fundamental level, and compromise on quality is something you simply refuse to accept under any circumstances. There's a relentless quality to how you pursue originality, not born from stubbornness but from a genuine conviction that great work deserves great effort and that the world benefits when someone refuses to settle. Precision and imagination aren't opposites in your world; they're close collaborators, and the results consistently speak for themselves.",
		color: "#4A7FC7",
	},
	// HHMH → ODAW
	ODAW: {
		name: "The Creative Diplomat",
		description:
			"Challenges that stump others become puzzles you solve with a quiet blend of imagination and strategic thinking, often finding elegant solutions that no one else had even considered as possibilities. Smaller social settings feel like home — a coffee with a close friend, a thoughtful conversation at a dinner party, anywhere your reserved warmth can emerge without competing for attention or being drowned out by louder voices. Trust, for you, isn't something given freely but something built through consistency, through showing up reliably and demonstrating sincere interest in the people around you over time rather than in bursts of performative enthusiasm. That patience in relationships mirrors how you approach creative problems: carefully, with attention to nuance, and with a genuine respect for the complexity of what's in front of you. Harmony between innovative ideas and the humans they serve isn't just a nice outcome — it's the standard you hold yourself to, and the one that guides your choices when competing priorities pull in different directions. When a solution works beautifully on paper but creates friction for real people, you go back to the drawing board without hesitation. There's a diplomat's instinct at work in everything you do, a constant awareness that the best ideas succeed when they carry people along rather than pushing them aside. This blend of creativity and care makes your contributions both original and deeply considerate, earning a trust that louder, faster approaches rarely achieve.",
		color: "#5B8FA8",
	},
	// HHLH → ODIW
	ODIW: {
		name: "The Thoughtful Collaborator",
		description:
			"Creative solutions arrive at the table well-researched and meticulously prepared when they come from you, because cutting corners on quality feels fundamentally wrong — every detail matters, and the details you catch are often the ones that make or break the whole effort. Deeper one-on-one connections hold far more appeal than large gatherings, and your energy goes toward relationships that are built on genuine understanding rather than surface-level pleasantries or networking strategy. The people who know you best recognize something rare: the ability to combine innovative thinking with a truly supportive, cooperative spirit, so that every contribution lifts others rather than competing with them for credit or attention. Collaboration isn't a buzzword in your vocabulary; it's a practice, something you invest in through careful listening and thoughtful follow-up that shows you actually heard what was said. When someone brings a problem to you, they get more than just a clever answer — they get someone who takes the time to understand the full picture before responding, someone who treats their concern with the seriousness it deserves. That same thoroughness shows up in your personal projects, where imagination and discipline work together to produce work that is both original and reliable. Making meaningful contributions matters deeply to you, but not in a way that seeks the spotlight or expects applause. The satisfaction comes from knowing that your effort genuinely helped, that the people around you are better off because of what you brought to the work.",
		color: "#7B9E6B",
	},
	// HMHH → OBEW
	OBEW: {
		name: "The Curious Leader",
		description:
			"New experiences hold an almost magnetic pull for you, and the impulse to share discoveries with others is just as strong as the curiosity itself — learning something fascinating feels incomplete until you've told someone about it. Plans adapt and flex in your hands without breaking: when circumstances shift, your approach shifts with them, pragmatically and without losing momentum or the thread of what you were originally trying to accomplish. That flexibility extends to people, too — genuine kindness radiates from how you engage with others, making you someone who inspires not through authority or position but through warmth, example, and the infectious quality of your enthusiasm. Friends and colleagues often find themselves stepping outside their comfort zones around you, not because you pushed them but because your genuine excitement made the unknown feel less scary and more like an invitation. Exploration isn't a hobby for you so much as a way of being, a constant orientation toward what's next, what's possible, and what hasn't been tried yet. The communities you build tend to grow organically because people want to be part of what you're creating — there's an optimism in your approach that doesn't feel naive but grounded in real experience and genuine care. When a group needs someone to bridge the gap between big-picture thinking and day-to-day reality, your balanced, approachable style makes you a natural fit. The thrill of discovery and the joy of shared growth are the twin engines that keep you moving forward with purpose.",
		color: "#E8A04C",
	},
	// HMMM → OBAN
	OBAN: {
		name: "The Balanced Explorer",
		description:
			"Curiosity drives you forward while a grounded sense of balance keeps you steady, creating a rhythm that lets you explore without losing your footing or getting so far ahead that you lose perspective on where you started. Different social situations feel equally natural — a lively group debate energizes you one evening, and a quiet night with a book recharges you the next, with no sense of contradiction between the two and no guilt about choosing either. Fresh perspectives come easily because your mind stays open to new angles without swinging to extremes in any direction, finding value in ideas without needing to adopt them wholesale. That moderation isn't about playing it safe; it's about having a wide enough range to engage with almost anything life puts in front of you without being destabilized by it. Understanding the world on your own terms matters more than following someone else's roadmap, and that independence shapes how you approach everything from career decisions to weekend plans. There's a rare self-possession in how you move through life — not rigid, not scattered, but intentionally fluid, adjusting course without losing your center. People around you often notice that you can hold space for opposing viewpoints without feeling threatened by either side, a quality that makes you both a good listener and a thoughtful contributor to any conversation. Exploration and steadiness coexist in you without tension, each strengthening the other rather than pulling in opposite directions.",
		color: "#8E7CC3",
	},
	// HLHH → OFEW
	OFEW: {
		name: "The Free Spirit",
		description:
			"New experiences get met with open arms and minimal planning, because trusting your instincts has always served you better than following someone else's itinerary or sticking to a script that was written before you knew what the day would hold. Social gatherings light up when you walk in — there's an authentic enthusiasm and generous energy in how you engage that makes people feel immediately welcome, at ease, and free to be themselves rather than performing some polished version. Rigid schedules and over-structured days feel suffocating rather than productive, so you lean into spontaneity and find that the best moments often come from saying yes to the unexpected. Creative possibilities emerge from that flexibility in ways that surprise even you: a detour becomes an adventure, a cancelled plan opens the door to something better, an impulsive idea turns into a meaningful project that you couldn't have predicted in advance. Freedom and connection aren't competing values in your life — they reinforce each other, because the relationships that matter most to you are the ones that leave room for everyone to be themselves without apology. There's nothing performative about how you show up; what people see is genuinely what they get, and that transparency builds trust faster than any carefully managed persona ever could. Living fully means living honestly, and the life you build reflects that conviction at every turn. Careful management has never appealed to you the way authentic, unfiltered experience does.",
		color: "#FF8C42",
	},
	// MHHH → GDEW
	GDEW: {
		name: "The Steady Organizer",
		description:
			"Exceptional organizational skills show up in everything you take on, from major projects to the small daily routines that keep life running smoothly and the people around you feeling supported. Bringing people together comes naturally — not just logistically, but emotionally, creating environments where everyone feels valued and heard rather than merely managed or accounted for. New ideas earn your attention when they serve a clear purpose, and that pragmatic filter means the innovations you adopt tend to actually work in practice rather than just sound impressive in a meeting or on paper. Reliability and thoughtful adaptability coexist in your approach, which is rarer than it sounds — most people lean heavily toward one or the other, but you hold both in steady balance without sacrificing either. The systems you build aren't just efficient; they're human, designed with an awareness that real people have to live and work within them and that the best structures are ones people actually want to use. Colleagues and friends rely on you as the person who can take a chaotic situation and bring it to order without steamrolling anyone in the process or imposing rigidity that makes things worse. That satisfaction you feel when something runs smoothly isn't about control — it's about creating conditions where the people around you can do their best work and thrive without unnecessary friction. Practical wisdom grounds every decision, but compassion is always close behind, ensuring that efficiency never comes at the cost of genuine care for the humans involved.",
		color: "#4CAF7B",
	},
	// MMHH → GBEW
	GBEW: {
		name: "The Social Connector",
		description:
			"Social environments feel like home, and within them you have a natural talent for making people feel comfortable, included, and genuinely seen — not just acknowledged but actually understood. Bridging different groups and viewpoints comes easily with a balanced, adaptable perspective that lets you move between circles without ever feeling like an outsider or making others feel like they don't belong. At gatherings, people tend to gravitate toward you without quite knowing why, drawn by an approachability and warmth that feels effortless even when the room is full of strangers who haven't yet found their footing. That ability to connect isn't surface-level charm; it comes from a real interest in understanding where people are coming from and what they need to feel welcome, a curiosity about other people's inner worlds that goes beyond small talk. Communities don't just happen around you — they grow because you actively weave together the threads that connect one person to another, one group to the next, finding common ground that others might miss. The satisfaction of seeing people who might never have met find genuine connection through your introduction is one of the deepest rewards you know. Adaptability keeps your approach fresh: different situations call for different energy, and you shift between them with a fluidity that most people find reassuring rather than disorienting. Genuine human connection is the current that runs beneath everything you do, and the communities you help create tend to be places where everyone genuinely belongs.",
		color: "#FFB347",
	},
	// MMMM → GBAN
	GBAN: {
		name: "The Centered Moderate",
		description:
			"A remarkable balance across all personality dimensions gives you a rare stability that others find both calming and impressive, even if they can't quite articulate what it is about your presence that makes them feel more grounded. Multiple sides of an issue reveal themselves to you naturally, and your response tends toward measured thoughtfulness rather than the impulsive reactions that catch most people off guard or lock them into positions they later regret. Moving between social engagement and quiet reflection happens without friction — your energy adjusts to what the moment requires rather than defaulting to one mode regardless of context or company. That equilibrium isn't passivity or indecisiveness; it's a genuine capacity to hold complexity without being overwhelmed by it, to sit with ambiguity rather than rushing to resolve it prematurely. Life's contradictions don't paralyze you the way they might someone who needs everything to fit into a neat framework. Instead, you navigate them with a composure that comes from understanding that most situations aren't as black-and-white as they first appear, and that patience usually reveals nuance that haste would miss. People in your life often turn to you during conflict or uncertainty because your presence has a grounding effect — not because you tell them what to do, but because your steady perspective helps them think more clearly about what they actually want. That ability to stay centered while the world moves in extremes around you is both a quiet strength and a genuine gift to the people lucky enough to know you well.",
		color: "#808080",
	},
	// MMLH → GBIW
	GBIW: {
		name: "The Quiet Helper",
		description:
			"Meaningful one-on-one interactions hold far more appeal than large social events, and the depth you bring to close relationships is where your true impact shows — not in breadth of connections but in the quality and reliability of the ones you choose to invest in. A pragmatic, relaxed approach to life means you don't get caught up in unnecessary drama or over-complicated plans: things tend to stay simple and genuine in your world, and that simplicity is a gift rather than a limitation. The people closest to you know something that casual acquaintances might miss entirely — a deeply caring heart that expresses itself through quiet generosity rather than grand gestures or public declarations. Real empathy drives those small acts of kindness: remembering a friend's hard week and checking in, helping a neighbor without being asked, offering support that arrives at exactly the right moment because you were paying attention when no one else was. Patience in relationships comes naturally because rushing intimacy has never made sense to you; the connections that matter are the ones built slowly, with trust earned through consistency over time. There's no expectation of reciprocity in how you give — the satisfaction sits in the giving itself, in knowing that your presence made someone's day a little lighter or a difficult moment more bearable. That understated approach to caring might not draw attention the way louder personalities do, but its impact runs deep and lingers long after flashier gestures have faded from memory. The people who truly know you recognize that your quiet way of showing up is one of the most reliable and genuine forms of love there is.",
		color: "#7DCEA0",
	},
	// LHHH → PDEW
	PDEW: {
		name: "The Traditional Leader",
		description:
			"Proven methods and reliable structures form the foundation of everything you build, and that commitment to what works gives others a deep sense of confidence in your leadership that flashier, more improvisational styles rarely achieve. Taking charge in social settings comes naturally — not through dominance or volume but through the clarity and warmth you bring when drawing people together around shared goals and well-defined expectations. Untested ideas get a fair hearing but must prove their worth before earning a place in your plans, because your practical instinct knows that novelty alone doesn't equal value and that enthusiasm without evidence is just noise. That groundedness is what makes your encouragement so effective: when you tell someone they can do something, they believe it, because your track record of following through on your own word precedes you everywhere. Clear expectations aren't constraints in your view — they're gifts that help people focus their energy where it matters most, removing ambiguity so that effort can be directed rather than wasted. The order and stability you create aren't cold or bureaucratic; they're designed with genuine care for the people who operate within them. Colleagues and friends alike know that your systems exist to help everyone do their best work, not to serve your ego or need for control. Building a world where reliability and warmth coexist, where structure supports rather than stifles human potential — that's the project that drives you forward, day after day, with remarkable consistency and quiet conviction.",
		color: "#2E8B57",
	},
	// LHLH → PDIW
	PDIW: {
		name: "The Dependable Supporter",
		description:
			"Familiar approaches and well-tested methods form the backbone of how you move through the world, and that discipline brings a consistency to your life that the people around you find deeply reassuring in ways they might not even consciously recognize. Loyalty runs quiet and deep — showing up for the people you care about isn't something you announce or make a show of, it's simply what you do, reliably and without hesitation, whether anyone is watching or not. One-on-one conversations hold more meaning for you than large social events, because real understanding requires the kind of sustained attention that gets diluted in a crowd or lost in the noise of group dynamics. The relationships you invest in are built on mutual trust, reinforced through thousands of small, consistent actions rather than occasional grand gestures that burn bright and then fade. There's a particular kind of strength in being the person others can always count on, and it's a role you inhabit so naturally that it might not even feel like a choice — it's closer to instinct. Actions speak louder than words in your world: promises mean less than follow-through, and follow-through is something you deliver with quiet, almost effortless reliability. That steadiness extends beyond relationships into how you approach work, commitments, and daily life — methodical, deliberate, and utterly dependable. When the people who know you best describe what makes you irreplaceable, it's rarely a single dramatic moment but the accumulated weight of a thousand times you were exactly where you said you'd be.",
		color: "#5F9EA0",
	},
	// LMHH → GBEW already used for MMHH, this is PBEW
	PBEW: {
		name: "The Energetic Realist",
		description:
			"Practical wisdom and genuine friendliness work together in how you navigate the world, creating connections that feel both real and grounded rather than superficial, forced, or maintained out of obligation rather than genuine interest. Plans flex and adapt in your hands without ever losing sight of the actual goal — a flexibility that comes from caring more about results than about being right about how to get there or proving that your original approach was the best one. Lively social settings suit you perfectly, spaces where your natural warmth and straightforward approach put people at ease and cut through the pretense that makes so many social interactions feel exhausting rather than energizing. There's an energy in how you engage that people find refreshing: no hidden agendas, no complicated subtext, just honest communication and a genuine desire to connect with whoever is in front of you. Reality is where you operate best, and that grounded perspective means your optimism never tips into wishful thinking — you believe in what's possible while staying clear-eyed about what's practical and what's just fantasy dressed up in motivational language. Building real connections matters more to you than building impressive ones, and that priority shows in the quality of your relationships and the loyalty they inspire. The people in your life tend to be there because they value authenticity, which is exactly the currency you trade in. Keeping your feet planted in reality while reaching toward people with warmth and openness is the balance that defines your approach to just about everything.",
		color: "#DAA520",
	},
	// LLHH → PFEW
	PFEW: {
		name: "The Social Pragmatist",
		description:
			"Straightforward warmth and practical reliability make you someone others gravitate toward, especially in social settings where pretense tends to dominate and genuine connection gets buried under layers of performance. An outgoing, friendly nature ensures that no room feels unwelcoming when you're in it — your ease with people is genuine, not rehearsed, and that difference shows in how quickly others relax in your company and start being themselves. Keeping things simple and easygoing isn't laziness or a lack of ambition; it's a deliberate choice rooted in the understanding that complexity for its own sake rarely improves anything and often makes things worse. The relaxed energy you carry helps others drop their guard and feel comfortable being themselves, which is why your friendships tend to be refreshingly honest and free of the drama that plagues more complicated social dynamics. Action always wins over abstract theorizing in your world — if something can be done, you'd rather do it than spend three meetings discussing whether it should be done and another two planning how. Shared experiences form the foundation of your closest bonds: road trips, cooking together, weekend projects, the kinds of activities where memories get made through doing rather than talking. There's a satisfaction in getting things done cleanly and without unnecessary complication that others might overlook but that you feel in your bones. Life doesn't need to be complicated to be meaningful, and the way you live proves that point every single day.",
		color: "#CD853F",
	},
	// LLLL → PFIC
	PFIC: {
		name: "The Reserved Pragmatist",
		description:
			"Doing things your own way, without fanfare or the need for outside approval, is so natural that it barely registers as a choice — it's just how you operate, and it has been for as long as you can remember. Straightforward approaches win every time over complicated systems, and independent thinking keeps you from getting swept up in trends or groupthink that doesn't survive scrutiny or deliver on its promises. Challenges get tackled as they come rather than obsessively planned for, a spontaneous pragmatism that keeps you moving forward while others get stuck in analysis paralysis or committee deliberation. Personal space is more than a preference — it's a requirement for the kind of deep, focused work and unhurried thinking that produces your best results and allows you to operate at a level you can be satisfied with. Solitary activities recharge you in ways that social obligations simply can't: a long walk, a project in the workshop, an evening spent reading or tinkering without interruption or the need to explain yourself. That independence extends to decision-making, where your own judgment consistently outweighs external expectations or popular opinion. Living on your own terms isn't a rebellious stance; it's a practical one, born from experience that your internal compass is more reliable than any crowd's consensus. Freedom, in your world, isn't about dramatic gestures of defiance — it's about the quiet, daily choice to trust yourself, follow your own rhythm, and measure success by standards that actually matter to you rather than ones imposed from the outside.",
		color: "#696969",
	},
	// HLLH → OFIW
	OFIW: {
		name: "The Creative Maverick",
		description:
			"Imagination and spontaneity forge your creative path, leading you wherever curiosity points without much regard for conventional timelines, established expectations, or the way things are supposed to be done. The few people in your inner circle know a side of you that the wider world rarely sees: a deeply loyal, cooperative spirit that coexists with a fiercely independent exterior and reveals itself through sustained dedication rather than easy displays of warmth. Rigid schedules and prescribed methods feel like creative death — the best results, in your experience, come from following inspiration in the moment rather than forcing it through a pre-approved process that was designed for a different kind of mind. Ideas need room to breathe, and you give them that space instinctively, trusting that the worthwhile ones will survive the freedom and the rest will naturally fall away without needing to be formally rejected. That same trust extends to relationships: the connections you value most are the ones where both people have the space to be fully, unapologetically themselves without compromise or performance. Creating something truly original isn't just a goal — it's a compulsion, a need that sits at the core of who you are and drives decisions that might look reckless to more cautious observers. But there's method in the apparent chaos, a pattern that the people closest to you have learned to recognize and respect. Staying connected to the few who truly understand your vision matters more than broad social approval, and those relationships carry a depth that surface-level friendships cannot match.",
		color: "#9B59B6",
	},
	// HLHL → OFEC
	OFEC: {
		name: "The Adventurous Thinker",
		description:
			"New ideas and experiences pull you forward with a kind of enthusiasm that most people reserve for vacations or special occasions — for you, it's just a regular Tuesday, and the world is full of doors waiting to be opened. Charting your own course comes naturally even in a crowd, because the freedom to explore without rigid expectations is non-negotiable in how you live and always has been. Social settings serve a particular purpose in your life: they're places to share your latest discovery, test-drive a new theory, or find someone whose perspective challenges your own in ways that are interesting rather than threatening. But group consensus doesn't hold much authority over your decisions — your instincts have proven reliable enough that trusting them feels like common sense rather than arrogance or recklessness. Open-mindedness and spontaneity work together in you, creating a restlessness that isn't anxious but generative, always reaching toward the next question rather than settling for the last answer. Intellectual adventure is the engine that powers your daily life, turning routine situations into opportunities for learning and ordinary conversations into fascinating tangents that nobody else saw coming. Independence isn't just a personality trait for you — it's the condition that makes everything else possible, the foundation on which curiosity, creativity, and genuine engagement with the world are built. Following that curiosity wherever it leads has taken you places that a more cautious approach never would have, and you wouldn't trade a single detour for the comfort of a predictable path.",
		color: "#E67E22",
	},
	// LHHL → PDEC
	PDEC: {
		name: "The Principled Achiever",
		description:
			"Methodical determination defines how you pursue goals, and that combination of social confidence and fierce self-reliance sets you apart in any room you walk into, whether you're trying to stand out or not. Proven systems and time-tested approaches form the foundation of your success — not because you lack imagination, but because you understand that reliable methods produce reliable results and that consistency compounds over time in ways that brilliance alone cannot match. Speaking up in any setting comes easily, whether it's a boardroom, a family dinner, or a casual conversation with strangers, but the words you choose are guided by your own principles rather than whatever opinion happens to be popular at the moment. That independence of thought isn't contrarian for its own sake; it's the natural outcome of having done the work to form well-reasoned positions and being unwilling to abandon them under social pressure or convenience. Hard work, integrity, and personal accountability aren't just values you admire in theory — they're the daily practices that structure your life and define your relationship with achievement. Results matter deeply to you, but only when they're earned through genuine effort rather than shortcuts, compromise, or borrowed credibility. There's a satisfaction in looking at what you've accomplished and knowing that every piece of it was built on a foundation of discipline and honest work. The confidence this creates is quiet but unshakeable, rooted not in validation from others but in your own clear-eyed assessment of what you've earned through sustained effort.",
		color: "#2C3E50",
	},
	// LHLL → PDIC
	PDIC: {
		name: "The Quiet Strategist",
		description:
			"Careful planning and autonomous execution shape how you approach challenges, building frameworks and systems designed to stand the test of time rather than merely solving today's problem before creating tomorrow's. Well-established methods hold more appeal than experimental approaches, not because novelty scares you but because your practical instinct recognizes that proven tools usually outperform untested ones and that reinventing the wheel is rarely the best use of limited energy. Solitude is where your best thinking happens — quiet, focused environments free from interruption allow you to work at the depth and pace that produce your highest-quality output, the kind of work that you can stand behind without reservation. That preference for working alone isn't antisocial; it's strategic, a recognition that concentration is a finite resource and you'd rather spend it on the work itself than on managing social dynamics that don't contribute to the outcome. The structures you create reflect high standards and independent vision, built with a craftsperson's attention to detail that most people simply don't have the patience for. Conventional and systematic in approach, you find real beauty in well-designed processes and elegant solutions to complex problems that resist brute-force approaches. There's a deep satisfaction in creating something that works reliably, that you can step back from and know it will hold up under pressure because you built it right from the start. Lasting impact matters more to you than immediate recognition, and the quiet confidence that comes from doing excellent work on your own terms is all the validation you need.",
		color: "#34495E",
	},
	// MHLH → GDIW
	GDIW: {
		name: "The Devoted Planner",
		description:
			"A highly organized mind and a deeply caring heart work in tandem for you, creating a distinctive blend of discipline and compassion that shapes everything you do and everything the people around you come to expect. Helping others through careful preparation brings a satisfaction that's hard to explain to people who don't share it — the act of planning itself becomes an expression of care, a way of saying 'I thought about what you'd need before you had to ask.' New ideas earn consideration when they serve a clear purpose, but they also have to prove they're more than just shiny distractions before they earn a permanent place in your approach — pragmatism and openness exist in careful balance. That pragmatic filter keeps you grounded without making you rigid, open to growth while maintaining the stability that defines your character and that others have come to rely on. Quiet, meaningful interactions are where your best qualities shine — one-on-one conversations where reliability and genuine concern for others come through in how you listen, respond, and follow up with actions rather than empty reassurance. There's a particular fulfillment in knowing that your thoughtful planning made someone's life a little easier, a reward that no public recognition could match. The people in your inner circle know they can depend on you in a way that goes beyond mere reliability — it's dependability infused with warmth, planning motivated by love rather than obligation. Moderate openness to change means you evolve steadily rather than dramatically, incorporating new wisdom at a pace that feels sustainable and true to who you are.",
		color: "#27AE60",
	},
	// HMLL → OBIC
	OBIC: {
		name: "The Curious Loner",
		description:
			"Ideas and experiences get explored on your own terms, at your own pace, driven by a love of the mind that ranks personal freedom and intellectual depth above social convention or the approval of people who haven't earned your respect. Unconventional perspectives don't just interest you — they attract you magnetically, pulling you into deep dives on subjects that most people would consider niche, obscure, or too complicated to bother with, and you wouldn't have it any other way. Solitude or very small gatherings are where you do your best living, spaces where conversation can reach the kind of depth that larger groups inevitably dilute through social pressure and the need to keep things light. There's a clarity that comes with spending time alone — thoughts develop fully, ideas connect in unexpected ways, and the noise of other people's opinions fades enough for your own thinking to emerge with confidence and precision. Understanding the world deeply is a driving force that shapes your reading habits, your conversation topics, and the way you spend your free time. Living authentically means something specific to you: freedom from the pressure to conform to social expectations that feel arbitrary or meaningless, the right to engage with the world on terms that make sense to you. That doesn't make you hostile to other people — it makes you selective about how and when you engage, reserving your energy for interactions that offer real substance rather than polite routine. The life of the mind is rich enough to sustain you through long periods of solitude, and the discoveries you make in those quiet hours are among the most valuable things you own.",
		color: "#8E44AD",
	},
	// HHLL → ODIC
	ODIC: {
		name: "The Systematic Innovator",
		description:
			"Imaginative ideas get channeled through structured processes in your hands, producing work that manages to be both genuinely original and meticulously crafted — a combination that most people assume is impossible until they see the evidence. Working independently suits you perfectly, because the quality of your output speaks for itself and seeking the spotlight has never felt necessary or even particularly appealing when the work is strong enough to stand on its own. That combination of creativity and organization is rarer than people realize: most creative minds resist structure, and most organized minds resist the uncertainty that true innovation requires, but you hold both comfortably without feeling pulled in either direction. Projects benefit from your discipline because wild ideas get the engineering they need to actually work in practice, not just look good on paper or impress in a presentation. Personal standards run high, not because you're chasing external validation but because mediocre work simply doesn't feel finished to you — there's an internal bar that demands your best, regardless of whether anyone else is watching or cares. Focused effort is your preferred mode of operation: long stretches of concentrated work where distractions are minimized and the only metric that matters is the quality of what's being built. The things you create tend to carry a distinctive signature — inventive in concept but precise in execution, the product of someone who refuses to sacrifice either imagination or rigor. Building something meaningful through your own standards and sustained effort is the project that never gets old, the one that gives every other project its purpose.",
		color: "#2980B9",
	},
	// LMML → PBAC
	PBAC: {
		name: "The Grounded Individual",
		description:
			"Practical wisdom and balanced expectations guide how you navigate life, and there's a comfort in your own skin that doesn't depend on outside validation, anyone else's approval, or the reassurance that comes from constantly checking your position against the crowd. Familiar paths that have proven reliable over time hold more appeal than untested shortcuts, and that traditional orientation keeps your life stable in ways that more restless personalities might envy if they slowed down long enough to notice. Social engagement happens on your own terms — there's no pressure to overcommit, no guilt about declining invitations that don't feel right, no performance of enthusiasm you don't actually feel just to maintain appearances. That healthy independence isn't coldness; it's self-knowledge, an understanding of your own limits and preferences that lets you show up authentically when you do choose to engage rather than faking energy you don't have. Moderate habits and measured responses keep you on an even keel even when circumstances shift dramatically, providing a steadiness that others find grounding whether they recognize its source or not. Personal authenticity is the value that organizes everything else — decisions get made based on what's actually true for you rather than what looks good or sounds impressive to outside observers. There's a quiet confidence in knowing exactly who you are, not in an arrogant way but in a settled, unshakeable way that doesn't need constant reinforcement or external proof. The life you build reflects your values honestly, and that alignment between who you are and how you live creates a peace that is genuinely hard to fake.",
		color: "#95A5A6",
	},
	// HHMM → ODAN
	ODAN: {
		name: "The Thoughtful Creator",
		description:
			"Creative ideas come to life through careful planning in your world, and the connections you maintain are meaningful precisely because you don't overextend yourself chasing quantity over quality or spreading your attention so thin that nothing gets the depth it deserves. A rich imagination pairs with real discipline, ensuring that projects don't just start with excitement but actually reach completion — a follow-through that separates you from the many creative minds who generate ideas endlessly but struggle to ship anything. Social engagement happens with intention: choosing quality interactions over constant activity, investing energy in conversations that matter rather than spreading thin across every invitation that arrives. That selectivity isn't aloofness — it's resource management by someone who knows that depth requires focus and focus requires choosing where to spend your limited attention and energy. Open-mindedness keeps your creative well fed with new influences and unexpected perspectives, while organizational instinct ensures those inputs get processed into something tangible rather than accumulated as inspiration that never goes anywhere useful. The work you produce reflects both inventive spirit and a measured approach, giving your output a distinctive quality: imaginative but polished, creative but reliable, the kind of thing people trust precisely because it's also well-crafted. Balancing these apparent opposites is something you do so naturally it might not register as remarkable, but people who see your process up close recognize it as a genuine and uncommon gift. Every project carries the imprint of someone who cares as much about how something is built as about what it ultimately becomes.",
		color: "#5DADE2",
	},
};
