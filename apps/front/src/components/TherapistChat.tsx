import { useNavigate } from "@tanstack/react-router";
import { ASSESSMENT_MESSAGE_MAX_LENGTH } from "@workspace/domain";
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar";
import { Button } from "@workspace/ui/components/button";
import { NerinMessage } from "@workspace/ui/components/chat";
import { cn } from "@workspace/ui/lib/utils";
import { Loader2, Send } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Markdown from "react-markdown";
import { getPlaceholder } from "@/constants/chat-placeholders";
import { useTherapistChat } from "@/hooks/useTherapistChat";
import { ChatAuthGate } from "./ChatAuthGate";
import { ChatInputBarShell } from "./chat/ChatInputBarShell";
import { DepthMeter } from "./chat/DepthMeter";
import { ErrorBanner } from "./ErrorBanner";
import { GeometricOcean } from "./sea-life/GeometricOcean";

interface TherapistChatProps {
	sessionId: string;
	onSessionError?: (error: { type: "not-found" | "session"; isResumeError: boolean }) => void;
	userName?: string | null;
	userImage?: string | null;
	isAuthenticated?: boolean;
	onPortraitReveal?: () => void;
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

/** Character counter warning threshold (90% of max) */
const WARNING_THRESHOLD = 0.9;

/** Milestone thresholds and their app-voiced progress messages */
const MILESTONES = [
	{
		threshold: 50,
		message: "Halfway there — your personality portrait is taking shape.",
	},
	{
		threshold: 75,
		message: "Almost there — just a few more exchanges to complete your portrait.",
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
	onSessionError,
	userName,
	userImage,
	isAuthenticated = false,
	onPortraitReveal,
	highlightMessageId,
	highlightQuote: _highlightQuote,
	highlightStart,
	highlightEnd,
	highlightScore,
}: TherapistChatProps) {
	const messagesEndRef = useRef<HTMLDivElement>(null);
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
		freeTierMessageThreshold,
		// Story 7.18: Farewell transition state
		isFarewellReceived,
		portraitWaitMinMs,
	} = useTherapistChat(sessionId);

	// Notify parent (route) of session errors for auth-based redirect decisions
	useEffect(() => {
		if (!onSessionError) return;
		if (errorType === "session") {
			onSessionError({ type: "session", isResumeError: false });
		}
	}, [errorType, onSessionError]);

	useEffect(() => {
		if (!onSessionError) return;
		if (!isResuming && isResumeSessionNotFound) {
			onSessionError({ type: "not-found", isResumeError: true });
		}
	}, [isResuming, isResumeSessionNotFound, onSessionError]);

	// Milestone tracking — threshold → message index where it should render
	const [shownMilestones, setShownMilestones] = useState<Map<number, number>>(new Map());
	// Tracks the message count at which milestones were last computed (for resume)
	const milestonesComputedForRef = useRef(0);

	// Timestamp re-render ticker (updates every 60s)
	const [, setTimeTick] = useState(0);
	useEffect(() => {
		const interval = setInterval(() => setTimeTick((t) => t + 1), 60_000);
		return () => clearInterval(interval);
	}, []);

	// Unified milestone tracking — handles both resume (historical) and live messages
	// Uses a single effect to avoid race conditions between init and live tracking.
	useEffect(() => {
		if (messages.length === 0 || !freeTierMessageThreshold) return;

		const threshold = freeTierMessageThreshold;
		const isFirstComputation = milestonesComputedForRef.current === 0;
		const scanFrom = isFirstComputation ? 0 : milestonesComputedForRef.current;

		setShownMilestones((prev) => {
			const next = new Map(prev);
			let userCount = 0;

			// Count user messages up to our scan start point
			for (let i = 0; i < scanFrom && i < messages.length; i++) {
				if (messages[i].role === "user") userCount++;
			}

			// Scan new messages for milestone crossings
			for (let i = scanFrom; i < messages.length; i++) {
				if (messages[i].role === "user") userCount++;
				const pct = Math.min(Math.round((userCount / threshold) * 100), 100);
				for (const m of MILESTONES) {
					if (pct >= m.threshold && !next.has(m.threshold)) {
						next.set(m.threshold, i + 1);
					}
				}
			}

			milestonesComputedForRef.current = messages.length;

			// Only update state if something changed
			if (next.size === prev.size) return prev;
			return next;
		});
	}, [messages, freeTierMessageThreshold]);

