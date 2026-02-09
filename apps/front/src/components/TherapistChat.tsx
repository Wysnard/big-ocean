import { useNavigate } from "@tanstack/react-router";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { BarChart3, Loader2, Send, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useTherapistChat } from "@/hooks/useTherapistChat";
import { SignUpModal } from "./auth/SignUpModal";
import { ErrorBanner } from "./ErrorBanner";
import { ProgressBar } from "./ProgressBar";

interface TherapistChatProps {
	sessionId: string;
	onMessageClick?: (messageId: string) => void;
}

const traitLabels: Record<string, string> = {
	opennessConfidence: "Openness",
	conscientiousnessConfidence: "Conscientiousness",
	extraversionConfidence: "Extraversion",
	agreeablenessConfidence: "Agreeableness",
	neuroticismConfidence: "Neuroticism",
};

/**
 * Typing indicator bubble shown while waiting for Nerin's response.
 */
function TypingIndicator() {
	return (
		<div className="flex justify-start">
			<div className="max-w-[85%] lg:max-w-md px-4 py-3 rounded-lg bg-slate-700/50 border border-slate-600">
				<div className="flex gap-1.5 items-center">
					<span
						className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
						style={{ animationDelay: "0ms" }}
					/>
					<span
						className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
						style={{ animationDelay: "150ms" }}
					/>
					<span
						className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
						style={{ animationDelay: "300ms" }}
					/>
				</div>
			</div>
		</div>
	);
}

/**
 * Trait confidence sidebar content, shared between desktop sidebar and mobile bottom sheet.
 */
function TraitSidebar({
	traits,
	isCompleted,
}: {
	traits: Record<string, number>;
	isCompleted: boolean;
}) {
	return (
		<Card className="bg-slate-800/50 border-slate-700">
			<CardHeader>
				<CardTitle className="text-lg text-white">
					{isCompleted ? "Assessment Complete!" : "Current Scores"}
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				{Object.entries(traitLabels).map(([key, label]) => {
					const score = traits[key] ?? 0;
					const percentage = Math.round(score);
					const color =
						percentage >= 90 ? "bg-green-500" : percentage >= 70 ? "bg-yellow-500" : "bg-orange-500";

					return (
						<div key={key}>
							<div className="flex justify-between mb-2">
								<span className="text-sm font-medium text-gray-300">{label}</span>
								<span className="text-sm font-bold text-gray-100">{percentage}%</span>
							</div>
							<div className="w-full bg-slate-700 rounded-full h-2">
								<div
									className={`h-2 rounded-full transition-all ${color}`}
									style={{ width: `${percentage}%` }}
								/>
							</div>
						</div>
					);
				})}

				{isCompleted && (
					<div className="mt-4 p-3 bg-green-900/20 border border-green-700/30 rounded-lg">
						<p className="text-sm text-green-200 font-medium">Assessment completed successfully!</p>
					</div>
				)}
			</CardContent>
		</Card>
	);
}

