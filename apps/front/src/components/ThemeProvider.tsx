import { ScriptOnce } from "@tanstack/react-router";
import { ThemeContext, themeScript, useThemeProvider } from "@workspace/ui/hooks/use-theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
	const theme = useThemeProvider();

	return (
		<ThemeContext value={theme}>
			<ScriptOnce>{themeScript}</ScriptOnce>
			{children}
		</ThemeContext>
	);
}
