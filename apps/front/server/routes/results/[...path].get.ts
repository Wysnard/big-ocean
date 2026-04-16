import { defineHandler, getRequestURL, getRouterParam, sendRedirect } from "h3";

/** GET /results/* → /me/* (preserve query string) */
export default defineHandler((event) => {
	const rest = getRouterParam(event, "path") ?? "";
	const url = getRequestURL(event);
	const dest = rest ? `/me/${rest}` : "/me";
	return sendRedirect(event, `${dest}${url.search}`, 308);
});
