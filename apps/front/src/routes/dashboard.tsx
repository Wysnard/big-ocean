/**
 * Dashboard Page
 *
 * Protected route - requires authentication.
 */

import { createFileRoute } from "@tanstack/react-router";
import { UserMenu } from "../components/auth";
import { useRequireAuth } from "../hooks/use-auth";

export const Route = createFileRoute("/dashboard")({
	component: DashboardPage,
});

function DashboardPage() {
	const { user, isPending } = useRequireAuth("/login");

	if (isPending) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
					<p className="mt-4 text-gray-600">Loading...</p>
				</div>
			</div>
		);
	}

	if (!user) {
		return null; // Redirecting to login
	}

	return (
		<div className="min-h-screen bg-gray-50">
			<header className="bg-white shadow">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
					<h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
					<UserMenu />
				</div>
			</header>

			<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<div className="bg-white rounded-lg shadow p-6">
					<h2 className="text-xl font-semibold mb-4">Welcome, {user.name}!</h2>

					<div className="space-y-2">
						<p className="text-gray-600">
							<span className="font-medium">Email:</span> {user.email}
						</p>
						<p className="text-gray-600">
							<span className="font-medium">User ID:</span> {user.id}
						</p>
					</div>

					<div className="mt-6 p-4 bg-blue-50 rounded border border-blue-200">
						<p className="text-sm text-blue-800">✓ You're successfully authenticated with Better Auth</p>
					</div>
				</div>
			</main>
		</div>
	);
}
