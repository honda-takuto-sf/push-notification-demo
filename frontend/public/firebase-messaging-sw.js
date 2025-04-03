// Service Worker のインストールイベント
self.addEventListener("install", (event) => {
  console.log("[Service Worker] インストール完了");
  event.waitUntil(self.skipWaiting());
});

// プッシュ通知受信イベント
self.addEventListener("push", (event) => {
  console.log("[Service Worker] プッシュ通知受信");
  console.log(event);

  try {
    const data = event.data.json();
    console.log("[Service Worker] 受信データ:", data);

    const title = data.notification?.title || "通知";
    const options = {
      body: data.notification?.body || "新しいメッセージがあります。",
      icon: data.notification.icon,
      data: { url: data.data?.url },
    };

    console.log("[Service Worker] 通知オプション:", options);
    event.waitUntil(self.registration.showNotification(title, options));
  } catch (error) {
    console.error("[Service Worker] 通知データのJSON解析失敗:", error);
  }
});

// 通知をタップしたときのイベント
self.addEventListener("notificationclick", (event) => {
  console.log("[Service Worker] 通知がクリックされました", event);
  event.notification.close(); // 通知を閉じる

  const url = event.notification.data?.url || "https://default-url.com/";
  console.log("[Service Worker] 遷移先URL:", url);

  event.waitUntil(
    self.clients.claim().then(() => {
      // PWAの制御をService Workerが確実に取得
      return self.clients
        .matchAll({ type: "window", includeUncontrolled: true })
        .then((windowClients) => {
          for (const client of windowClients) {
            if (client.url === url && "focus" in client) {
              return client.focus();
            }
          }
          // PWAの内部リンクなら開く、それ以外なら Safari で開く
          if (url.startsWith("https://your-pwa-domain.com")) {
            return self.clients.openWindow(url);
          } else {
            return self.clients.openWindow(url); // iOSでは Safari で開く
          }
        });
    })
  );
});
