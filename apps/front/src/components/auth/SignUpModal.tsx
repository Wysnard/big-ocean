/**
 * Sign-Up Modal Component
 *
 * Displays a subtle modal after the user's first message to encourage sign-up
 * without pressure. Links anonymous assessment sessions to new user accounts.
 *
 * Features:
 * - Appears after first user message
 * - Can be dismissed easily ("Continue without account")
 * - Links session to new user on signup
 * - Shows success message after signup
 */

import { Button } from "@workspace/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@workspace/ui/components/dialog";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";

interface SignUpModalProps {
	isOpen: boolean;
	sessionId: string;
	onClose: () => void;
}

export function SignUpModal({ isOpen, sessionId, onClose }: SignUpModalProps) {
	const { signUp } = useAuth();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [success, setSuccess] = useState(false);

	const validateEmail = (email: string): boolean => {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(email);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);

		// Validate email format
		if (!validateEmail(email)) {
			setError("Please enter a valid email address");
			return;
		}

		// Validate password length (NIST 2025: 12 chars minimum)
		if (password.length < 12) {
			setError("Password must be at least 12 characters");
			return;
		}

		setIsLoading(true);

		try {
			// Pass anonymousSessionId for automatic session linking
			await signUp.email(email, password, undefined, sessionId);
			setSuccess(true);

			// Close modal after brief delay
			setTimeout(() => {
				onClose();
			}, 1500);
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : String(err);
			setError(errorMessage);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="bg-slate-800 border-slate-700 sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="text-white text-xl">Save your results?</DialogTitle>
					<DialogDescription className="text-slate-300">
						Sign up to continue and keep your personality insights
					</DialogDescription>
				</DialogHeader>

				{success ? (
					<div data-testid="modal-signup-success" className="py-6 text-center">
						<div className="text-green-400 text-lg font-medium mb-2">✓ Your results are being saved!</div>
						<p className="text-slate-300 text-sm">You can now access them anytime</p>
					</div>
				) : (
					<form onSubmit={handleSubmit} className="space-y-4">
						{error && (
							<div className="bg-red-900/20 border border-red-700/30 text-red-300 p-3 rounded text-sm">
								{error}
							</div>
						)}

						<div>
							<label htmlFor="modal-email" className="block text-sm font-medium text-slate-300 mb-1">
								Email
							</label>
							<input
								data-testid="modal-signup-email"
								id="modal-email"
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
								placeholder="your.email@example.com"
								className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
							/>
						</div>

						<div>
							<label htmlFor="modal-password" className="block text-sm font-medium text-slate-300 mb-1">
								Password
							</label>
							<input
								data-testid="modal-signup-password"
								id="modal-password"
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
								minLength={12}
								placeholder="At least 12 characters"
								className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
							/>
							<p className="text-xs text-slate-400 mt-1">Minimum 12 characters (NIST 2025)</p>
						</div>

						<DialogFooter className="flex flex-col gap-2 sm:flex-col">
							<Button
								data-testid="modal-signup-submit"
								type="submit"
								disabled={isLoading}
								className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
							>
								{isLoading ? "Signing up..." : "Sign Up"}
							</Button>
							<Button
								data-testid="modal-signup-dismiss"
								type="button"
								variant="ghost"
								onClick={onClose}
								className="w-full text-slate-300 hover:text-white hover:bg-slate-700/50"
							>
								Continue without account
							</Button>
						</DialogFooter>
					</form>
				)}
			</DialogContent>
		</Dialog>
	);
}
