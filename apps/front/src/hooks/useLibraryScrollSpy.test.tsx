import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useLibraryScrollSpy } from "./useLibraryScrollSpy";

describe("useLibraryScrollSpy", () => {
	afterEach(() => {
		vi.restoreAllMocks();
		document.body.innerHTML = "";
	});

	it("registers scroll and resize listeners and removes them on unmount", () => {
		const addSpy = vi.spyOn(window, "addEventListener");
		const removeSpy = vi.spyOn(window, "removeEventListener");

		const a = document.createElement("div");
		a.id = "a";
		document.body.append(a);

		const { unmount } = renderHook(() => useLibraryScrollSpy(["a"]));

		expect(addSpy).toHaveBeenCalledWith("scroll", expect.any(Function), { passive: true });
		expect(addSpy).toHaveBeenCalledWith("resize", expect.any(Function));

		act(() => {
			unmount();
		});

		expect(removeSpy).toHaveBeenCalledWith("scroll", expect.any(Function));
		expect(removeSpy).toHaveBeenCalledWith("resize", expect.any(Function));
	});

	it("clears active id when chapter ids no longer match any measured heading", async () => {
		const a = document.createElement("div");
		a.id = "a";
		a.getBoundingClientRect = () => ({ top: 200 }) as DOMRect;
		document.body.append(a);

		const { result, rerender } = renderHook(
			({ ids }: { ids: string[] }) => useLibraryScrollSpy(ids),
			{ initialProps: { ids: ["a"] } },
		);

		await waitFor(() => {
			expect(result.current).toBe("a");
		});

		rerender({ ids: ["missing"] });

		await waitFor(() => {
			expect(result.current).toBeNull();
		});
	});
});
