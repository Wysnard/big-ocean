// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MAIN_CONTENT_ID, PageMain, SkipToContentLink } from "./PageMain";

describe("PageMain", () => {
	it("renders the shared main landmark target", () => {
		render(<PageMain>Content</PageMain>);

		const main = screen.getByRole("main");
		expect(main).toHaveAttribute("id", MAIN_CONTENT_ID);
		expect(main).toHaveAttribute("tabindex", "-1");
	});

	it("renders a screen-reader page title when provided", () => {
		render(<PageMain title="Sign in">Content</PageMain>);

		expect(
			screen.getByRole("heading", {
				level: 1,
				name: "Sign in",
			}),
		).toHaveClass("sr-only");
	});
});

describe("SkipToContentLink", () => {
	it("targets the shared main landmark", () => {
		render(
			<>
				<SkipToContentLink />
				<PageMain>Content</PageMain>
			</>,
		);

		const skipLink = screen.getByTestId("skip-to-content");
		expect(skipLink).toHaveAttribute("href", `#${MAIN_CONTENT_ID}`);
	});

	it("focuses the main landmark when activated", () => {
		render(
			<>
				<SkipToContentLink />
				<PageMain>Content</PageMain>
			</>,
		);

		const skipLink = screen.getByTestId("skip-to-content");
		const main = screen.getByRole("main");

		fireEvent.click(skipLink);

		expect(main).toHaveFocus();
	});
});
