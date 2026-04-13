import { Link } from "@tanstack/react-router";
import { Button } from "@workspace/ui/components/button";

interface PostAssessmentTransitionButtonProps {
	sessionId: string;
}

export function PostAssessmentTransitionButton({ sessionId }: PostAssessmentTransitionButtonProps) {
	return (
		<Button
			asChild
			size="lg"
			className="w-full max-w-md rounded-full border border-primary/20 bg-gradient-to-r from-tertiary via-primary to-secondary px-6 text-base font-semibold text-white shadow-lg shadow-primary/20 transition-all hover:scale-[1.01] hover:shadow-xl hover:shadow-secondary/25 focus-visible:ring-primary/60"
		>
			<Link
				data-slot="post-assessment-transition-button"
				data-testid="post-assessment-transition-button"
				to="/results/$conversationSessionId"
				params={{ conversationSessionId: sessionId }}
				search={{ view: "portrait" }}
			>
				Show me what you found →
			</Link>
		</Button>
	);
}
