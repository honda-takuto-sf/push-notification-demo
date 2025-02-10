"use client";

import { useEffect, useState } from "react";
import { requestFCMToken, requestNotificationPermission } from "../../utils/fcm";
import { sendNotification } from "../../api/sendNotification";
import { sendScheduledNotification } from "../../api/sendScheduledNotification";
import { checkFcmToken } from "../../api/checkFcmToken";
import { sendFcmTokenToBackend } from "../../api/sendFcmTokenToBackend";

/**
 * 通知機能のコンポーネント
 * - FCMトークンの取得・保存・確認
 * - フォアグラウンド & バックグラウンド通知の送信
 */
export default function Notifications() {
    const [token, setToken] = useState<string | null>(null);
    const [isTokenSaved, setTokenSaved] = useState<boolean | null>(null);
    const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        async function initializeNotifications() {
            try {
                console.log("[INFO] 通知機能の初期化開始");
                setLoading(true);

                // **1. サービスワーカーの登録**
                if ("serviceWorker" in navigator) {
                    await navigator.serviceWorker.register("/firebase-messaging-sw.js", { scope: "/" });
                    console.log("[SUCCESS] Service Worker 登録成功");
                }

                // **2. 通知の許可をリクエスト**
                const granted = await requestNotificationPermission();
                setPermissionGranted(granted);

                if (!granted) {
                    console.warn("[WARN] 通知の許可が拒否されました");
                    setLoading(false);
                    return;
                }

                // **3. FCMトークンの取得**
                const retrievedToken = await requestFCMToken();
                if (!retrievedToken) {
                    console.warn("[WARN] FCM トークンを取得できませんでした");
                    setLoading(false);
                    return;
                }
                console.log("[INFO] 取得した FCM トークン:", retrievedToken);
                setToken(retrievedToken);

                // **4. バックエンドにトークンを保存**
                const saveResponse = await sendFcmTokenToBackend(retrievedToken);
                if (!saveResponse || saveResponse.error) {
                    console.warn("[ERROR] FCM トークンの保存に失敗しました");
                    setLoading(false);
                    return;
                }

                // **5. トークンの保存状態を確認**
                const tokenExists = await checkFcmToken(retrievedToken);
                setTokenSaved(tokenExists);

                if (!tokenExists) {
                    console.warn("[WARN] FCM トークンがバックエンドに保存されていません");
                }

                console.log("[SUCCESS] 通知機能の初期化完了");
            } catch (error) {
                console.error("[ERROR] 通知の初期化中にエラーが発生しました:", error);
            } finally {
                setLoading(false);
            }
        }

        initializeNotifications();
    }, []);

    /**
     * FCM トークンの保存状態を確認
     */
    const checkTokenStatus = async () => {
        if (!token) {
            console.warn("[WARN] FCM トークンが未取得です");
            return;
        }
        console.log("[INFO] トークンの保存状態を確認:", token);
        const tokenExists = await checkFcmToken(token);
        setTokenSaved(tokenExists);
    };

    /**
     * フォアグラウンド通知を送信
     */
    const handleForegroundNotification = async () => {
        if (!token || !isTokenSaved) {
            console.warn("[WARN] FCM トークンがバックエンドに保存されていません");
            return;
        }
        console.log("[INFO] フォアグラウンド通知を送信");
        await sendNotification(token, "フォアグラウンド通知", "この通知は onMessage を使っています");
    };

    /**
     * バックグラウンド通知を送信
     */
    const handleBackgroundNotification = async () => {
        if (!token || !isTokenSaved) {
            console.warn("[WARN] FCM トークンがバックエンドに保存されていません");
            return;
        }
        console.log("[INFO] バックグラウンド通知を送信");
        await sendScheduledNotification(token, "バックグラウンド通知", "この通知は Service Worker で処理されます", 30);
    };

    return (
        <div className="p-4 max-w-sm mx-auto text-center">
            <h1 className="text-lg font-bold">Push通知テスト</h1>

            {loading && (
                <div className="mt-4 p-2 bg-gray-500 text-white">
                    <strong>処理中:</strong> 初期化中...
                </div>
            )}

            {permissionGranted === false && (
                <div className="mt-4 p-2 bg-red-500 text-white">
                    <strong>エラー:</strong> 通知の許可が拒否されています
                </div>
            )}

            {isTokenSaved === false && !loading && (
                <div className="mt-4 p-2 bg-yellow-500 text-black">
                    <strong>警告:</strong> FCM トークンがバックエンドに保存されていません
                </div>
            )}

            {isTokenSaved === true && !loading && (
                <div className="mt-4 p-2 bg-green-500 text-white">
                    <strong>成功:</strong> FCM トークンがバックエンドに保存されています
                </div>
            )}

            <button
                onClick={handleForegroundNotification}
                disabled={!isTokenSaved || loading}
                className={`block w-full mt-4 py-2 rounded ${
                    isTokenSaved && !loading ? "bg-blue-500 text-white" : "bg-gray-400 text-gray-700 cursor-not-allowed"
                }`}
            >
                フォアグラウンド通知 (onMessage)
            </button>

            <button
                onClick={handleBackgroundNotification}
                disabled={!isTokenSaved || loading}
                className={`block w-full mt-4 py-2 rounded ${
                    isTokenSaved && !loading ? "bg-green-500 text-white" : "bg-gray-400 text-gray-700 cursor-not-allowed"
                }`}
            >
                バックグラウンド通知 (Service Worker, 30秒後)
            </button>

            <button
                onClick={checkTokenStatus}
                disabled={loading}
                className="block w-full mt-4 py-2 bg-blue-500 text-white rounded"
            >
                トークンの保存状態を確認
            </button>

            <button
                onClick={() => {
                    if (typeof window !== "undefined" && "Notification" in window) {
                        Notification.requestPermission().then((permission) => {
                            alert(permission);
                        });
                    } else {
                        console.error("[ERROR] 通知APIがサポートされていません");
                    }
                }}
                className="block w-full mt-4 py-2 bg-yellow-500 text-white rounded"
            >
                通知許可
            </button>
        </div>
    );
}
