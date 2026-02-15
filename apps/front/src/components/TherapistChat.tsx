import { Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@workspace/ui/components/button";
import { NerinMessage } from "@workspace/ui/components/chat";
import { Loader2, Send } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getPlaceholder } from "@/constants/chat-placeholders";
import { useAuth } from "@/hooks/use-auth";
import { useTherapistChat } from "@/hooks/useTherapistChat";
import { DepthMeter } from "./chat/DepthMeter";
import { ErrorBanner } from "./ErrorBanner";

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

/** Typing indicator bubble shown while waiting for Nerin's response. */
function TypingIndicator() {
	return (
		<NerinMessage className="relative z-[1] mb-9">
			<div className="flex gap-1.5 items-center">
				<span
					className="w-2 h-2 rounded-full bg-muted-foreground/50 motion-safe:animate-bounce"
					style={{ animationDelay: "0ms" }}
				/>
				<span
					className="w-2 h-2 rounded-full bg-muted-foreground/50 motion-safe:animate-bounce"
					style={{ animationDelay: "150ms" }}
				/>
				<span
					className="w-2 h-2 rounded-full bg-muted-foreground/50 motion-safe:animate-bounce"
					style={{ animationDelay: "300ms" }}
				/>
			</div>
		</NerinMessage>
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
	highlightQuote: _highlightQuote,
	highlightStart,
	highlightEnd,
	highlightScore,
}: TherapistChatProps) {
	const [inputValue, setInputValue] = useState("");
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const {
		messages,
		isLoading,
		isCompleted,
		errorMessage,
		errorType,
		clearError,
		retryLastMessage,
		sendMessage,
		isResuming,
		resumeError,
		isResumeSessionNotFound,
		isConfidenceReady,
		progressPercent,
		freeTierMessageThreshold,
		hasShownCelebration,
		setHasShownCelebration,
	} = useTherapistChat(sessionId);
	const { isAuthenticated } = useAuth();
	const navigate = useNavigate();

	// Milestone tracking — threshold → message index where it triggered
	const [shownMilestones, setShownMilestones] = useState<Map<number, number>>(new Map());

	// Timestamp re-render ticker (updates every 60s)
	const [, setTimeTick] = useState(0);
	useEffect(() => {
		const interval = setInterval(() => setTimeTick((t) => t + 1), 60_000);
		return () => clearInterval(interval);
	}, []);

	// Story 2.11: Progress from message count (replaces confidence-based avgConfidence)
	const avgConfidence = progressPercent;

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
		setPlaceholder(getPlaceholder(userMessageCount, freeTierMessageThreshold));
	}, [userMessageCount, freeTierMessageThreshold]);

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

	// Session-not-found handling:
	// - Authenticated users are redirected to 404 (private linked session denied)
	// - Unauthenticated users are redirected to /chat for recovery
	useEffect(() => {
		if (errorType === "session") {
			navigate({ to: isAuthenticated ? "/404" : "/chat" });
		}
	}, [errorType, isAuthenticated, navigate]);

	useEffect(() => {
		if (isAuthenticated && !isResuming && isResumeSessionNotFound) {
			navigate({ to: "/404" });
		}
	}, [isAuthenticated, isResuming, isResumeSessionNotFound, navigate]);

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
		if (isCompleted) return "Keep exploring with Premium — unlock deeper conversations";
		if (isConfidenceReady && !hasShownCelebration) return "Keep chatting to add more depth...";
		return placeholder;
	}, [isCompleted, isConfidenceReady, hasShownCelebration, placeholder]);

	return (
		<ChatContent
			sessionId={sessionId}
			messages={messages}
			isLoading={isLoading}
			isCompleted={isCompleted}
			isResuming={isResuming}
			resumeError={resumeError}
			isResumeSessionNotFound={isResumeSessionNotFound}
			isAuthenticated={isAuthenticated}
			isConfidenceReady={isConfidenceReady}
			depthProgress={Math.min(userMessageCount / (freeTierMessageThreshold || 27), 1)}
			errorMessage={errorMessage}
			errorType={errorType}
			clearError={clearError}
			retryLastMessage={retryLastMessage}
			hasShownCelebration={hasShownCelebration}
			setHasShownCelebration={setHasShownCelebration}
			shownMilestones={shownMilestones}
			highlightMessageId={highlightMessageId}
			highlightStart={highlightStart}
			highlightEnd={highlightEnd}
			highlightScore={highlightScore}
			inputValue={inputValue}
			setInputValue={setInputValue}
			inputPlaceholder={inputPlaceholder}
			textareaRef={textareaRef}
			messagesEndRef={messagesEndRef}
			handleTextareaResize={handleTextareaResize}
			handleKeyDown={handleKeyDown}
			handleSendMessage={handleSendMessage}
			handleMessageClick={handleMessageClick}
			navigate={navigate}
			onInputFocus={() => setPlaceholder(getPlaceholder(userMessageCount, freeTierMessageThreshold))}
		/>
	);
}

