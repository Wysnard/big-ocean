import type { Decorator } from "@storybook/react-vite";
import {
	RouterProvider,
	createMemoryHistory,
	createRootRoute,
	createRoute,
	createRouter,
} from "@tanstack/react-router";
import { ThemeContext, useThemeProvider } from "@workspace/ui/hooks/use-theme";

/**
 * Decorator that provides a TanStack Router context.
 * Used for components that depend on <Link> or other router features.
 */
export const withRouter: Decorator = (Story) => {
	const rootRoute = createRootRoute({
		component: () => <Story />,
	});

	const indexRoute = createRoute({
		getParentRoute: () => rootRoute,
		path: "/",
	});

	const catchAllRoute = createRoute({
		getParentRoute: () => rootRoute,
		path: "$",
	});

	const router = createRouter({
		routeTree: rootRoute.addChildren([indexRoute, catchAllRoute]),
		history: createMemoryHistory({ initialEntries: ["/"] }),
	});

	return <RouterProvider router={router} />;
};

/**
 * Decorator that provides ThemeContext for components using useTheme().
 * Lightweight alternative to ThemeProvider (avoids TanStack ScriptOnce dependency).
 */
export const withThemeProvider: Decorator = (Story) => {
	const theme = useThemeProvider();
	return (
		<ThemeContext value={theme}>
			<Story />
		</ThemeContext>
	);
};
