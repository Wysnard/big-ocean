import { defineHandler, getRequestURL, sendRedirect } from "h3";

/** GET /results → /me (legacy bookmarks; app routes removed) */
export default defineHandler((event) => {
	const url = getRequestURL(event);
	return sendRedirect(event, `/me${url.search}`, 308);
});
