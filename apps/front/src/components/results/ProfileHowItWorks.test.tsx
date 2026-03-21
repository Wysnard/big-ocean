// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProfileHowItWorks } from "./ProfileHowItWorks";

describe("ProfileHowItWorks", () => {
	it("renders 3 steps with correct titles", () => {
		render(<ProfileHowItWorks />);
		expect(screen.getByText("Talk to Nerin")).toBeInTheDocument();
		expect(screen.getByText("Get your portrait")).toBeInTheDocument();
		expect(screen.getByText("Compare with someone who matters")).toBeInTheDocument();
	});

	it("has data-testid='profile-how-it-works'", () => {
		render(<ProfileHowItWorks />);
		expect(screen.getByTestId("profile-how-it-works")).toBeInTheDocument();
	});

	it("renders step numbers", () => {
		render(<ProfileHowItWorks />);
		expect(screen.getByText("STEP 1")).toBeInTheDocument();
		expect(screen.getByText("STEP 2")).toBeInTheDocument();
		expect(screen.getByText("STEP 3")).toBeInTheDocument();
	});
});
