import { Button } from "@workspace/ui/components/button";
import { type UserTheme, useTheme } from "@workspace/ui/hooks/use-theme";
import { Monitor, Moon, Sun } from "lucide-react";

const themeOrder: UserTheme[] = ["system", "light", "dark"];

const themeLabels: Record<UserTheme, string> = {
	light: "Light mode (click for dark)",
	dark: "Dark mode (click for auto)",
	system: "Auto mode (click for light)",
};

export function ThemeToggle() {
	const { userTheme, setTheme } = useTheme();

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
			aria-label={themeLabels[userTheme]}
		>
			{userTheme === "light" && <Sun className="size-5" />}
			{userTheme === "dark" && <Moon className="size-5" />}
			{userTheme === "system" && <Monitor className="size-5" />}
			<span className="sr-only">Toggle theme</span>
		</Button>
	);
}
