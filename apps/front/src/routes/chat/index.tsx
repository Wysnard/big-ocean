import { createFileRoute, redirect } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { FacetSidePanel } from "@/components/FacetSidePanel";
import { TherapistChat } from "@/components/TherapistChat";
import { useMessageEvidence } from "@/hooks/use-evidence";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export const Route = createFileRoute("/chat/")({
	validateSearch: (search: Record<string, unknown>) => {
		return {
			sessionId: (search.sessionId as string) || undefined,
			highlightMessageId: (search.highlightMessageId as string) || undefined,
			highlightQuote: (search.highlightQuote as string) || undefined,
			highlightStart: typeof search.highlightStart === "number" ? search.highlightStart : undefined,
			highlightEnd: typeof search.highlightEnd === "number" ? search.highlightEnd : undefined,
			highlightScore: typeof search.highlightScore === "number" ? search.highlightScore : undefined,
		};
	},
	beforeLoad: async (context) => {
		const { search } = context;

		if (!search.sessionId) {
			const response = await fetch(`${API_URL}/api/assessment/start`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({}),
				credentials: "include",
			});

			if (!response.ok) {
				const error = await response.json().catch(() => ({ message: response.statusText }));
				throw new Error(error.message || `Failed to start assessment: ${response.status}`);
			}

			const data = await response.json();
			throw redirect({
				to: "/chat",
				search: { sessionId: data.sessionId },
			});
		}
	},
	component: RouteComponent,
});

function RouteComponent() {
	const {
		sessionId,
		highlightMessageId,
		highlightQuote,
		highlightStart,
		highlightEnd,
		highlightScore,
	} = Route.useSearch();

	// Facet side panel state
	const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
	const [facetPanelOpen, setFacetPanelOpen] = useState(false);

	// Fetch evidence for selected message
	const { data: messageEvidence, isLoading: evidenceLoading } = useMessageEvidence(
		selectedMessageId,
		facetPanelOpen,
	);

	const handleMessageClick = (messageId: string) => {
		setSelectedMessageId(messageId);
		setFacetPanelOpen(true);
	};

	const handleCloseFacetPanel = () => {
		setFacetPanelOpen(false);
		setSelectedMessageId(null);
	};

	if (!sessionId) {
		return (
			<div className="h-screen flex items-center justify-center bg-gray-50">
				<div className="text-center">
					<Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
					<p className="text-gray-600">Creating assessment session...</p>
				</div>
			</div>
		);
	}

	return (
		<>
			<TherapistChat
				sessionId={sessionId}
				onMessageClick={handleMessageClick}
				highlightMessageId={highlightMessageId}
				highlightQuote={highlightQuote}
				highlightStart={highlightStart}
				highlightEnd={highlightEnd}
				highlightScore={highlightScore}
			/>

			{/* Facet Side Panel */}
			<FacetSidePanel
				sessionId={sessionId}
				messageId={selectedMessageId || ""}
				evidence={messageEvidence}
				isLoading={evidenceLoading}
				isOpen={facetPanelOpen}
				onClose={handleCloseFacetPanel}
			/>
		</>
	);
}
