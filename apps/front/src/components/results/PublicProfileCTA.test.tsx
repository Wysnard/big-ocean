// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// Mock TanStack Router's Link component
vi.mock("@tanstack/react-router", () => ({
	Link: ({ children, to, ...props }: { children: React.ReactNode; to: string }) => (
		<a href={to} {...props}>
			{children}
		</a>
	),
}));

import { PublicProfileCTA } from "./PublicProfileCTA";

describe("PublicProfileCTA", () => {
	it("renders 'What's YOUR code?' heading for unauthenticated visitors", () => {
		render(
			<PublicProfileCTA displayName="Alice" publicProfileId="abc123" authState="unauthenticated" />,
		);
		expect(screen.getByText("What's YOUR code?")).toBeInTheDocument();
	});

	it("renders 'Start Your Conversation' button for unauthenticated visitors", () => {
		render(
			<PublicProfileCTA displayName="Alice" publicProfileId="abc123" authState="unauthenticated" />,
		);
		expect(screen.getByTestId("public-profile-cta-button")).toHaveTextContent(
			"Start Your Conversation",
		);
	});

	it("renders 'You care about [Name]' heading for authenticated-assessed users", () => {
		render(
			<PublicProfileCTA
				displayName="Alice"
				publicProfileId="abc123"
				authState="authenticated-assessed"
			/>,
		);
		expect(
			screen.getByText("You care about Alice. Discover your dynamic together."),
		).toBeInTheDocument();
	});

	it("renders QR flow explanation for authenticated-assessed users", () => {
		render(
			<PublicProfileCTA
				displayName="Alice"
				publicProfileId="abc123"
				authState="authenticated-assessed"
			/>,
		);
		expect(screen.getByText(/scan a QR code together/i)).toBeInTheDocument();
	});

	it("renders 'Start Your Assessment' button for authenticated-no-assessment users", () => {
		render(
			<PublicProfileCTA
				displayName="Alice"
				publicProfileId="abc123"
				authState="authenticated-no-assessment"
			/>,
		);
		expect(screen.getByTestId("public-profile-cta-button")).toHaveTextContent(
			"Start Your Assessment",
		);
	});

	it("links to /signup for unauthenticated visitors", () => {
		render(
			<PublicProfileCTA displayName="Alice" publicProfileId="abc123" authState="unauthenticated" />,
		);
		const link = screen.getByTestId("public-profile-cta-button").closest("a");
		expect(link).toHaveAttribute("href", "/signup");
	});

	it("does NOT show relationship CTA when viewing own profile as authenticated-assessed", () => {
		render(
			<PublicProfileCTA
				displayName="Alice"
				publicProfileId="abc123"
				authState="authenticated-assessed"
				isOwnProfile={true}
			/>,
		);
		expect(
			screen.queryByText("You care about Alice. Discover your dynamic together."),
		).not.toBeInTheDocument();
		expect(screen.queryByText(/scan a QR code together/i)).not.toBeInTheDocument();
	});

	it("shows generic CTA when viewing own profile as authenticated-assessed", () => {
		render(
			<PublicProfileCTA
				displayName="Alice"
				publicProfileId="abc123"
				authState="authenticated-assessed"
				isOwnProfile={true}
			/>,
		);
		expect(screen.getByText("What's YOUR code?")).toBeInTheDocument();
	});

	it("shows relationship CTA when isOwnProfile is false for authenticated-assessed", () => {
		render(
			<PublicProfileCTA
				displayName="Alice"
				publicProfileId="abc123"
				authState="authenticated-assessed"
				isOwnProfile={false}
			/>,
		);
		expect(
			screen.getByText("You care about Alice. Discover your dynamic together."),
		).toBeInTheDocument();
	});
});
