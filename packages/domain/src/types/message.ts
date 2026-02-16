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
