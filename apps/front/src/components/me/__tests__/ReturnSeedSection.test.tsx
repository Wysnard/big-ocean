// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FIRST_DAILY_PROMPT_HOUR, ReturnSeedSection } from "../ReturnSeedSection";

describe("ReturnSeedSection", () => {
	beforeEach(() => {
		vi.useRealTimers();
		vi.restoreAllMocks();
	});

	it("renders the Nerin copy and stable selectors", () => {
		render(<ReturnSeedSection onPermissionGranted={vi.fn()} />);

		expect(
			screen.getByText("Tomorrow, I'll ask how you're doing. Come check in with me."),
		).toBeInTheDocument();
		expect(
			screen.getByText("I'd like to check in with you tomorrow. Mind if I send a quiet note?"),
		).toBeInTheDocument();
		expect(screen.getByTestId("return-seed-card")).toHaveAttribute(
			"data-slot",
			"return-seed-section",
		);
		expect(screen.getByTestId("return-seed-accept")).toBeInTheDocument();
		expect(screen.getByTestId("return-seed-decline")).toBeInTheDocument();
	});

	it("requests permission only after the explicit accept click and forwards the next-day schedule", async () => {
		const requestPermission = vi.fn().mockResolvedValue("granted");
		Object.defineProperty(window, "Notification", {
			configurable: true,
			value: {
				permission: "default",
				requestPermission,
			},
		});

		const onPermissionGranted = vi.fn().mockResolvedValue(undefined);

		render(<ReturnSeedSection onPermissionGranted={onPermissionGranted} />);

		expect(requestPermission).not.toHaveBeenCalled();
		const expectedSchedule = new Date();
		expectedSchedule.setDate(expectedSchedule.getDate() + 1);
		expectedSchedule.setHours(FIRST_DAILY_PROMPT_HOUR, 0, 0, 0);

		fireEvent.click(screen.getByTestId("return-seed-accept"));

		await waitFor(() => {
			expect(requestPermission).toHaveBeenCalledTimes(1);
		});
		await waitFor(() => {
			expect(onPermissionGranted).toHaveBeenCalledTimes(1);
		});

		const scheduledFor = onPermissionGranted.mock.calls[0][0] as Date;
		expect(scheduledFor.getTime()).toBe(expectedSchedule.getTime());
		expect(screen.getByTestId("return-seed-feedback")).toHaveTextContent(
			"I'll send a quiet note tomorrow evening.",
		);
	});

	it("shows a calm fallback when the user declines or the browser blocks permission", async () => {
		const requestPermission = vi.fn().mockResolvedValue("denied");
		Object.defineProperty(window, "Notification", {
			configurable: true,
			value: {
				permission: "default",
				requestPermission,
			},
		});

		const onPermissionGranted = vi.fn().mockResolvedValue(undefined);
		const onDecline = vi.fn();

		render(<ReturnSeedSection onPermissionGranted={onPermissionGranted} onDecline={onDecline} />);

		fireEvent.click(screen.getByTestId("return-seed-accept"));

		await waitFor(() => {
			expect(requestPermission).toHaveBeenCalledTimes(1);
		});
		expect(onPermissionGranted).not.toHaveBeenCalled();
		expect(onDecline).toHaveBeenCalledTimes(1);
		expect(screen.getByTestId("return-seed-feedback")).toHaveTextContent(
			"That's alright. Come back tomorrow when it feels right.",
		);
	});

	it("handles unsupported browsers without breaking the page", async () => {
		Object.defineProperty(window, "Notification", {
			configurable: true,
			value: undefined,
		});

		const onDecline = vi.fn();

		render(<ReturnSeedSection onPermissionGranted={vi.fn()} onDecline={onDecline} />);

		fireEvent.click(screen.getByTestId("return-seed-accept"));

		await waitFor(() => {
			expect(onDecline).toHaveBeenCalledTimes(1);
		});
		expect(screen.getByTestId("return-seed-feedback")).toHaveTextContent(
			"Quiet notes aren't available in this browser yet, but I'll still be here tomorrow.",
		);
	});

	it("shows a retryable error message when the granted path cannot be saved", async () => {
		const requestPermission = vi.fn().mockResolvedValue("granted");
		Object.defineProperty(window, "Notification", {
			configurable: true,
			value: {
				permission: "default",
				requestPermission,
			},
		});

		render(
			<ReturnSeedSection
				onPermissionGranted={vi.fn().mockRejectedValue(new Error("network failed"))}
			/>,
		);

		fireEvent.click(screen.getByTestId("return-seed-accept"));

		await waitFor(() => {
			expect(requestPermission).toHaveBeenCalledTimes(1);
		});
		expect(screen.getByTestId("return-seed-feedback")).toHaveTextContent(
			"I couldn't save that quiet note just now.",
		);
		expect(screen.getByTestId("return-seed-accept")).toBeInTheDocument();
	});
});
