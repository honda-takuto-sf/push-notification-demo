"use client";

import { useEffect, useState } from "react";
import { requestFCMToken, setupForegroundNotification } from "../../utils/fcm";
import { sendNotification } from "../../api/sendNotification";

export default function Notifications() {
    const [notification, setNotification] = useState<{ title: string; body: string } | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isTokenLoading, setIsTokenLoading] = useState<boolean>(true); // トークン取得中フラグ

    useEffect(() => {
        // **トークンを自動取得**
        if (typeof window !== "undefined") {
            console.log("🔄 トークンを取得中...");
            requestFCMToken().then((token) => {
                if (token) {
                    console.log("✅ 取得した FCM トークン:", token);
                    setToken(token);
                } else {
                    console.warn("⚠️ FCM トークンを取得できませんでした");
                }
                setIsTokenLoading(false);
            });
        }

        // **Service Worker を登録**
        if ("serviceWorker" in navigator) {
            navigator.serviceWorker.getRegistration().then((registration) => {
                if (!registration) {
                    navigator.serviceWorker
                        .register("/firebase-messaging-sw.js")
                        .then(() => console.log("[firebase.js] ✅ Service Worker 登録成功！"))
                        .catch((error) => console.error("[firebase.js] ❌ Service Worker 登録失敗:", error));
                }
            });
        }

        // **通知受信のセットアップ**
        setupForegroundNotification((title, body) => {
            setNotification({ title, body });
            showNativeNotification(title, body);
        });
    }, []);

    // 🔹 Web API の通知（FCM ではない、ブラウザのネイティブ通知）
    const showNativeNotification = (title: string, body: string) => {
        if (Notification.permission === "granted") {
            new Notification(title, { body });
        }
    };

    const handleSendNotification = () => {
        if (!token) {
            console.warn("⚠️ トークンが取得できていません！");
            return;
        }

        sendNotification(token, "🔔 通知のタイトル", "📩 これはテスト通知です！")
            .then((response) => console.log("✅ 通知送信成功:", response))
            .catch((error) => console.error("❌ 通知送信失敗:", error));
    };

    const handlePermissionRequest = async () => {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
            console.log("[通知] ✅ 許可されました");
            const token = await requestFCMToken();
            if (token) {
                console.log("✅ 取得した FCM トークン:", token);
                setToken(token);
            } else {
                console.warn("⚠️ FCM トークンを取得できませんでした");
            }
        } else {
            console.warn("[通知] ❌ 拒否またはブロックされました");
        }
    };

    return (
        <div style={{ padding: "20px", maxWidth: "400px", margin: "0 auto", textAlign: "center" }}>
            <h1>📢 Push Notifications</h1>

            <button
                onClick={handleSendNotification}
                style={{ display: "block", margin: "10px auto", padding: "10px", backgroundColor: "#4CAF50", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" }}>
                📤 通知を送信
            </button>

            <button
                onClick={handlePermissionRequest}
                style={{ display: "block", margin: "10px auto", padding: "10px", backgroundColor: "#ff9800", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" }}>
                🔑 通知の許可をリクエスト
            </button>

            {isTokenLoading && <p>🔄 トークンを取得中...</p>}
            {!isTokenLoading && !token && <p>⚠️ トークンが取得できませんでした</p>}
            {notification && (
                <div style={{ border: "1px solid #ccc", padding: "10px", marginTop: "10px" }}>
                    <h2>{notification.title}</h2>
                    <p>{notification.body}</p>
                </div>
            )}
        </div>
    );
}
