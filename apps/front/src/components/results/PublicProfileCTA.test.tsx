// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-router", () => ({
	Link: ({ children, to, ...props }: { children: React.ReactNode; to: string }) => (
		<a href={to} {...props}>
			{children}
		</a>
	),
}));

import { InviteCeremonyProvider } from "@/components/invite/InviteCeremonyProvider";
import { PublicProfileCTA } from "./PublicProfileCTA";

function createWrapper() {
	const qc = new QueryClient({
		defaultOptions: {
			queries: { retry: false },
			mutations: { retry: false },
		},
	});
	return ({ children }: { children: React.ReactNode }) => (
		<QueryClientProvider client={qc}>
			<InviteCeremonyProvider>{children}</InviteCeremonyProvider>
		</QueryClientProvider>
	);
}

describe("PublicProfileCTA", () => {
	it("renders 'What's YOUR code?' heading for unauthenticated visitors", () => {
		render(
			<PublicProfileCTA displayName="Alice" publicProfileId="abc123" authState="unauthenticated" />,
			{ wrapper: createWrapper() },
		);
		expect(screen.getByText("What's YOUR code?")).toBeInTheDocument();
	});

	it("renders 'Start Your Conversation' button for unauthenticated visitors", () => {
		render(
			<PublicProfileCTA displayName="Alice" publicProfileId="abc123" authState="unauthenticated" />,
			{ wrapper: createWrapper() },
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
			{ wrapper: createWrapper() },
		);
		expect(
			screen.getByText("You care about Alice. Discover your dynamic together."),
		).toBeInTheDocument();
	});

	it("renders invite ceremony subcopy for authenticated-assessed users", () => {
		render(
			<PublicProfileCTA
				displayName="Alice"
				publicProfileId="abc123"
				authState="authenticated-assessed"
			/>,
			{ wrapper: createWrapper() },
		);
		expect(
			screen.getByText(
				/When you're ready, open a short invitation—you can share a private link, a QR code, or your device's share sheet\./,
			),
		).toBeInTheDocument();
	});

	it("renders 'Start Your Assessment' button for authenticated-no-assessment users", () => {
		render(
			<PublicProfileCTA
				displayName="Alice"
				publicProfileId="abc123"
				authState="authenticated-no-assessment"
			/>,
			{ wrapper: createWrapper() },
		);
		expect(screen.getByTestId("public-profile-cta-button")).toHaveTextContent(
			"Start Your Assessment",
		);
	});

	it("links to /signup for unauthenticated visitors", () => {
		render(
			<PublicProfileCTA displayName="Alice" publicProfileId="abc123" authState="unauthenticated" />,
			{ wrapper: createWrapper() },
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
			{ wrapper: createWrapper() },
		);
		expect(
			screen.queryByText("You care about Alice. Discover your dynamic together."),
		).not.toBeInTheDocument();
		expect(
			screen.queryByText(
				/When you're ready, open a short invitation—you can share a private link, a QR code, or your device's share sheet\./,
			),
		).not.toBeInTheDocument();
	});

	it("shows generic CTA when viewing own profile as authenticated-assessed", () => {
		render(
			<PublicProfileCTA
				displayName="Alice"
				publicProfileId="abc123"
				authState="authenticated-assessed"
				isOwnProfile={true}
			/>,
			{ wrapper: createWrapper() },
		);
		expect(screen.getByText("What's YOUR code?")).toBeInTheDocument();
	});

	it("shows invite CTA when isOwnProfile is false for authenticated-assessed", () => {
		render(
			<PublicProfileCTA
				displayName="Alice"
				publicProfileId="abc123"
				authState="authenticated-assessed"
				isOwnProfile={false}
			/>,
			{ wrapper: createWrapper() },
		);
		expect(
			screen.getByText("You care about Alice. Discover your dynamic together."),
		).toBeInTheDocument();
		expect(screen.getByTestId("public-profile-cta-button")).toHaveTextContent(
			"Invite into your Circle",
		);
		const button = screen.getByTestId("public-profile-cta-button");
		expect(button.closest("a")).toBeNull();
	});
});
