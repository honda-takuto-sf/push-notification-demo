/**
 * バックエンドへ FCM トークンが保存されているか確認
 * @param token - FCM トークン
 * @returns {Promise<boolean>} - トークンが保存されているか
 */
export const checkFcmToken = async (token: string): Promise<boolean> => {
    try {
        const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/check-fcm-token/?token=${token}`;
        console.log("[API] FCM トークン存在確認リクエスト:", url);

        const response = await fetch(url, {
            method: "GET",
            headers: { "Content-Type": "application/json", "Accept": "application/json" },
        });

        if (!response.ok) {
            throw new Error(`[ERROR] APIレスポンスエラー: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log("[API] FCM トークン確認結果:", data.exists);

        return data.exists;
    } catch (error) {
        console.error("[ERROR] FCM トークン確認中にエラー:", error);
        return false;
    }
};
