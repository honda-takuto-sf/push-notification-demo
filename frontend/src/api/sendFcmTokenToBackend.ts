/**
 * バックエンドへ FCM トークンを送信
 * @param token - FCM トークン
 * @returns {Promise<object>} - APIのレスポンスデータ
 */
export const sendFcmTokenToBackend = async (token: string): Promise<object> => {
    try {
        console.log("[API] バックエンドへ FCM トークン送信開始:", token);

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/save-fcm-token/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token }),
        });

        if (!response.ok) {
            throw new Error(`[ERROR] FCM トークン保存失敗: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log("[API] FCM トークン保存成功:", data);

        return data;
    } catch (error) {
        console.error("[ERROR] FCM トークン保存エラー:", error);
        return { error: "FCM トークン保存エラー" };
    }
};
