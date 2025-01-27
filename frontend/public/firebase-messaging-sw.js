// サービスワーカー
self.addEventListener("push", function (event) {
    console.log("[Service Worker] プッシュ通知を受信しました。");

    // 通知データの初期化
    let notificationData = {};

    // イベントにデータが含まれている場合、JSON に変換
    if (event.data) {
        try {
            notificationData = event.data.json();
        } catch (error) {
            console.error("通知データの JSON 解析に失敗しました:", error);
        }
    }

    // 通知のタイトルとオプションを設定
    const notificationTitle = notificationData.notification?.title || "通知";
    const notificationOptions = {
        body: notificationData.notification?.body || "新しいメッセージがあります。",
        icon: "/icon-192x192.png",
    };

    // 通知を表示
    event.waitUntil(
        self.registration.showNotification(notificationTitle, notificationOptions)
    );
});