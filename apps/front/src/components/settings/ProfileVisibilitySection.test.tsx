// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ProfileVisibilitySection } from "./ProfileVisibilitySection";

describe("ProfileVisibilitySection", () => {
	it("renders toggle with 'Private' when isPublic is false", () => {
		render(
			<ProfileVisibilitySection
				publicProfileId="profile-123"
				isPublic={false}
				isTogglePending={false}
				onToggleVisibility={() => {}}
			/>,
		);
		expect(screen.getByTestId("profile-visibility-status")).toHaveTextContent("Private");
	});

	it("renders toggle with 'Public' when isPublic is true", () => {
		render(
			<ProfileVisibilitySection
				publicProfileId="profile-123"
				isPublic={true}
				isTogglePending={false}
				onToggleVisibility={() => {}}
			/>,
		);
		expect(screen.getByTestId("profile-visibility-status")).toHaveTextContent("Public");
	});

	it("calls onToggleVisibility when toggled", () => {
		const onToggle = vi.fn();
		render(
			<ProfileVisibilitySection
				publicProfileId="profile-123"
				isPublic={false}
				isTogglePending={false}
				onToggleVisibility={onToggle}
			/>,
		);
		const toggle = screen.getByTestId("profile-visibility-toggle");
		fireEvent.click(toggle);
		expect(onToggle).toHaveBeenCalledOnce();
	});

	it("shows disabled state when publicProfileId is null", () => {
		render(
			<ProfileVisibilitySection
				publicProfileId={null}
				isPublic={false}
				isTogglePending={false}
				onToggleVisibility={() => {}}
			/>,
		);
		expect(screen.getByTestId("profile-visibility-toggle")).toBeDisabled();
		expect(screen.getByText(/complete.*assessment/i)).toBeInTheDocument();
	});

	it("has data-slot attribute", () => {
		const { container } = render(
			<ProfileVisibilitySection
				publicProfileId="profile-123"
				isPublic={false}
				isTogglePending={false}
				onToggleVisibility={() => {}}
			/>,
		);
		expect(container.querySelector("[data-slot='profile-visibility-section']")).toBeInTheDocument();
	});

	it("disables toggle when isTogglePending is true", () => {
		render(
			<ProfileVisibilitySection
				publicProfileId="profile-123"
				isPublic={false}
				isTogglePending={true}
				onToggleVisibility={() => {}}
			/>,
		);
		expect(screen.getByTestId("profile-visibility-toggle")).toBeDisabled();
	});
});
