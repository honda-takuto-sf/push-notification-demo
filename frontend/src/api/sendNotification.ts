/**
 * 指定された FCM トークンに通知を送信
 * @param token - FCM トークン
 * @param title - 通知タイトル
 * @param body - 通知本文
 * @returns {Promise<object>} - APIのレスポンスデータ
 */
export const sendNotification = async (token: string, title: string, body: string, icon_url: string, image: string): Promise<object> => {
    try {
        console.log("[API] 通知送信開始:", { token, title, body });
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/send-notification/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token, title, body, icon_url, image }),
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`[ERROR] 通知送信失敗: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log("[API] 通知送信成功:", data);

        return data;
    } catch (error) {
        console.error("[ERROR] 通知送信エラー:", error);
        return { error: "通知送信失敗" };
    }
};
