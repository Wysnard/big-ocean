/**
 * Domain message type for conversation history.
 *
 * Plain data type that carries message identity (id), role, and content
 * without coupling to any LLM framework (LangChain, etc.).
 *
 * LangChain conversion happens at the infrastructure boundary.
 */
export type DomainMessage = {
	readonly id: string;
	readonly role: "user" | "assistant";
	readonly content: string;
};

/** Alias for DomainMessage — used in the analyzer pipeline */
export type ConversationMessage = DomainMessage;

/** Narrowed message types for role-specific contexts */
export type UserMessage = DomainMessage & { role: "user" };
export type AssistantMessage = DomainMessage & { role: "assistant" };
