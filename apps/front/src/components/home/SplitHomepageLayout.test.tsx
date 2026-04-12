import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SplitHomepageLayout } from "./SplitHomepageLayout";

describe("SplitHomepageLayout", () => {
	it("renders the split layout container with both panes", () => {
		render(
			<SplitHomepageLayout
				timeline={<div data-testid="test-timeline">Timeline</div>}
				authPanel={<div data-testid="test-auth-panel">Auth</div>}
			/>,
		);

		expect(screen.getByTestId("split-homepage-layout")).toBeInTheDocument();
		expect(screen.getByTestId("scrollable-timeline")).toBeInTheDocument();
		expect(screen.getByTestId("sticky-auth-panel-wrapper")).toBeInTheDocument();
	});

	it("renders timeline content in the left pane", () => {
		render(
			<SplitHomepageLayout
				timeline={<div data-testid="test-timeline">Timeline Content</div>}
				authPanel={<div>Auth</div>}
			/>,
		);

		const scrollableTimeline = screen.getByTestId("scrollable-timeline");
		expect(scrollableTimeline).toContainElement(screen.getByTestId("test-timeline"));
	});

	it("renders auth panel content in the right pane", () => {
		render(
			<SplitHomepageLayout
				timeline={<div>Timeline</div>}
				authPanel={<div data-testid="test-auth-panel">Auth Panel Content</div>}
			/>,
		);

		const authPanelWrapper = screen.getByTestId("sticky-auth-panel-wrapper");
		expect(authPanelWrapper).toContainElement(screen.getByTestId("test-auth-panel"));
	});

	it("renders optional bottom CTA when provided", () => {
		render(
			<SplitHomepageLayout
				timeline={<div>Timeline</div>}
				authPanel={<div>Auth</div>}
				bottomCta={<div data-testid="test-bottom-cta">Bottom CTA</div>}
			/>,
		);

		expect(screen.getByTestId("test-bottom-cta")).toBeInTheDocument();
	});

	it("does not render bottom CTA when not provided", () => {
		render(<SplitHomepageLayout timeline={<div>Timeline</div>} authPanel={<div>Auth</div>} />);

		expect(screen.queryByTestId("test-bottom-cta")).not.toBeInTheDocument();
	});

	it("applies responsive grid classes for 60/40 split", () => {
		render(<SplitHomepageLayout timeline={<div>Timeline</div>} authPanel={<div>Auth</div>} />);

		const layout = screen.getByTestId("split-homepage-layout");
		expect(layout.className).toMatch(/grid-cols-\[1fr\]/);
		expect(layout.className).toMatch(/lg:grid-cols-\[3fr_2fr\]/);
	});

	it("applies sticky positioning classes to auth panel wrapper", () => {
		render(<SplitHomepageLayout timeline={<div>Timeline</div>} authPanel={<div>Auth</div>} />);

		const wrapper = screen.getByTestId("sticky-auth-panel-wrapper");
		expect(wrapper.className).toMatch(/lg:sticky/);
		expect(wrapper.className).toMatch(/lg:top-\[3\.5rem\]/);
		expect(wrapper.className).toMatch(/lg:h-\[calc\(100vh-3\.5rem\)\]/);
	});

	it("hides auth panel wrapper on mobile via hidden class", () => {
		render(<SplitHomepageLayout timeline={<div>Timeline</div>} authPanel={<div>Auth</div>} />);

		const wrapper = screen.getByTestId("sticky-auth-panel-wrapper");
		expect(wrapper.className).toMatch(/hidden/);
		expect(wrapper.className).toMatch(/lg:block/);
	});

	it("has data-slot attributes on all structural elements", () => {
		render(<SplitHomepageLayout timeline={<div>Timeline</div>} authPanel={<div>Auth</div>} />);

		expect(screen.getByTestId("split-homepage-layout").getAttribute("data-slot")).toBe(
			"split-homepage-layout",
		);
		expect(screen.getByTestId("scrollable-timeline").getAttribute("data-slot")).toBe(
			"scrollable-timeline",
		);
		expect(screen.getByTestId("sticky-auth-panel-wrapper").getAttribute("data-slot")).toBe(
			"sticky-auth-panel-wrapper",
		);
	});
});