/**
 * Inner chat component that uses standard theme styling matching the homepage conversation design.
 */
function ChatContent({
	sessionId,
	messages,
	isLoading,
	isCompleted,
	isResuming,
	resumeError,
	isResumeSessionNotFound,
	isAuthenticated,
	isConfidenceReady,
	depthProgress,
	errorMessage,
	errorType,
	clearError,
	retryLastMessage,
	hasShownCelebration,
	setHasShownCelebration,
	shownMilestones,
	highlightMessageId,
	highlightStart,
	highlightEnd,
	highlightScore,
	inputValue,
	setInputValue,
	inputPlaceholder,
	textareaRef,
	messagesEndRef,
	handleTextareaResize,
	handleKeyDown,
	handleSendMessage,
	handleMessageClick,
	navigate,
	onInputFocus,
}: {
	sessionId: string;
	messages: Array<{
		id: string;
		role: string;
		content: string;
		timestamp: Date;
	}>;
	isLoading: boolean;
	isCompleted: boolean;
	isResuming: boolean;
	resumeError: string | null;
	isResumeSessionNotFound: boolean;
	isAuthenticated: boolean;
	isConfidenceReady: boolean;
	depthProgress: number;
	errorMessage: string | null;
	errorType: string | null;
	clearError: () => void;
	retryLastMessage: () => void;
	hasShownCelebration: boolean;
	setHasShownCelebration: (v: boolean) => void;
	shownMilestones: Map<number, number>;
	highlightMessageId?: string;
	highlightStart?: number;
	highlightEnd?: number;
	highlightScore?: number;
	inputValue: string;
	setInputValue: (v: string) => void;
	inputPlaceholder: string;
	textareaRef: React.RefObject<HTMLTextAreaElement | null>;
	messagesEndRef: React.RefObject<HTMLDivElement | null>;
	handleTextareaResize: () => void;
	handleKeyDown: (e: React.KeyboardEvent) => void;
	handleSendMessage: () => void;
	handleMessageClick: (messageId: string, role: string) => void;
	navigate: ReturnType<typeof useNavigate>;
	onInputFocus: () => void;
}) {
	return (
		<>
			{/* Depth Meter — fixed sidebar, desktop only */}
			<DepthMeter progress={depthProgress} />

			<div className="h-[calc(100dvh-3.5rem)] flex flex-col overflow-hidden overscroll-none bg-background text-foreground">
				{/* Header — matches homepage style */}
				<div
					data-slot="chat-header"
					className="border-b border-border bg-card/80 px-4 md:px-6 py-3 md:py-4 shadow-sm backdrop-blur-sm flex items-center justify-between"
				>
					<div className="flex items-center gap-2">
						<div
							className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-tertiary to-primary font-heading text-[.75rem] font-bold text-white"
							aria-hidden="true"
						>
							N
						</div>
						<span className="text-lg font-heading font-semibold text-foreground">Nerin</span>
					</div>
					{isConfidenceReady && (
						<Link
							to="/results/$assessmentSessionId"
							params={{ assessmentSessionId: sessionId }}
							className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
							data-testid="view-results-header-link"
						>
							View Your Results
						</Link>
					)}
				</div>

				{/* Main Content */}
				<div className="flex-1 overflow-hidden">
					{/* Messages Area — centered, matching homepage ConversationFlow spacing */}
					<div className="h-full flex flex-col mx-auto max-w-[900px] min-[1200px]:max-w-[1000px] min-[1440px]:max-w-[1100px] px-6">
						{/* Loading State */}
						{isResuming && (
							<div className="flex-1 flex items-center justify-center">
								<div className="text-center">
									<Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
									<p className="mt-4 text-muted-foreground">Loading your assessment...</p>
								</div>
							</div>
						)}

						{/* SessionNotFound Error */}
						{!isResuming && !isAuthenticated && resumeError && isResumeSessionNotFound && (
							<div className="flex-1 flex items-center justify-center">
								<div className="text-center max-w-md">
									<p className="text-destructive-foreground text-lg">Session not found</p>
									<p className="mt-2 text-muted-foreground">
										This session may have expired or doesn't exist.
									</p>
									<Button className="mt-4" onClick={() => navigate({ to: "/chat" })}>
										Start New Assessment
									</Button>
								</div>
							</div>
						)}

						{/* Generic Resume Error */}
						{!isResuming && resumeError && !isResumeSessionNotFound && (
							<div className="flex-1 flex items-center justify-center">
								<div className="text-center max-w-md">
									<p className="text-destructive-foreground text-lg">Something went wrong</p>
									<p className="mt-2 text-muted-foreground">Unable to load your assessment.</p>
									<Button className="mt-4" onClick={() => window.location.reload()}>
										Retry
									</Button>
								</div>
							</div>
						)}

						{/* Messages (only show if not loading and no resume error) */}
						{!isResuming && !resumeError && (
							<div className="flex-1 overflow-y-auto relative pt-10">
								{/* Vertical thread line — aligns with Nerin avatar center */}
								<div
									className="absolute top-0 bottom-0 left-[29px] z-0 w-[1.5px]"
									style={{ background: "var(--thread-line)" }}
									aria-hidden="true"
								/>
								{messages.length > 0 &&
									messages.map((msg, index) => (
										<div key={msg.id} className="relative z-[1] mb-9 motion-safe:animate-fade-in-up">
											{msg.role === "user" ? (
												<div className="flex flex-row-reverse gap-[11px]">
													{/* User avatar */}
													<div
														className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--user-avatar-bg)] font-heading text-[.75rem] font-bold text-[var(--user-avatar-fg)] transition-[background,color] duration-[350ms]"
														aria-hidden="true"
													>
														Y
													</div>
													<button
														type="button"
														data-slot="chat-bubble"
														data-message-id={msg.id}
														onClick={() => handleMessageClick(msg.id, msg.role)}
														className="max-w-[88%] rounded-[18px] rounded-br-[5px] bg-gradient-to-br from-primary to-secondary px-[22px] py-4 text-left text-white cursor-pointer hover:ring-2 hover:ring-ring/40 transition-shadow min-[1200px]:max-w-[92%]"
													>
														<p className="text-[.92rem] leading-[1.65] whitespace-pre-line">
															{renderMessageContent(
																msg.content,
																msg.id,
																highlightMessageId,
																highlightStart,
																highlightEnd,
																highlightScore,
															)}
														</p>
														<p className="text-xs mt-1 text-white/70">{getRelativeTime(msg.timestamp)}</p>
													</button>
												</div>
											) : (
												<NerinMessage messageId={msg.id}>
													<p className="whitespace-pre-line">
														{renderMessageContent(
															msg.content,
															msg.id,
															highlightMessageId,
															highlightStart,
															highlightEnd,
															highlightScore,
														)}
													</p>
													<p className="text-xs mt-1 text-[var(--muted-dynamic)]">
														{getRelativeTime(msg.timestamp)}
													</p>
												</NerinMessage>
											)}
											{/* Milestone badges triggered at this message position */}
											{MILESTONES.map((milestone) =>
												shownMilestones.get(milestone.threshold) === index + 1 ? (
													<div
														key={`milestone-${milestone.threshold}`}
														data-slot="milestone-badge"
														className="w-full flex justify-center py-2 mt-2"
													>
														<div className="border border-accent rounded-full px-4 py-2 text-center max-w-sm bg-accent/50">
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
										className="relative z-[1] w-full py-2 mb-9 motion-safe:animate-fade-in-up"
									>
										<div className="bg-card border-2 border-primary rounded-2xl p-6 text-center shadow-lg">
											<h2 className="text-xl font-heading font-bold text-foreground">
												Your Personality Profile is Ready!
											</h2>
											<p className="text-muted-foreground mt-2">Your assessment is complete</p>
											<div className="mt-4 flex gap-3 justify-center">
												<Button
													onClick={() =>
														navigate({
															to: "/results/$assessmentSessionId",
															params: { assessmentSessionId: sessionId },
														})
													}
													data-testid="view-results-btn"
												>
													View Results
												</Button>
												<Button
													variant="outline"
													disabled
													className="opacity-50 cursor-not-allowed"
													title="Available in Premium tier"
												>
													Keep Exploring
												</Button>
											</div>
										</div>
									</div>
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

						{/* Input Area — matches homepage input bar style */}
						<div className="border-t border-[var(--input-bar-border)] bg-[var(--input-bar-bg)] backdrop-blur-[14px] px-6 py-4 sticky bottom-0 pb-[env(safe-area-inset-bottom)]">
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
									onFocus={onInputFocus}
									placeholder={inputPlaceholder}
									disabled={isLoading || isCompleted}
									rows={1}
									className="flex-1 px-4 py-2 rounded-lg border border-[var(--input-field-border)] bg-[var(--input-field-bg)] text-foreground placeholder-[var(--input-field-color)] focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed resize-none overflow-y-auto"
									style={{ maxHeight: "120px" }}
								/>
								<Button
									data-testid="chat-send-btn"
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
