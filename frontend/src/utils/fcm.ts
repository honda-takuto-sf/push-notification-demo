import { getMessaging, getToken, onMessage, isSupported, Messaging } from "firebase/messaging";
import { initializeApp, FirebaseApp } from "firebase/app";
import { sendFcmTokenToBackend } from "../api/sendFcmTokenToBackend";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp | undefined;
let messaging: Messaging | null = null;

/**
 * **Firebase アプリの初期化**
 * - Firebase アプリが未初期化の場合、初期化を行う
 */
const initializeFirebase = () => {
    if (!app) {
        app = initializeApp(firebaseConfig);
        console.log("[INFO] Firebase アプリを初期化しました");
    }
};

/**
 * **FCM Messaging インスタンスの取得**
 * - ブラウザが FCM をサポートしているか確認
 * - 初期化が必要な場合は `initializeFirebase()` を実行
 * @returns Messaging | null
 */
const getMessagingInstance = async (): Promise<Messaging | null> => {
    if (!(await isSupported())) {
        console.warn("[WARN] このブラウザは FCM をサポートしていません");
        return null;
    }
    if (!app) {
        initializeFirebase();
    }
    return getMessaging(app!);
};

/**
 * **FCM トークンの取得**
 * - 通知の許可をリクエスト
 * - Service Worker を使用してトークンを取得
 * - 取得後、バックエンドにトークンを保存
 * @returns 取得した FCM トークン | null
 */
export const requestFCMToken = async (): Promise<string | null> => {
    if (!("PushManager" in window)) {
        console.warn("[WARN] このブラウザは Web Push をサポートしていません");
        return null;
    }

    const permissionGranted = await requestNotificationPermission();
    if (!permissionGranted) {
        console.warn("[WARN] 通知許可が拒否されたため、FCM トークンを取得できません");
        return null;
    }

    try {
        if (!messaging) {
            messaging = await getMessagingInstance();
            if (!messaging) {
                console.error("[ERROR] messaging インスタンスの取得に失敗しました");
                return null;
            }
        }

        const registration = await navigator.serviceWorker.ready;
        const token = await getToken(messaging, {
            vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
            serviceWorkerRegistration: registration,
        });

        if (!token) {
            console.warn("[WARN] FCM トークンの取得に失敗しました");
            return null;
        }

        console.log("[INFO] 取得した FCM トークン:", token);

        // バックエンドへトークンを送信
        await sendFcmTokenToBackend(token);

        return token;
    } catch (error) {
        console.error("[ERROR] FCM トークン取得失敗:", error);
        return null;
    }
};

/**
 * **フォアグラウンド通知のセットアップ**
 * - `onMessage()` を使用し、通知が届いたときにコールバックを実行
 * @param callback - 通知を処理する関数 (title: string, body: string)
 */
export const setupForegroundNotification = async (callback: (title: string, body: string) => void) => {
    if (!messaging) {
        messaging = await getMessagingInstance();
        if (!messaging) {
            console.error("[ERROR] フォアグラウンド通知の messaging インスタンス取得に失敗");
            return;
        }
    }

    console.log("[INFO] フォアグラウンド通知のリスナーを登録");
    onMessage(messaging, (payload) => {
        if (payload.notification) {
            callback(payload.notification.title || "通知", payload.notification.body || "新しいメッセージがあります");
        }
    });
};

/**
 * **通知の許可をリクエスト**
 * - 通知の許可状態を確認し、リクエスト
 * @returns 許可が `granted` の場合 `true`, それ以外は `false`
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
    if (!("Notification" in window)) {
        console.warn("[WARN] このブラウザは通知をサポートしていません");
        return false;
    }

    const permission = await Notification.requestPermission();
    console.log("[INFO] 通知の許可状態:", permission);
    return permission === "granted";
};
