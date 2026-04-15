// @vitest-environment jsdom

import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CheckInForm } from "./CheckInForm";

function renderCheckInForm(options?: {
	draft?: {
		mood: "great" | "good" | "okay" | "uneasy" | "rough" | null;
		note: string;
	};
	onSubmit?: ReturnType<typeof vi.fn>;
}) {
	const onDraftChange = vi.fn();
	const onSubmit = options?.onSubmit ?? vi.fn().mockResolvedValue(undefined);

	render(
		<CheckInForm
			localDate="2026-04-14"
			draft={options?.draft ?? { mood: null, note: "" }}
			onDraftChange={onDraftChange}
			onSubmit={onSubmit}
		/>,
	);

	return { onDraftChange, onSubmit };
}

describe("CheckInForm", () => {
	it("keeps Save disabled until a mood is selected", () => {
		renderCheckInForm();

		expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
		expect(screen.getByText("How are you feeling this morning?")).toBeTruthy();
		expect(screen.getByPlaceholderText("One note, if you want")).toBeTruthy();
	});

	it("enables Save after mood selection", async () => {
		const user = userEvent.setup();

		renderCheckInForm();

		await act(async () => {
			await user.click(screen.getByRole("button", { name: "Feeling good" }));
		});

		expect(screen.getByRole("button", { name: "Save" })).toBeEnabled();
		expect(screen.getByRole("button", { name: "Feeling good" })).toHaveAttribute(
			"aria-pressed",
			"true",
		);
	});

	it("submits the Story 4.1 payload shape", async () => {
		const user = userEvent.setup();
		const { onSubmit } = renderCheckInForm();

		await act(async () => {
			await user.click(screen.getByRole("button", { name: "Feeling good" }));
			await user.type(screen.getByPlaceholderText("One note, if you want"), "steady start");
			await user.click(screen.getByRole("button", { name: "Save" }));
		});

		await waitFor(() => {
			expect(onSubmit).toHaveBeenCalledWith({
				localDate: "2026-04-14",
				mood: "good",
				note: "steady start",
				visibility: "private",
			});
		});
	});

	it("preserves the draft when submission fails", async () => {
		const user = userEvent.setup();
		const onSubmit = vi.fn().mockRejectedValue(new Error("network down"));

		renderCheckInForm({ onSubmit });

		await act(async () => {
			await user.click(screen.getByRole("button", { name: "Feeling rough" }));
			await user.type(screen.getByPlaceholderText("One note, if you want"), "Need a slower morning");
			await user.click(screen.getByRole("button", { name: "Save" }));
		});

		await waitFor(() => {
			expect(onSubmit).toHaveBeenCalledTimes(1);
		});

		expect(screen.getByPlaceholderText("One note, if you want")).toHaveValue("Need a slower morning");
		expect(screen.getByRole("button", { name: "Feeling rough" })).toHaveAttribute(
			"aria-pressed",
			"true",
		);
	});
});
