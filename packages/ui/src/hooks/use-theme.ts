"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

export type UserTheme = "light" | "dark" | "system";
export type AppTheme = "light" | "dark";

interface ThemeContextValue {
	userTheme: UserTheme;
	appTheme: AppTheme;
	setTheme: (theme: UserTheme) => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "big-ocean-theme";

function resolveAppTheme(userTheme: UserTheme): AppTheme {
	if (userTheme === "system") {
		if (typeof window === "undefined") return "light";
		return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
	}
	return userTheme;
}

function getStoredTheme(): UserTheme {
	if (typeof window === "undefined") return "system";
	const stored = localStorage.getItem(STORAGE_KEY);
	if (stored === "light" || stored === "dark" || stored === "system") return stored;
	return "system";
}

function applyTheme(appTheme: AppTheme) {
	document.documentElement.classList.toggle("dark", appTheme === "dark");
}

export function useThemeProvider() {
	const [userTheme, setUserTheme] = useState<UserTheme>(getStoredTheme);
	const [appTheme, setAppTheme] = useState<AppTheme>(() => resolveAppTheme(getStoredTheme()));

	const setTheme = useCallback((theme: UserTheme) => {
		setUserTheme(theme);
		const resolved = resolveAppTheme(theme);
		setAppTheme(resolved);
		localStorage.setItem(STORAGE_KEY, theme);
		applyTheme(resolved);
	}, []);

	// Listen for system preference changes when in system mode
	useEffect(() => {
		if (userTheme !== "system") return;

		const mql = window.matchMedia("(prefers-color-scheme: dark)");
		const handler = (e: MediaQueryListEvent) => {
			const resolved = e.matches ? "dark" : "light";
			setAppTheme(resolved);
			applyTheme(resolved);
		};
		mql.addEventListener("change", handler);
		return () => mql.removeEventListener("change", handler);
	}, [userTheme]);

	return { userTheme, appTheme, setTheme };
}

export function useTheme(): ThemeContextValue {
	const context = useContext(ThemeContext);
	if (!context) {
		throw new Error("useTheme must be used within a ThemeProvider");
	}
	return context;
}

/**
 * Inline script to prevent flash of wrong theme.
 * This script runs before React hydration via ScriptOnce.
 */
export const themeScript = `(function(){
  try {
    var t = localStorage.getItem('big-ocean-theme') || 'system';
    if (!['light','dark','system'].includes(t)) t = 'system';
    var d = t === 'system'
      ? (matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light')
      : t;
    document.documentElement.classList.toggle('dark', d === 'dark');
  } catch(e) {
    if (matchMedia('(prefers-color-scheme:dark)').matches)
      document.documentElement.classList.add('dark');
  }
})()`;
