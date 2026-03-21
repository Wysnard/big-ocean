/**
 * Online Status Hook
 *
 * Tracks browser connectivity via navigator.onLine and online/offline events.
 * Returns current online status and a flag indicating recent reconnection.
 *
 * Story 31-5: Network loss detection for session resume.
 */

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

function subscribe(callback: () => void) {
	window.addEventListener("online", callback);
	window.addEventListener("offline", callback);
	return () => {
		window.removeEventListener("online", callback);
		window.removeEventListener("offline", callback);
	};
}

function getSnapshot() {
	return navigator.onLine;
}

function getServerSnapshot() {
	return true;
}

/**
 * Hook that tracks browser online/offline status.
 *
 * @returns `{ isOnline, wasOffline }` — `wasOffline` is true for 3s after reconnecting
 */
export function useOnlineStatus() {
	const isOnline = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
	const [wasOffline, setWasOffline] = useState(false);
	const prevOnlineRef = useRef(isOnline);
	const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

	useEffect(() => {
		// Detect transition from offline -> online
		if (isOnline && !prevOnlineRef.current) {
			setWasOffline(true);
			// Clear the "was offline" flag after 3 seconds
			timerRef.current = setTimeout(() => setWasOffline(false), 3000);
		}

		// Detect transition from online -> offline
		if (!isOnline && prevOnlineRef.current) {
			setWasOffline(false);
			if (timerRef.current) {
				clearTimeout(timerRef.current);
			}
		}

		prevOnlineRef.current = isOnline;

		return () => {
			if (timerRef.current) {
				clearTimeout(timerRef.current);
			}
		};
	}, [isOnline]);

	return { isOnline, wasOffline };
}
