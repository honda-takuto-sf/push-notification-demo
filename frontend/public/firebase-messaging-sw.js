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
            icon: "/icon-192x192.png",
        };

        console.log("[Service Worker] 通知を表示:", title, options);
        event.waitUntil(self.registration.showNotification(title, options));
    } catch (error) {
        console.error("[Service Worker] 通知データのJSON解析失敗:", error);
    }
});
