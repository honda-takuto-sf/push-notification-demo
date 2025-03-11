"use client";

import { useEffect, useState } from "react";
import {
  requestFCMToken,
  requestNotificationPermission,
} from "../../utils/fcm";
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
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(true);
  const fixedToken =
    "cFaNovgVTbIvE1qCH8cx0p:APA91bG_mPZtCPVCZg9RJ1DcJUhky5zCMwbfdAnQgH8VHBm_Z_3yOJj9KO_zQnoNni2Eh_JhkOLgBu9AlpNeR_HDJ0_JCldJtaD8nVkmFpkuxawuhXVFpNE";

  useEffect(() => {
    async function initializeNotifications() {
      try {
        alert("[INFO] 通知機能の初期化開始");
        setLoading(true);

        // **1. サービスワーカーの登録**
        if ("serviceWorker" in navigator) {
          await navigator.serviceWorker.register("/firebase-messaging-sw.js", {
            scope: "/",
          });
          console.log("[SUCCESS] Service Worker 登録成功");
          alert("[SUCCESS] Service Worker 登録成功");
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
          alert("[WARN] FCM トークンを取得できませんでした");
          setLoading(false);
          return;
        }
        console.log("[INFO] 取得した FCM トークン:", retrievedToken);
        setToken(retrievedToken);

        // **4. バックエンドにトークンを保存**
        const saveResponse = await sendFcmTokenToBackend(retrievedToken);
        if (!saveResponse) {
          console.error("[ERROR] FCM トークンの保存に失敗しました");
          alert("[ERROR] FCM トークンの保存に失敗しました");
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
      alert("[WARN] FCM トークンが未取得です。新しく取得します。");

      // **FCMトークンを新しく取得**
      const newToken = await requestFCMToken();
      if (!newToken) {
        alert("[ERROR] FCM トークンの取得に失敗しました。");
        return;
      }

      alert(`[INFO] 新しく取得した FCM トークン: ${newToken}`);
      setToken(newToken);

      // **バックエンドにトークンを保存**
      const saveResponse = await sendFcmTokenToBackend(newToken);
      if (!saveResponse) {
        alert("[ERROR] バックエンドへの FCM トークン保存に失敗しました。");
        return;
      }
      alert("[SUCCESS] FCM トークンをバックエンドに保存しました。");

      // **保存後、トークンの状態を再確認**
      const tokenExists = await checkFcmToken(newToken);
      setTokenSaved(tokenExists);
      alert(`[INFO] トークンがバックエンドに保存されているか: ${tokenExists}`);
      return;
    }

    alert(`[INFO] 既存の FCM トークンを確認: ${token}`);
    const tokenExists = await checkFcmToken(token);
    setTokenSaved(tokenExists);
    alert(`[INFO] トークンがバックエンドに保存されているか: ${tokenExists}`);

    // **トークンが存在しなければ、再取得して保存**
    if (!tokenExists) {
      alert(
        "[WARN] トークンがバックエンドに保存されていません。新しく取得します。"
      );

      const newToken = await requestFCMToken();
      if (!newToken) {
        alert("[ERROR] 新しい FCM トークンの取得に失敗しました。");
        return;
      }

      alert(`[INFO] 新しく取得した FCM トークン: ${newToken}`);
      setToken(newToken);

      const saveResponse = await sendFcmTokenToBackend(newToken);
      if (!saveResponse) {
        alert("[ERROR] バックエンドへの FCM トークン保存に失敗しました。");
        return;
      }
      alert("[SUCCESS] 新しい FCM トークンをバックエンドに保存しました。");

      // **保存後、再確認**
      const tokenExistsAfterSave = await checkFcmToken(newToken);
      setTokenSaved(tokenExistsAfterSave);
      alert(
        `[INFO] 新しいトークンがバックエンドに保存されたか: ${tokenExistsAfterSave}`
      );
    }
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
    await sendNotification(
      token,
      "フォアグラウンド通知",
      "この通知は onMessage を使っています",
      "/icon-192x192.png",
      "/192x192.png"
    );
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
    await sendScheduledNotification(
      token,
      "バックグラウンド通知",
      "この通知は Service Worker で処理されます",
      10,
      "/192x192.png",
      "/icon-192x192.png"
    );
  };

  /**
   * 固定の FCM トークンに通知を送信
   */
  const sendNotificationToFixedToken = async () => {
    alert("[INFO] 固定トークンに通知を送信");
    await sendNotification(
      fixedToken,
      "固定トークン通知",
      "この通知は特定のトークン宛です",
      "/icon-192x192.png",
      "/192x192.png"
    );
  };

  /**
   * 固定の FCM トークンにバックグラウンド通知を送信
   */
  const sendScheduledNotificationToFixedToken = async () => {
    alert("[INFO] 固定トークンにバックグラウンド通知を送信");
    await sendScheduledNotification(
      fixedToken,
      "固定トークンBG通知",
      "この通知は特定のトークン宛です",
      10,
      "/192x192.png",
      "/icon-192x192.png"
    );
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
          isTokenSaved && !loading
            ? "bg-blue-500 text-white"
            : "bg-gray-400 text-gray-700 cursor-not-allowed"
        }`}
      >
        フォアグラウンド通知 (onMessage)
      </button>

      <button
        onClick={handleBackgroundNotification}
        disabled={!isTokenSaved || loading}
        className={`block w-full mt-4 py-2 rounded ${
          isTokenSaved && !loading
            ? "bg-green-500 text-white"
            : "bg-gray-400 text-gray-700 cursor-not-allowed"
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
      <button
        onClick={sendNotificationToFixedToken}
        className="block w-full mt-4 py-2 bg-purple-500 text-white rounded"
      >
        固定トークンにフォアグラウンド通知
      </button>

      <button
        onClick={sendScheduledNotificationToFixedToken}
        className="block w-full mt-4 py-2 bg-purple-700 text-white rounded"
      >
        固定トークンにバックグラウンド通知 (10秒後)
      </button>
    </div>
  );
}