	// Ocean pulse — fires when a new assistant message arrives
	const [oceanPulse, setOceanPulse] = useState(false);
	const prevAssistantCountRef = useRef(0);
	useEffect(() => {
		const assistantCount = messages.filter((m) => m.role === "assistant").length;
		if (assistantCount > prevAssistantCountRef.current && prevAssistantCountRef.current > 0) {
			setOceanPulse(true);
		}
		prevAssistantCountRef.current = assistantCount;
	}, [messages]);

	// Placeholder rotation based on user message count
	const userMessageCount = useMemo(
		() => messages.filter((m) => m.role === "user").length,
		[messages],
	);
	const [placeholder, setPlaceholder] = useState(() => getPlaceholder(0));
	useEffect(() => {
		setPlaceholder(getPlaceholder(userMessageCount, freeTierMessageThreshold));
	}, [userMessageCount, freeTierMessageThreshold]);

	// Auto-scroll to the latest message when message count changes
	const messageCount = messages.length;
	// biome-ignore lint/correctness/useExhaustiveDependencies: messageCount triggers scroll on new messages
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messageCount]);

	// Scroll to highlighted message
	useEffect(() => {
		if (highlightMessageId && messages.length > 0) {
			setTimeout(() => {
				const element = document.querySelector(`[data-message-id="${highlightMessageId}"]`);
				element?.scrollIntoView({ behavior: "smooth", block: "center" });
			}, 300); // Delay to ensure DOM is ready
		}
	}, [highlightMessageId, messages.length]);

	// Input placeholder — fades away on farewell/completion, so this is mostly cosmetic
	const inputPlaceholder = useMemo(() => {
		if (isCompleted || isFarewellReceived) return "";
		return placeholder;
	}, [isCompleted, isFarewellReceived, placeholder]);

	// Story 11.1: Navigate to finalize route when farewell received and authenticated.
	// Delay navigation so the farewell message from Nerin renders and can be read (Story 7.18 UX).
	const navigateToFinalize = useNavigate();
	useEffect(() => {
		if (!isFarewellReceived || !isAuthenticated) return;
		const timer = setTimeout(() => {
			navigateToFinalize({
				to: "/finalize/$assessmentSessionId",
				params: { assessmentSessionId: sessionId },
			});
		}, 2000);
		return () => clearTimeout(timer);
	}, [isFarewellReceived, isAuthenticated, sessionId, navigateToFinalize]);

	return (
		<ChatContent
			sessionId={sessionId}
			messages={messages}
			isLoading={isLoading}
			isCompleted={isCompleted}
			isFarewellReceived={isFarewellReceived}
			isAuthenticated={isAuthenticated}
			isResuming={isResuming}
			resumeError={resumeError}
			userName={userName}
			userImage={userImage}
			depthProgress={Math.min(userMessageCount / (freeTierMessageThreshold || 27), 1)}
			errorMessage={errorMessage}
			errorType={errorType}
			clearError={clearError}
			retryLastMessage={retryLastMessage}
			shownMilestones={shownMilestones}
			highlightMessageId={highlightMessageId}
			highlightStart={highlightStart}
			highlightEnd={highlightEnd}
			highlightScore={highlightScore}
			inputPlaceholder={inputPlaceholder}
			messagesEndRef={messagesEndRef}
			onSend={sendMessage}
			oceanPulse={oceanPulse}
			onInputFocus={() => setPlaceholder(getPlaceholder(userMessageCount, freeTierMessageThreshold))}
		/>
	);
}

