import { Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@workspace/ui/components/button";
import { Loader2, Send } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getPlaceholder } from "@/constants/chat-placeholders";
import { useAuth } from "@/hooks/use-auth";
import { useTherapistChat } from "@/hooks/useTherapistChat";
import { SignUpModal } from "./auth/SignUpModal";
import { ErrorBanner } from "./ErrorBanner";
import { NerinAvatar } from "./NerinAvatar";
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
 * Returns relative time string from a Date: "just now", "X min ago", "X hr ago", or date string.
 */
function getRelativeTime(date: Date): string {
	const diffMs = Date.now() - date.getTime();
	const diffSec = Math.floor(diffMs / 1000);
	const diffMin = Math.floor(diffSec / 60);
	const diffHr = Math.floor(diffMin / 60);

	if (diffSec < 60) return "just now";
	if (diffMin < 60) return `${diffMin} min ago`;
	if (diffHr < 24) return `${diffHr} hr ago`;
	return date.toLocaleDateString();
}

/** Milestone thresholds and their Nerin-voice messages */
const MILESTONES = [
	{
		threshold: 25,
		message: "We're off to a great start — I'm already seeing some interesting patterns.",
	},
	{
		threshold: 50,
		message: "Halfway there! Your personality profile is really taking shape.",
	},
	{
		threshold: 70,
		message:
			"Your profile is ready! You can view your results anytime, or keep chatting to add more depth.",
	},
] as const;

/**
 * Typing indicator bubble shown while waiting for Nerin's response.
 */
