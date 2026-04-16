// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { Effect } from "effect";
import { createElement, type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { listRelationshipSharedNotesMock } = vi.hoisted(() => ({
	listRelationshipSharedNotesMock: vi.fn(),
}));

vi.mock("@/lib/api-client", () => ({
	makeApiClient: Effect.succeed({
		relationship: {
			listRelationshipSharedNotes: (args: { path: { analysisId: string } }) =>
				Effect.tryPromise({
					try: () => listRelationshipSharedNotesMock(args.path.analysisId),
					catch: (e) => e,
				}),
		},
	}),
}));

import { useRelationshipSharedNotes } from "./useRelationshipSharedNotes";

let queryClient: QueryClient;
let wrapper: ({ children }: { children: ReactNode }) => ReactNode;

beforeEach(() => {
	queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false } },
	});
	wrapper = ({ children }: { children: ReactNode }) =>
		createElement(QueryClientProvider, { client: queryClient }, children);
	listRelationshipSharedNotesMock.mockReset();
});

afterEach(() => {
	queryClient.clear();
});

describe("useRelationshipSharedNotes", () => {
	it("does not fetch when disabled", async () => {
		listRelationshipSharedNotesMock.mockResolvedValue([]);

		const { result } = renderHook(() => useRelationshipSharedNotes("analysis-1", false), {
			wrapper,
		});

		await waitFor(() => {
			expect(result.current.fetchStatus).toBe("idle");
		});
		expect(listRelationshipSharedNotesMock).not.toHaveBeenCalled();
	});

	it("fetches notes when enabled", async () => {
		listRelationshipSharedNotesMock.mockResolvedValue([
			{
				id: "n1",
				authorDisplayName: "Alex",
				body: "Hello",
				createdAt: "2026-04-16T12:00:00.000Z",
			},
		]);

		const { result } = renderHook(() => useRelationshipSharedNotes("analysis-1", true), {
			wrapper,
		});

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});
		expect(listRelationshipSharedNotesMock).toHaveBeenCalledWith("analysis-1");
		expect(result.current.data).toHaveLength(1);
		expect(result.current.data?.[0]?.body).toBe("Hello");
	});
});
