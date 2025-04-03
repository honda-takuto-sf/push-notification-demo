/**
 * バックエンドへ FCM トークンが保存されているか確認
 * @param token - FCM トークン
 * @returns {Promise<boolean>} - トークンが保存されているか
 */
export const checkFcmToken = async (token: string): Promise<boolean> => {
    try {
        const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/check-fcm-token/?token=${token}`;
        console.log(`[API] FCM トークン存在確認リクエスト: ${url}`);

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/check-fcm-token/?token=${token}`, {
            method: "GET",
            headers: { "Content-Type": "application/json", "Accept": "application/json", "Origin": "https://petite-bobcats-juggle.loca.lt" },
            credentials: 'include',
            mode: "cors",
        });

        // レスポンスのステータスコードを表示
        console.log(`[API] レスポンスステータス: ${response.status}`);

        if (!response.ok) {
            const text = await response.text();
            console.log(`[ERROR] FCM トークン確認失敗: ${response.status} ${response.statusText}`);
            console.log(`[ERROR] レスポンス内容 (HTML の可能性あり): ${text}`);
            throw new Error(`[ERROR] APIレスポンスエラー: ${response.status} ${response.statusText}`);
        }

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            const text = await response.text();
            console.log(`[ERROR] レスポンスが JSON ではありません: ${text}`);
            console.log(`[ERROR] レスポンスが JSON ではありません: ${text}`);
            throw new Error("Unexpected response format (not JSON)");
        }

        const data = await response.json();
        console.log(`[API] FCM トークン確認結果 (JSON): ${JSON.stringify(data)}`);
        return data.exists;
    } catch (error) {
        console.log(`[ERROR] FCM トークン確認中にエラー: ${error}`);
        console.error("[ERROR] FCM トークン確認中にエラー:", error);
        return false;
    }
};

