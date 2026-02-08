import type { Decorator } from "@storybook/react-vite";
import {
	RouterProvider,
	createMemoryHistory,
	createRootRoute,
	createRoute,
	createRouter,
} from "@tanstack/react-router";

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
