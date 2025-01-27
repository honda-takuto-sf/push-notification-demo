import { getMessaging, getToken, onMessage, isSupported, Messaging } from "firebase/messaging";
import { initializeApp, FirebaseApp } from "firebase/app";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Firebase 初期化
const app: FirebaseApp | undefined = typeof window !== "undefined" ? initializeApp(firebaseConfig) : undefined;

let messaging: Messaging | null = null;

// 🔹 `messaging` を非同期で取得
const getMessagingInstance = async (): Promise<Messaging | null> => {
    if (!(await isSupported())) {
        console.warn("❌ このブラウザは FCM をサポートしていません");
        return null;
    }
    return getMessaging(app);
};

// 🔹 FCM トークンを取得する
export const requestFCMToken = async () => {
    if (typeof window === "undefined") return null;

    // 🔹 Safari で Web Push が無効ならスキップ
    if (!("PushManager" in window)) {
        console.warn("🚨 Safari は Web Push をサポートしていません");
        return null;
    }

    if (Notification.permission === "denied") {
        console.warn("🚨 通知許可がブロックされています");
        return null;
    }

    try {
        console.log("🔄 FCM トークンを取得中...");
        if (!messaging) {
            messaging = await getMessagingInstance();
            if (!messaging) return null;
        }

        const registration = await navigator.serviceWorker.ready;
        const token = await getToken(messaging, {
            vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
            serviceWorkerRegistration: registration,
        });

        if (!token) {
            console.warn("⚠️ FCM トークンが取得できませんでした。PWA としてインストールしてください。");
            return null;
        }

        console.log("✅ 取得した FCM トークン:", token);
        return token;
    } catch (error) {
        console.error("🚨 FCM トークン取得失敗:", error);
        return null;
    }
};

// 🔹 フォアグラウンド通知のセットアップ
export const setupForegroundNotification = async (callback: (title: string, body: string) => void) => {
    if (typeof window === "undefined") return;

    if (!messaging) {
        messaging = await getMessagingInstance();
        if (!messaging) return;
    }

    onMessage(messaging, (payload) => {
        console.log("[fcm.ts] 📩 フォアグラウンドで通知を受信:", payload);
        if (payload.notification) {
            callback(payload.notification.title || "New Notification", payload.notification.body || "You have a new message.");
        }
    });
};
