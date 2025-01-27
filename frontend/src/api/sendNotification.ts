export async function sendNotification(token: string, title: string, body: string) {
  try {
    const response = await fetch("http://localhost:8000/api/send-notification/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token, title, body }),
    });

    if (!response.ok) {
      throw new Error(`Failed to send notification: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to send notification:", error);
    return { error: "Failed to send notification" };
  }
}


export const sendFcmTokenToBackend = async (token: string) => {
    try {
        const response = await fetch("http://localhost:8000/api/save-fcm-token/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token }),
        });

        if (!response.ok) {
            throw new Error(`Failed to save FCM token: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("[API] ✅ トークン保存成功:", data);
    } catch (error) {
        console.error("[API] ❌ トークン保存エラー:", error);
    }
};