"use client";

import { useEffect, useState } from "react";
import {
  requestFCMToken,
  requestNotificationPermission,
} from "../../utils/fcm";
import { sendNotification } from "../../api/sendNotification";
import { checkFcmToken } from "../../api/checkFcmToken";
import { sendFcmTokenToBackend } from "../../api/sendFcmTokenToBackend";

// ------------------------------
// 設定変更可能な通知データ
// ------------------------------
const NOTIFICATION_CONFIG = {
  title: "通知タイトルです。",
  message: "通知本文。通知本文。通知本文。通知本文。",
  icon: "/icon-192x192.png",
  fixedToken:
    "coTtwoZu4e7Byykes9Eckm:APA91bFZsFcE3J3QMcvNDUyrLH9A4-dTVxPc7_G1IgsKYJ4o_dW3ydkNC15kDkSrT7sYznLPg5O27lTbvci7YbBeL21UsMt0x95RIc9uQMHbgiP4o9Nbvy8",
  url: "https://miraikondate.ajinomoto.co.jp/",
};

export default function Notifications() {
  const [token, setToken] = useState(null);
  const [isTokenSaved, setTokenSaved] = useState(null);
  const [permissionGranted, setPermissionGranted] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeNotifications = async () => {
      try {
        console.log("[INFO] 通知機能の初期化を開始します");
        setLoading(true);

        if ("serviceWorker" in navigator) {
          const registration = await navigator.serviceWorker.getRegistration();
          if (registration) {
            console.log(
              "[INFO] Service Worker は既に登録済みです",
              registration
            );
          } else {
            console.log("[INFO] Service Worker を登録します");
            console.time("Service Worker 登録時間");
            await navigator.serviceWorker.register(
              "/firebase-messaging-sw.js",
              {
                scope: "/",
              }
            );
            console.timeEnd("Service Worker 登録時間");
            console.log("[SUCCESS] Service Worker 登録に成功しました");
          }
        }

        console.log("[INFO] 通知の許可状態:", Notification.permission);
        const granted = await requestNotificationPermission();
        setPermissionGranted(granted);

        if (!granted) {
          console.warn("[WARN] 通知の許可が拒否されました");
          return;
        }

        const retrievedToken = await requestFCMToken();
        if (!retrievedToken) {
          console.error("[ERROR] FCM トークンの取得に失敗しました");
          return;
        }
        console.log("[INFO] FCM トークン取得成功:", retrievedToken);
        setToken(retrievedToken);

        const tokenExists = await checkFcmToken(retrievedToken);
        setTokenSaved(tokenExists);

        if (!tokenExists) {
          console.log("[INFO] トークン未保存のためバックエンドに保存します");
          const saveResponse = await sendFcmTokenToBackend(retrievedToken);
          if (!saveResponse) {
            console.error("[ERROR] FCM トークンの保存に失敗しました");
            return;
          }
          setTokenSaved(true);
        } else {
          console.log("[SUCCESS] 通知機能の初期化が完了しました");
        }
      } catch (error) {
        console.error("[ERROR] 通知初期化中にエラーが発生しました:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeNotifications();
  }, []);

  const checkTokenStatus = async () => {
    try {
      if (!token) {
        alert("[INFO] トークン未取得のため新規取得します");
        const newToken = await requestFCMToken();
        if (!newToken) throw new Error("トークン取得失敗");
        setToken(newToken);

        const exists = await checkFcmToken(newToken);
        if (!exists) {
          await sendFcmTokenToBackend(newToken);
        }
        setTokenSaved(exists);
        return;
      }

      const exists = await checkFcmToken(token);
      setTokenSaved(exists);
      alert(`[INFO] トークン保存状況: ${exists}`);

      if (!exists) {
        await sendFcmTokenToBackend(token);
        setTokenSaved(true);
      }
    } catch (e) {
      alert("[ERROR] トークン確認中にエラー:", e);
    }
  };

  const handleSendNotification = async (targetToken) => {
    console.log("[INFO] 通知を送信します");
    await sendNotification(
      targetToken,
      NOTIFICATION_CONFIG.title,
      NOTIFICATION_CONFIG.message,
      NOTIFICATION_CONFIG.icon,
      NOTIFICATION_CONFIG.url
    );
  };

  return (
    <div className="p-4 max-w-sm mx-auto text-center">
      <h1 className="text-lg font-bold">Push通知テスト</h1>

      <br></br>
      <p>通知送信ボタン</p>
      <button
        onClick={() => handleSendNotification(token)}
        disabled={!isTokenSaved || loading}
        className={`block w-full mt-4 py-2 rounded ${
          isTokenSaved && !loading
            ? "bg-blue-500 text-white"
            : "bg-gray-400 text-gray-700 cursor-not-allowed"
        }`}
      >
        通知を送信（操作端末のトークン）
      </button>

      <button
        onClick={() => handleSendNotification(NOTIFICATION_CONFIG.fixedToken)}
        className="block w-full mt-4 py-2 bg-purple-500 text-white rounded"
      >
        通知を送信（固定トークン）
      </button>

      <br></br>
      <p>ログ用</p>
      {loading && (
        <div className="mt-4 p-2 bg-gray-500 text-white">
          処理中: 初期化中...
        </div>
      )}

      {permissionGranted === false && (
        <div className="mt-4 p-2 bg-red-500 text-white">
          通知の許可が拒否されています
        </div>
      )}

      {isTokenSaved === false && !loading && (
        <div className="mt-4 p-2 bg-yellow-500 text-black">
          FCM トークンがバックエンドに保存されていません
        </div>
      )}

      {isTokenSaved === true && !loading && (
        <div className="mt-4 p-2 bg-green-500 text-white">
          FCM トークンが保存されています
        </div>
      )}

      <button
        onClick={checkTokenStatus}
        disabled={loading}
        className="block w-full mt-4 py-2 bg-blue-500 text-white rounded"
      >
        トークンの保存状態を確認
      </button>
    </div>
  );
}
