import { useNavigate } from "@tanstack/react-router";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Loader2, Send } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useTherapistChat } from "@/hooks/useTherapistChat";
import { SignUpModal } from "./auth/SignUpModal";
import { ErrorBanner } from "./ErrorBanner";
import { ProgressBar } from "./ProgressBar";

interface TherapistChatProps {
	sessionId: string;
	onMessageClick?: (messageId: string) => void;
	highlightMessageId?: string;
	highlightQuote?: string;
	highlightStart?: number;
	highlightEnd?: number;
	highlightScore?: number;
}

/**
 * Typing indicator bubble shown while waiting for Nerin's response.
 */
function TypingIndicator() {
	return (
		<div className="flex justify-start">
			<div className="max-w-[85%] lg:max-w-md px-4 py-3 rounded-2xl bg-muted border border-border">
				<div className="flex gap-1.5 items-center">
					<span
						className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce"
						style={{ animationDelay: "0ms" }}
					/>
					<span
						className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce"
						style={{ animationDelay: "150ms" }}
					/>
					<span
						className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce"
						style={{ animationDelay: "300ms" }}
					/>
				</div>
			</div>
		</div>
	);
}

/**
 * Render message content with optional highlighting
 *
 * Color-codes highlighting based on evidence score using Tailwind data attributes:
 * - Green (score >= 15): Strong positive signal
 * - Yellow (score 8-14): Moderate signal
 * - Red (score < 8): Weak/contradictory signal
 */
function renderMessageContent(
	content: string,
	messageId: string,
	highlightMessageId?: string,
	highlightStart?: number,
	highlightEnd?: number,
	highlightScore?: number,
): React.ReactNode {
	if (
		messageId !== highlightMessageId ||
		highlightStart === undefined ||
		highlightEnd === undefined
	) {
		return content;
	}

	const before = content.slice(0, highlightStart);
	const highlighted = content.slice(highlightStart, highlightEnd);
	const after = content.slice(highlightEnd);

	// Determine score level (default to high if score not provided for backward compatibility)
	const score = highlightScore ?? 15;
	const scoreLevel = score >= 15 ? "high" : score >= 8 ? "medium" : "low";

	return (
		<>
			{before}
			<mark
				data-score={scoreLevel}
				className="rounded px-1 data-[score=high]:bg-green-500/20 data-[score=high]:text-green-700 dark:data-[score=high]:text-green-300 data-[score=medium]:bg-yellow-500/20 data-[score=medium]:text-yellow-700 dark:data-[score=medium]:text-yellow-300 data-[score=low]:bg-red-500/20 data-[score=low]:text-red-700 dark:data-[score=low]:text-red-300"
			>
				{highlighted}
			</mark>
			{after}
		</>
	);
}