/** Input bar with character counter — owns input state to isolate re-renders from message list */
function ChatInputBar({
	onSend,
	isLoading,
	isCompleted,
	isFarewellReceived,
	isResuming,
	placeholder,
	onFocus,
}: {
	onSend: (message: string) => Promise<void>;
	isLoading: boolean;
	isCompleted: boolean;
	isFarewellReceived: boolean;
	isResuming: boolean;
	placeholder: string;
	onFocus: () => void;
}) {
	const [inputValue, setInputValue] = useState("");
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	// Auto-focus textarea on mount and after resume completes (Task 1.1, 1.2, 1.3)
	// Uses autoFocus for initial load; programmatic .focus() for post-resume.
	// Skips focus when farewell/completed (input is faded/disabled).
	const hasAutoFocusedRef = useRef(false);
	useEffect(() => {
		if (isFarewellReceived || isCompleted || isResuming) return;
		if (hasAutoFocusedRef.current) return;
		hasAutoFocusedRef.current = true;
		textareaRef.current?.focus();
	}, [isFarewellReceived, isCompleted, isResuming]);

	const handleTextareaResize = useCallback(() => {
		const textarea = textareaRef.current;
		if (!textarea) return;
		textarea.style.height = "auto";
		textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
	}, []);

	const handleSendMessage = async () => {
		if (!inputValue.trim() || isLoading) return;
		const message = inputValue;
		setInputValue("");
		if (textareaRef.current) {
			textareaRef.current.style.height = "auto";
		}
		try {
			await onSend(message);
		} catch {
			// Error handling lives in useTherapistChat; input is already cleared
			// (optimistic UX — message appears immediately in the chat)
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSendMessage();
		}
	};

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

	return (
		<ChatInputBarShell className="relative z-10 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
			<div className="flex gap-2 items-end">
				<textarea
					ref={textareaRef}
					data-slot="chat-input"
					data-testid="chat-input"
					value={inputValue}
					onChange={(e) => {
						setInputValue(e.target.value);
						handleTextareaResize();
					}}
					onKeyDown={handleKeyDown}
					onFocus={onFocus}
					placeholder={placeholder}
					disabled={isLoading || isCompleted}
					maxLength={ASSESSMENT_MESSAGE_MAX_LENGTH}
					rows={1}
					className="flex-1 px-4 py-2 rounded-lg border border-[var(--input-field-border)] bg-[var(--input-field-bg)] text-foreground placeholder-[var(--input-field-color)] focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed resize-none overflow-y-auto"
					style={{ maxHeight: "120px" }}
				/>
				<Button
					data-testid="chat-send-btn"
					onClick={handleSendMessage}
					disabled={!inputValue.trim() || isLoading || isCompleted}
					size="sm"
					className="min-h-11 min-w-11 dark:shadow-[0_0_8px_rgba(0,212,200,0.3)] dark:disabled:opacity-65"
				>
					{isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
				</Button>
			</div>
			{!isCompleted && (
				<span
					data-slot="char-counter"
					data-state={
						inputValue.length >= ASSESSMENT_MESSAGE_MAX_LENGTH
							? "error"
							: inputValue.length >= ASSESSMENT_MESSAGE_MAX_LENGTH * WARNING_THRESHOLD
								? "warning"
								: "normal"
					}
					className="text-sm text-right block mt-1 text-muted-foreground data-[state=warning]:text-[var(--warning)] data-[state=error]:text-destructive"
				>
					{inputValue.length.toLocaleString("en-US")} /{" "}
					{ASSESSMENT_MESSAGE_MAX_LENGTH.toLocaleString("en-US")}
				</span>
			)}
		</ChatInputBarShell>
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
	isFarewellReceived,
	isAuthenticated,
	isResuming,
	resumeError,
	userName,
	userImage,
	depthProgress,
	errorMessage,
	errorType,
	clearError,
	retryLastMessage,
	shownMilestones,
	highlightMessageId,
	highlightStart,
	highlightEnd,
	highlightScore,
	inputPlaceholder,
	messagesEndRef,
	onSend,
	oceanPulse,
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
	isFarewellReceived: boolean;
	isAuthenticated: boolean;
	isResuming: boolean;
	resumeError: Error | null;
	userName?: string | null;
	userImage?: string | null;
	depthProgress: number;
	errorMessage: string | null;
	errorType: string | null;
	clearError: () => void;
	retryLastMessage: () => void;
	shownMilestones: Map<number, number>;
	highlightMessageId?: string;
	highlightStart?: number;
	highlightEnd?: number;
	highlightScore?: number;
	inputPlaceholder: string;
	messagesEndRef: React.RefObject<HTMLDivElement | null>;
	onSend: (message: string) => Promise<void>;
	oceanPulse: boolean;
	onInputFocus: () => void;
}) {
	return (
		<>
			{/* Depth Meter — fixed sidebar, desktop only */}
			<DepthMeter progress={depthProgress} />

			<div className="h-[calc(100dvh-3.5rem)] flex flex-col overflow-hidden overscroll-none bg-background text-foreground relative">
				{/* Geometric Ocean — ambient sea life layer behind chat */}
				<GeometricOcean depthProgress={depthProgress} pulse={oceanPulse} />

				{/* Header — matches homepage style */}
				<div
					data-slot="chat-header"
					className="relative z-10 border-b border-border bg-card/80 px-4 md:px-6 py-3 md:py-4 shadow-sm backdrop-blur-sm flex items-center justify-between"
				>
					<div className="flex items-center gap-2">
						<Avatar className="bg-gradient-to-br from-tertiary to-primary" aria-hidden="true">
							<AvatarFallback className="bg-gradient-to-br from-tertiary to-primary font-heading text-[.75rem] font-bold text-white">
								N
							</AvatarFallback>
						</Avatar>
						<span className="text-lg font-heading font-semibold text-foreground">Nerin</span>
					</div>
				</div>

				{/* Main Content — scrollable area, input bar is outside this container */}
				<div className="flex-1 overflow-y-auto relative z-10">
					{/* Loading State */}
					{isResuming && (
						<div className="h-full flex items-center justify-center">
							<div className="text-center">
								<Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
								<p className="mt-4 text-muted-foreground">Loading your assessment...</p>
							</div>
						</div>
					)}

					{/* Resume Error — session-not-found redirects are handled at the route level */}
					{!isResuming && resumeError && (
						<div className="h-full flex items-center justify-center">
							<div className="text-center max-w-md">
								<p className="text-destructive-foreground text-lg">Something went wrong</p>
								<p className="mt-2 text-muted-foreground">Unable to load your assessment.</p>
								<Button className="mt-4" onClick={() => window.location.reload()}>
									Retry
								</Button>
							</div>
						</div>
					)}

					{/* Messages Area — centered, matching homepage ConversationFlow spacing */}
					{!isResuming && !resumeError && (
						<div className="relative mx-auto max-w-[900px] min-[1200px]:max-w-[1000px] min-[1440px]:max-w-[1100px] px-6 pt-10 pb-6">
							{/* Vertical thread line — aligns with Nerin avatar center */}
							<div
								className="absolute top-0 bottom-0 left-[29px] z-0 w-[1.5px]"
								style={{ background: "var(--thread-line)" }}
								aria-hidden="true"
							/>
							{/* Story 9.5: Flat render verified acceptable for MESSAGE_THRESHOLD=25 (~50 messages).
							    Reconsider @tanstack/react-virtual if threshold increases above 30 (60+ DOM nodes). */}
							{messages.length > 0 &&
								messages.map((msg, index) => (
									<div key={msg.id} className="relative z-[1] mb-9 motion-safe:animate-fade-in-up">
										{msg.role === "user" ? (
											<div className="flex flex-row-reverse gap-[11px]">
												{/* User avatar */}
												<Avatar
													className="bg-gradient-to-br from-[var(--user-avatar-from)] to-[var(--user-avatar-to)] transition-[background,color] duration-[350ms]"
													aria-hidden="true"
												>
													{userImage && <AvatarImage src={userImage} alt={userName || "User"} />}
													<AvatarFallback className="bg-gradient-to-br from-[var(--user-avatar-from)] to-[var(--user-avatar-to)] font-heading text-[.75rem] font-bold text-[var(--user-avatar-fg)]">
														{userName ? userName.charAt(0).toUpperCase() : "A"}
													</AvatarFallback>
												</Avatar>
												<div
													data-slot="chat-bubble"
													data-testid="chat-bubble"
													data-message-id={msg.id}
													className="max-w-[88%] rounded-[18px] rounded-br-[5px] bg-gradient-to-br from-primary to-secondary px-[22px] py-4 text-left text-white min-[1200px]:max-w-[92%]"
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
												</div>
											</div>
										) : (
											<NerinMessage messageId={msg.id}>
												{msg.id === highlightMessageId ? (
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
												) : (
													<Markdown>{msg.content}</Markdown>
												)}
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

							{/* Typing indicator while loading */}
							{isLoading && <TypingIndicator />}

							{/* Story 7.18: Auth gate for anonymous users after farewell */}
							{isFarewellReceived && !isAuthenticated && <ChatAuthGate sessionId={sessionId} />}

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
				</div>

				{/* Input Area — fades on farewell / completion (Story 7.18) */}
				<div
					className={cn(
						(isFarewellReceived || isCompleted) && "opacity-0 pointer-events-none",
						isFarewellReceived && "motion-safe:transition-opacity motion-safe:duration-300",
					)}
				>
					<ChatInputBar
						onSend={onSend}
						isLoading={isLoading}
						isCompleted={isCompleted}
						isFarewellReceived={isFarewellReceived}
						isResuming={isResuming}
						placeholder={inputPlaceholder}
						onFocus={onInputFocus}
					/>
				</div>
			</div>
		</>
	);
}
