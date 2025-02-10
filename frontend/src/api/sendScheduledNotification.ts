/**
 * 指定された FCM トークンにスケジュール通知を送信
 * @param token - FCM トークン
 * @param title - 通知タイトル
 * @param body - 通知本文
 * @param delay - 送信までの遅延時間（秒）
 * @returns {Promise<object>} - APIのレスポンスデータ
 */
export const sendScheduledNotification = async (token: string, title: string, body: string, delay: number): Promise<object> => {
    try {
        console.log("[API] スケジュール通知送信開始:", { token, title, body, delay });

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/send-scheduled-notification/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token, title, body, delay }),
        });

        if (!response.ok) {
            throw new Error(`[ERROR] スケジュール通知送信失敗: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log("[API] スケジュール通知送信成功:", data);

        return data;
    } catch (error) {
        console.error("[ERROR] スケジュール通知送信エラー:", error);
        return { error: "スケジュール通知送信失敗" };
    }
};