function TypingIndicator({ confidence }: { confidence: number }) {
	return (
		<div className="flex items-end gap-2 justify-start">
			<NerinAvatar size={32} confidence={confidence} className="shrink-0 mb-1" />
			<div className="max-w-[85%] lg:max-w-md px-4 py-3 rounded-2xl rounded-bl-sm bg-muted border border-border">
				<div className="flex gap-1.5 items-center">
					<span
						className="w-2 h-2 bg-muted-foreground/50 rounded-full motion-safe:animate-bounce"
						style={{ animationDelay: "0ms" }}
					/>
					<span
						className="w-2 h-2 bg-muted-foreground/50 rounded-full motion-safe:animate-bounce"
						style={{ animationDelay: "150ms" }}
					/>
					<span
						className="w-2 h-2 bg-muted-foreground/50 rounded-full motion-safe:animate-bounce"
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
	const textareaRef = useRef<HTMLTextAreaElement>(null);
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

	// Milestone tracking — threshold → message index where it triggered
	const [shownMilestones, setShownMilestones] = useState<Map<number, number>>(new Map());

	// Timestamp re-render ticker (updates every 60s)
	const [, setTimeTick] = useState(0);
	useEffect(() => {
		const interval = setInterval(() => setTimeTick((t) => t + 1), 60_000);
		return () => clearInterval(interval);
	}, []);

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

	// Track milestone crossings — record message count at trigger time for positioning
	useEffect(() => {
		for (const milestone of MILESTONES) {
			if (avgConfidence >= milestone.threshold && !shownMilestones.has(milestone.threshold)) {
				setShownMilestones((prev) => {
					const next = new Map(prev);
					next.set(milestone.threshold, messages.length);
					return next;
				});
			}
		}
	}, [avgConfidence, shownMilestones, messages.length]);

	// Placeholder rotation based on user message count
	const userMessageCount = useMemo(
		() => messages.filter((m) => m.role === "user").length,
		[messages],
	);
	const [placeholder, setPlaceholder] = useState(() => getPlaceholder(0));
	useEffect(() => {
		setPlaceholder(getPlaceholder(userMessageCount));
	}, [userMessageCount]);

	// Textarea auto-resize handler
	const handleTextareaResize = useCallback(() => {
		const textarea = textareaRef.current;
		if (!textarea) return;
		textarea.style.height = "auto";
		textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
	}, []);

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
			textareaRef.current?.scrollIntoView({ block: "nearest" });
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
		// Reset textarea height after sending
		if (textareaRef.current) {
			textareaRef.current.style.height = "auto";
		}
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

	// Determine celebration input placeholder
	const inputPlaceholder = useMemo(() => {
		if (isCompleted) return "Assessment complete!";
		if (isConfidenceReady && !hasShownCelebration) return "Keep chatting to add more depth...";
		return placeholder;
	}, [isCompleted, isConfidenceReady, hasShownCelebration, placeholder]);

	return (
		<>
			{/* Sign-Up Modal */}
			<SignUpModal
				isOpen={showSignUpModal}
				sessionId={sessionId}
				onClose={() => setShowSignUpModal(false)}
			/>

			<div className="h-[calc(100dvh-3.5rem)] flex flex-col overflow-hidden overscroll-none bg-background">
				{/* Header — Nerin-focused minimal */}
				<div
					data-slot="chat-header"
					className="border-b border-border px-4 md:px-6 py-3 md:py-4 shadow-sm backdrop-blur-sm bg-card/80 flex items-center justify-between"
				>
					<div className="flex items-center gap-2">
						<NerinAvatar size={28} confidence={avgConfidence} />
						<span className="text-lg font-heading font-semibold text-foreground">Nerin</span>
					</div>
					{isConfidenceReady && (
						<Link
							to="/results/$sessionId"
							params={{ sessionId }}
							className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
							data-testid="view-results-header-link"
						>
							View Your Results
						</Link>
					)}
				</div>

				{/* Progress Bar - only show when messages exist */}
				{messages.length > 0 && !isResuming && !resumeError && (
					<div className="border-b border-border">
						<ProgressBar value={avgConfidence} showPercentage={false} />
					</div>
				)}

				{/* Main Content */}
				<div className="flex-1 overflow-hidden flex gap-4 p-4">
					{/* Messages Area */}
					<div className="flex-1 flex flex-col">
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
								{messages.length > 0 &&
									messages.map((msg, index) => (
										<div key={msg.id} className="motion-safe:animate-fade-in-up">
											<div
												className={`flex ${msg.role === "user" ? "justify-end" : "items-end gap-2 justify-start"}`}
											>
												{msg.role === "user" ? (
													<button
														type="button"
														data-slot="chat-bubble"
														data-message-id={msg.id}
														onClick={() => handleMessageClick(msg.id, msg.role)}
														className="max-w-[90%] lg:max-w-md rounded-2xl rounded-br-sm px-4 py-3 text-left bg-primary text-primary-foreground cursor-pointer hover:ring-2 hover:ring-ring/40 transition-shadow"
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
															{getRelativeTime(msg.timestamp)}
														</p>
													</button>
												) : (
													<>
														<div data-slot="nerin-message-avatar" className="shrink-0 mb-1">
															<NerinAvatar size={32} confidence={avgConfidence} />
														</div>
														<div
															data-slot="chat-bubble"
															data-message-id={msg.id}
															className="max-w-[90%] lg:max-w-md rounded-2xl rounded-bl-sm px-4 py-3 bg-muted text-foreground"
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
																{getRelativeTime(msg.timestamp)}
															</p>
														</div>
													</>
												)}
											</div>
											{/* Milestone badges triggered at this message position */}
											{MILESTONES.map((milestone) =>
												shownMilestones.get(milestone.threshold) === index + 1 ? (
													<div
														key={`milestone-${milestone.threshold}`}
														data-slot="milestone-badge"
														className="w-full flex justify-center py-2 mt-2"
													>
														<div className="bg-accent/50 border border-accent rounded-full px-4 py-2 text-center max-w-sm">
															<p className="text-sm text-accent-foreground">
																<span className="mr-1.5">✨</span>
																{milestone.message}
															</p>
														</div>
													</div>
												) : null,
											)}
										</div>
									))}

								{/* In-chat celebration card (replaces modal overlay) */}
								{isConfidenceReady && !hasShownCelebration && (
									<div
										data-slot="celebration-card"
										className="w-full px-4 py-2 motion-safe:animate-fade-in-up"
									>
										<div className="bg-card border-2 border-primary rounded-2xl p-6 text-center shadow-lg">
											<h2 className="text-xl font-heading font-bold text-foreground">
												Your Personality Profile is Ready!
											</h2>
											<p className="text-muted-foreground mt-2">
												You've reached {Math.round(avgConfidence)}% confidence
											</p>
											<div className="mt-4 flex gap-3 justify-center">
												<Button
													onClick={() =>
														navigate({
															to: "/results/$sessionId",
															params: { sessionId },
														})
													}
													data-testid="view-results-btn"
												>
													View Results
												</Button>
												<Button variant="outline" onClick={() => setHasShownCelebration(true)}>
													Keep Exploring
												</Button>
											</div>
										</div>
									</div>
								)}

								{/* Typing indicator while loading */}
								{isLoading && <TypingIndicator confidence={avgConfidence} />}

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
						<div className="border-t border-border bg-card/80 backdrop-blur-sm p-3 md:p-4 sticky bottom-0 pb-[env(safe-area-inset-bottom)]">
							<div className="flex gap-2 items-end">
								<textarea
									ref={textareaRef}
									data-slot="chat-input"
									value={inputValue}
									onChange={(e) => {
										setInputValue(e.target.value);
										handleTextareaResize();
									}}
									onKeyDown={handleKeyDown}
									onFocus={() => setPlaceholder(getPlaceholder(userMessageCount))}
									placeholder={inputPlaceholder}
									disabled={isLoading || isCompleted}
									rows={1}
									className="flex-1 px-4 py-2 bg-muted border border-border text-foreground rounded-lg placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed resize-none overflow-y-auto"
									style={{ maxHeight: "120px" }}
								/>
								<Button
									onClick={handleSendMessage}
									disabled={!inputValue.trim() || isLoading || isCompleted}
									size="sm"
									className="min-h-11 min-w-11"
								>
									{isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
								</Button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</>
	);
}
