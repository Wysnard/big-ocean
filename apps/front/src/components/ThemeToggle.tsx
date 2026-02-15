import { Button } from "@workspace/ui/components/button";
import { type UserTheme, useTheme } from "@workspace/ui/hooks/use-theme";
import { Monitor, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

const themeOrder: UserTheme[] = ["system", "dark", "light"];

const themeLabels: Record<UserTheme, string> = {
	light: "Light mode (click for auto)",
	dark: "Dark mode (click for light)",
	system: "Auto mode (click for dark)",
};

export function ThemeToggle() {
	const { userTheme, setTheme } = useTheme();
	// Prevent hydration mismatch - theme preference is only available client-side
	// SSR always renders "system" to match client's initial state
	const [isMounted, setIsMounted] = useState(false);

	useEffect(() => {
		setIsMounted(true);
	}, []);

	const cycleTheme = () => {
		const currentIndex = themeOrder.indexOf(userTheme);
		const nextIndex = (currentIndex + 1) % themeOrder.length;
		setTheme(themeOrder[nextIndex]);
	};

	return (
		<Button
			variant="ghost"
			size="icon"
			onClick={cycleTheme}
			data-slot="theme-toggle"
			aria-label={themeLabels[isMounted ? userTheme : "system"]}
		>
			{(isMounted ? userTheme : "system") === "light" && <Sun className="size-5" />}
			{(isMounted ? userTheme : "system") === "dark" && <Moon className="size-5" />}
			{(isMounted ? userTheme : "system") === "system" && <Monitor className="size-5" />}
			<span className="sr-only">Toggle theme</span>
		</Button>
	);
}