export function TherapistChat({ sessionId, onMessageClick }: TherapistChatProps) {
	const [inputValue, setInputValue] = useState("");
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const {
		messages,
		traits,
		isLoading,
		isCompleted,
		errorMessage,
		errorType,
		clearError,
		retryLastMessage,
		sendMessage,
		isResuming,
		resumeError,
		isConfidenceReady,
		hasShownCelebration,
		setHasShownCelebration,
	} = useTherapistChat(sessionId);
	const { isAuthenticated } = useAuth();
	const navigate = useNavigate();

	// Modal state for sign-up prompt
	const [showSignUpModal, setShowSignUpModal] = useState(false);
	const [hasShownModal, setHasShownModal] = useState(false);

	// Mobile traits bottom sheet
	const [showMobileTraits, setShowMobileTraits] = useState(false);

	// Calculate average confidence for progress bar
	const avgConfidence = useMemo(() => {
		return (
			(traits.openness +
				traits.conscientiousness +
				traits.extraversion +
				traits.agreeableness +
				traits.neuroticism) /
			5
		);
	}, [traits]);

	// Auto-scroll to the latest message when message count changes
	const messageCount = messages.length;
	// biome-ignore lint/correctness/useExhaustiveDependencies: messageCount triggers scroll on new messages
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messageCount]);

	// SessionNotFound: redirect to /chat to create new session via router
	useEffect(() => {
		if (errorType === "session") {
			navigate({ to: "/chat" });
		}
	}, [errorType, navigate]);

	// Trigger sign-up modal after first user message
	useEffect(() => {
		const userMessages = messages.filter((m) => m.role === "user");
		if (userMessages.length === 1 && !hasShownModal && !isAuthenticated) {
			setShowSignUpModal(true);
			setHasShownModal(true);
		}
	}, [messages, hasShownModal, isAuthenticated]);

	// Mobile keyboard handling via visualViewport API
	useEffect(() => {
		const viewport = window.visualViewport;
		if (!viewport) return;
		const onResize = () => {
			inputRef.current?.scrollIntoView({ block: "nearest" });
		};
		viewport.addEventListener("resize", onResize);
		return () => viewport.removeEventListener("resize", onResize);
	}, []);

	const handleSendMessage = async () => {
		if (!inputValue.trim() || isLoading) return;
		await sendMessage(inputValue);
		setInputValue("");
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSendMessage();
		}
	};

	const handleMessageClick = (messageId: string, role: string) => {
		if (role === "user" && onMessageClick) {
			onMessageClick(messageId);
		}
	};

	return (
		<>
			{/* Sign-Up Modal */}
			<SignUpModal
				isOpen={showSignUpModal}
				sessionId={sessionId}
				onClose={() => setShowSignUpModal(false)}
			/>

			<div className="h-screen flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
				{/* Header */}
				<div className="bg-slate-800/50 border-b border-slate-700 px-4 md:px-6 py-3 md:py-4 shadow-sm backdrop-blur-sm">
					<h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
						Big Five Personality Assessment
					</h1>
					<p className="text-xs md:text-sm text-gray-400 mt-1">
						Session ID:{" "}
						<code className="bg-slate-700 px-2 py-0.5 md:py-1 rounded text-gray-300 text-xs">
							{sessionId}
						</code>
					</p>
				</div>

				{/* Progress Bar - only show when messages exist */}
				{messages.length > 0 && !isResuming && !resumeError && (
					<div className="bg-slate-800/50 border-b border-slate-700">
						<ProgressBar value={avgConfidence} showPercentage={true} />
					</div>
				)}

				{/* Main Content */}
				<div className="flex-1 overflow-hidden flex gap-4 p-4">
					{/* Messages Area */}
					<div className="flex-1 flex flex-col min-w-0">
						{/* Loading State */}
						{isResuming && (
							<div className="flex-1 flex items-center justify-center">
								<div className="text-center">
									<Loader2 className="h-8 w-8 animate-spin text-blue-400 mx-auto" />
									<p className="text-slate-300 mt-4">Loading your assessment...</p>
								</div>
							</div>
						)}

						{/* SessionNotFound Error */}
						{!isResuming &&
							resumeError &&
							(resumeError.message.includes("404") || resumeError.message.includes("SessionNotFound")) && (
								<div className="flex-1 flex items-center justify-center">
									<div className="text-center max-w-md">
										<p className="text-red-400 text-lg">Session not found</p>
										<p className="text-slate-400 mt-2">This session may have expired or doesn't exist.</p>
										<Button className="mt-4" onClick={() => navigate({ to: "/chat" })}>
											Start New Assessment
										</Button>
									</div>
								</div>
							)}

						{/* Generic Resume Error */}
						{!isResuming &&
							resumeError &&
							!resumeError.message.includes("404") &&
							!resumeError.message.includes("SessionNotFound") && (
								<div className="flex-1 flex items-center justify-center">
									<div className="text-center max-w-md">
										<p className="text-red-400 text-lg">Something went wrong</p>
										<p className="text-slate-400 mt-2">Unable to load your assessment.</p>
										<Button className="mt-4" onClick={() => window.location.reload()}>
											Retry
										</Button>
									</div>
								</div>
							)}

						{/* Messages (only show if not loading and no resume error) */}
						{!isResuming && !resumeError && (
							<div className="flex-1 overflow-y-auto space-y-4 mb-4">
								{messages.length === 0 ? (
									<div className="h-full flex items-center justify-center">
										<Card className="w-full max-w-md bg-slate-800/50 border-slate-700">
											<CardHeader>
												<CardTitle className="text-center text-white">
													Welcome to Personality Assessment
												</CardTitle>
											</CardHeader>
											<CardContent className="space-y-4">
												<p className="text-gray-300 text-center">
													The AI therapist will ask you questions to evaluate your personality across five key
													dimensions. Ready to begin?
												</p>
												<Button
													onClick={() => sendMessage()}
													disabled={isLoading}
													className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
												>
													{isLoading ? (
														<>
															<Loader2 className="mr-2 h-4 w-4 animate-spin" />
															Starting...
														</>
													) : (
														"Start Assessment"
													)}
												</Button>
											</CardContent>
										</Card>
									</div>
								) : (
									messages.map((msg) => (
										<div
											key={msg.id}
											className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
										>
											{msg.role === "user" ? (
												<button
													type="button"
													data-message-id={msg.id}
													onClick={() => handleMessageClick(msg.id, msg.role)}
													className="max-w-[85%] lg:max-w-md px-4 py-2 rounded-lg text-left bg-gradient-to-r from-blue-500 to-purple-500 text-white cursor-pointer hover:ring-2 hover:ring-blue-300/40 transition-shadow"
												>
													<p className="text-sm">{msg.content}</p>
													<p className="text-xs mt-1 text-blue-100">{msg.timestamp.toLocaleTimeString()}</p>
												</button>
											) : (
												<div
													data-message-id={msg.id}
													className="max-w-[85%] lg:max-w-md px-4 py-2 rounded-lg bg-slate-700/50 border border-slate-600 text-gray-100"
												>
													<p className="text-sm">{msg.content}</p>
													<p className="text-xs mt-1 text-gray-400">{msg.timestamp.toLocaleTimeString()}</p>
												</div>
											)}
										</div>
									))
								)}

								{/* Typing indicator while loading */}
								{isLoading && <TypingIndicator />}

								<div ref={messagesEndRef} />
							</div>
						)}

						{/* Error Banner */}
						{errorMessage && (
							<ErrorBanner
								message={errorMessage}
								onRetry={errorType === "network" || errorType === "generic" ? retryLastMessage : undefined}
								onDismiss={clearError}
								autoDismissMs={errorType === "budget" || errorType === "rate-limit" ? 0 : 5000}
							/>
						)}

						{/* Input Area */}
						<div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 md:p-4 backdrop-blur-sm sticky bottom-0">
							<div className="flex gap-2">
								<input
									ref={inputRef}
									type="text"
									value={inputValue}
									onChange={(e) => setInputValue(e.target.value)}
									onKeyDown={handleKeyDown}
									placeholder={isCompleted ? "Assessment complete!" : "Type your response here..."}
									disabled={isLoading || isCompleted}
									className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
								/>
								<Button
									onClick={handleSendMessage}
									disabled={!inputValue.trim() || isLoading || isCompleted}
									size="sm"
									className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
								>
									{isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
								</Button>
							</div>
						</div>
					</div>

					{/* Traits Sidebar — Desktop only */}
					<div className="hidden md:flex md:w-80 flex-col">
						<TraitSidebar traits={traits} isCompleted={isCompleted} />
					</div>
				</div>

				{/* Mobile: floating confidence button */}
				<div className="md:hidden fixed bottom-20 right-4 z-10">
					<button
						type="button"
						onClick={() => setShowMobileTraits(true)}
						className="bg-slate-700 rounded-full p-3 shadow-lg hover:bg-slate-600 transition-colors"
						aria-label="Show trait scores"
					>
						<BarChart3 className="h-5 w-5 text-white" />
					</button>
				</div>

				{/* Mobile: traits bottom sheet */}
				{showMobileTraits && (
					<div className="md:hidden fixed inset-0 z-50 flex items-end">
						{/* Backdrop */}
						<button
							type="button"
							className="absolute inset-0 bg-black/50 cursor-default"
							onClick={() => setShowMobileTraits(false)}
							aria-label="Close trait scores"
						/>
						{/* Sheet */}
						<div className="relative w-full max-h-[60vh] overflow-y-auto bg-slate-900 border-t border-slate-700 rounded-t-xl p-4">
							<div className="flex justify-between items-center mb-4">
								<h2 className="text-lg font-bold text-white">Trait Scores</h2>
								<button
									type="button"
									onClick={() => setShowMobileTraits(false)}
									className="text-gray-400 hover:text-white"
									aria-label="Close"
								>
									<X className="h-5 w-5" />
								</button>
							</div>
							<TraitSidebar traits={traits} isCompleted={isCompleted} />
						</div>
					</div>
				)}

				{/* Celebration Overlay (70%+ Confidence) */}
				{isConfidenceReady && !hasShownCelebration && (
					<div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60">
						<div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 max-w-md text-center">
							<h2 className="text-2xl font-bold text-white">Your Personality Profile is Ready!</h2>
							<p className="text-slate-300 mt-2">You've reached 70%+ confidence</p>
							<div className="mt-6 flex gap-3 justify-center">
								<Button
									onClick={() => navigate({ to: "/results/$sessionId", params: { sessionId } })}
									className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
									data-testid="view-results-btn"
								>
									View My Results
								</Button>
								<Button variant="outline" onClick={() => setHasShownCelebration(true)}>
									Keep Exploring
								</Button>
							</div>
						</div>
					</div>
				)}
			</div>
		</>
	);
}
