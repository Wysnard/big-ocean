import { PortraitGeneratorRepository } from "@workspace/domain";
import { Effect, Layer } from "effect";

const MOCK_PORTRAIT =
	"You approach life with a distinctive blend of curiosity and practicality that makes you uniquely effective. Throughout our conversation, your thoughtful responses revealed someone who weighs options carefully before committing. You have a natural talent for seeing multiple perspectives, which makes you an excellent problem-solver and trusted advisor. Your emotional awareness runs deep — you pick up on subtleties that others miss. When faced with challenges, you prefer to understand the full picture before acting, which sometimes looks like hesitation but is actually strategic patience. Your relationships matter deeply to you, and you invest genuine energy into understanding the people around you.";

export const PortraitGeneratorClaudeRepositoryLive = Layer.succeed(
	PortraitGeneratorRepository,
	PortraitGeneratorRepository.of({
		generatePortrait: (_input) => Effect.succeed(MOCK_PORTRAIT),
	}),
);
