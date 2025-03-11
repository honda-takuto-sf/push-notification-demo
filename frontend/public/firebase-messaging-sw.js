// サービスワーカーのインストールイベント
self.addEventListener("install", (event) => {
    console.log("[Service Worker] インストール完了");
    event.waitUntil(self.skipWaiting());
});

// プッシュ通知受信イベント
self.addEventListener("push", (event) => {
    console.log("[Service Worker] プッシュ通知受信");

    try {
        const data = event.data.json();
        const title = data.notification?.title || "通知";
        const options = {
            body: data.notification?.body || "新しいメッセージがあります。",
            icon: data.notification?.icon,
            image: data.notification?.image
        };

        console.log("[Service Worker] 通知を表示:", title, options);
        event.waitUntil(self.registration.showNotification(title, options));
    } catch (error) {
        console.error("[Service Worker] 通知データのJSON解析失敗:", error);
    }
});

// 通知をタップしたときのイベント
self.addEventListener("notificationclick", (event) => {
    console.log("[Service Worker] 通知がクリックされました");

    event.notification.close(); // 通知を閉じる

    const url = event.notification.data?.url || "https://ab16-240b-10-dcc1-1400-70d7-8d2d-8a0c-22c0.ngrok-free.app/"; // デフォルトURL

    event.waitUntil(
        clients
            .matchAll({ type: "window", includeUncontrolled: true })
            .then((windowClients) => {
                for (const client of windowClients) {
                    if (client.url === url && "focus" in client) {
                        return client.focus();
                    }
                }
                if (clients.openWindow) {
                    return clients.openWindow(url);
                }
            })
    );
});