export function TherapistChat({
	sessionId,
	onMessageClick,
	highlightMessageId,
	highlightQuote,
	highlightStart,
	highlightEnd,
	highlightScore,
}: TherapistChatProps) {
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

	// Scroll to highlighted message
	useEffect(() => {
		if (highlightMessageId && messages.length > 0) {
			setTimeout(() => {
				const element = document.querySelector(`[data-message-id="${highlightMessageId}"]`);
				element?.scrollIntoView({ behavior: "smooth", block: "center" });
			}, 300); // Delay to ensure DOM is ready
		}
	}, [highlightMessageId, messages.length]);

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

			<div className="h-[calc(100dvh-3.5rem)] flex flex-col overflow-hidden overscroll-none bg-background">
				{/* Header */}
				<div className="border-b border-border px-4 md:px-6 py-3 md:py-4 shadow-sm backdrop-blur-sm bg-card/80">
					<h1 className="text-xl md:text-2xl font-bold text-foreground">
						Big Five Personality Assessment
					</h1>
					<p className="text-xs md:text-sm text-muted-foreground mt-1">
						Session ID:{" "}
						<code className="bg-muted px-2 py-0.5 md:py-1 rounded text-muted-foreground text-xs">
							{sessionId}
						</code>
					</p>
				</div>

				{/* Progress Bar - only show when messages exist */}
				{messages.length > 0 && !isResuming && !resumeError && (
					<div className="border-b border-border">
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
									<Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
									<p className="text-muted-foreground mt-4">Loading your assessment...</p>
								</div>
							</div>
						)}

						{/* SessionNotFound Error */}
						{!isResuming &&
							resumeError &&
							(resumeError.message.includes("404") || resumeError.message.includes("SessionNotFound")) && (
								<div className="flex-1 flex items-center justify-center">
									<div className="text-center max-w-md">
										<p className="text-destructive-foreground text-lg">Session not found</p>
										<p className="text-muted-foreground mt-2">
											This session may have expired or doesn't exist.
										</p>
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
										<p className="text-destructive-foreground text-lg">Something went wrong</p>
										<p className="text-muted-foreground mt-2">Unable to load your assessment.</p>
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
										<Card className="w-full max-w-md">
											<CardHeader>
												<CardTitle className="text-center">Welcome to Personality Assessment</CardTitle>
											</CardHeader>
											<CardContent className="space-y-4">
												<p className="text-muted-foreground text-center">
													The AI therapist will ask you questions to evaluate your personality across five key
													dimensions. Ready to begin?
												</p>
												<Button onClick={() => sendMessage()} disabled={isLoading} className="w-full">
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
													data-slot="chat-bubble"
													data-message-id={msg.id}
													onClick={() => handleMessageClick(msg.id, msg.role)}
													className="max-w-[80%] lg:max-w-md rounded-2xl px-4 py-3 text-left bg-primary text-primary-foreground cursor-pointer hover:ring-2 hover:ring-ring/40 transition-shadow"
												>
													<p className="text-sm leading-relaxed">
														{renderMessageContent(
															msg.content,
															msg.id,
															highlightMessageId,
															highlightStart,
															highlightEnd,
															highlightScore,
														)}
													</p>
													<p className="text-xs mt-1 text-primary-foreground/70">
														{msg.timestamp.toLocaleTimeString()}
													</p>
												</button>
											) : (
												<div
													data-slot="chat-bubble"
													data-message-id={msg.id}
													className="max-w-[80%] lg:max-w-md rounded-2xl px-4 py-3 bg-muted text-foreground"
												>
													<p className="text-sm leading-relaxed">
														{renderMessageContent(
															msg.content,
															msg.id,
															highlightMessageId,
															highlightStart,
															highlightEnd,
															highlightScore,
														)}
													</p>
													<p className="text-xs mt-1 text-muted-foreground">
														{msg.timestamp.toLocaleTimeString()}
													</p>
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
						<div className="border-t border-border bg-card/80 backdrop-blur-sm p-3 md:p-4 sticky bottom-0">
							<div className="flex gap-2">
								<input
									ref={inputRef}
									type="text"
									value={inputValue}
									onChange={(e) => setInputValue(e.target.value)}
									onKeyDown={handleKeyDown}
									placeholder={isCompleted ? "Assessment complete!" : "Type your response here..."}
									disabled={isLoading || isCompleted}
									className="flex-1 px-4 py-2 bg-muted border border-border text-foreground rounded-lg placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
								/>
								<Button
									onClick={handleSendMessage}
									disabled={!inputValue.trim() || isLoading || isCompleted}
									size="sm"
								>
									{isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
								</Button>
							</div>
						</div>
					</div>
				</div>

				{/* Celebration Overlay (70%+ Confidence) */}
				{isConfidenceReady && !hasShownCelebration && (
					<div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60">
						<div className="bg-card border border-border rounded-2xl p-8 max-w-md text-center shadow-xl">
							<h2 className="text-2xl font-bold text-foreground">Your Personality Profile is Ready!</h2>
							<p className="text-muted-foreground mt-2">You've reached 70%+ confidence</p>
							<div className="mt-6 flex gap-3 justify-center">
								<Button
									onClick={() => navigate({ to: "/results/$sessionId", params: { sessionId } })}
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
