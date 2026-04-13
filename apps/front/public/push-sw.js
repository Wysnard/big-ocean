self.addEventListener("push", (event) => {
	event.waitUntil(handlePush());
});

self.addEventListener("notificationclick", (event) => {
	event.notification.close();
	event.waitUntil(openNotificationTarget(event.notification.data?.url));
});

async function handlePush() {
	try {
		await self.registration.showNotification("New relationship letter", {
			body: "Someone has a letter to share with you",
			tag: "relationship-letter-ready",
			data: { url: "/" },
		});
	} catch (error) {
		console.error("[push-sw] Failed to show notification:", error);
	}
}

async function openNotificationTarget(url) {
	if (!url) return;

	const allClients = await clients.matchAll({
		type: "window",
		includeUncontrolled: true,
	});

	for (const client of allClients) {
		if ("focus" in client) {
			await client.focus();
			if ("navigate" in client) {
				await client.navigate(url);
			}
			return;
		}
	}

	if ("openWindow" in clients) {
		await clients.openWindow(url);
	}
}
