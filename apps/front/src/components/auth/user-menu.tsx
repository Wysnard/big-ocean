/**
 * User Menu Component
 *
 * Displays user info and logout button when authenticated.
 */

import { useAuth } from "../../hooks/use-auth";

export function UserMenu() {
  const { user, isAuthenticated, isPending, signOut } = useAuth();

  if (isPending) {
    return (
      <div className="animate-pulse bg-gray-200 h-8 w-24 rounded"></div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="flex gap-2">
        <a
          href="/login"
          className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
        >
          Sign In
        </a>
        <a
          href="/signup"
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
        >
          Sign Up
        </a>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="text-sm">
        <p className="font-medium text-gray-900">{user.name || "User"}</p>
        <p className="text-gray-500">{user.email}</p>
      </div>

      <button
        onClick={() => signOut()}
        className="px-3 py-1 text-sm font-medium text-gray-700 border border-gray-300 rounded hover:bg-gray-50"
      >
        Sign Out
      </button>
    </div>
  );
}
