from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
import firebase_admin
from firebase_admin import credentials, messaging
from .models import FCMToken
import os
import threading
import time

# Firebase 認証情報の初期化
firebase_credentials_path = os.getenv("FIREBASE_CREDENTIALS_PATH")
if not firebase_credentials_path:
    raise ValueError("FIREBASE_CREDENTIALS_PATH が .env に設定されていません")

cred = credentials.Certificate(firebase_credentials_path)
firebase_admin.initialize_app(cred)

@csrf_exempt
def send_notification(request):
    """
    クライアントからのリクエストを受け取り、指定された FCM トークンに通知を3秒後に送信する。
    """
    if request.method != "POST":
        return JsonResponse({"error": "無効なリクエストです"}, status=400)

    try:
        data = json.loads(request.body)
        token = data.get("token")
        title = data.get("title")
        body = data.get("body")
        icon_url = data.get("icon_url")
        image = data.get("image")
        url = data.get("url")
        delay = 3  # 全通知共通の遅延秒数

        print(f"[INFO] 通知リクエスト受信（{delay}秒後に送信予定）: {data}")

        if not token:
            return JsonResponse({"error": "FCM トークンが指定されていません"}, status=400)

        def send_delayed():
            time.sleep(delay)
            try:
                message = messaging.Message(
                    token=token,
                    webpush=messaging.WebpushConfig(
                        notification=messaging.WebpushNotification(
                            title=title,
                            body=body,
                            icon=icon_url,
                            image=image,
                        ),
                        data={"url": url} if url else None
                    )
                )
                response = messaging.send(message)
                print(f"[SUCCESS] 通知送信成功: {response}")
            except Exception as e:
                print(f"[ERROR] 通知送信エラー: {e}")

        threading.Thread(target=send_delayed).start()

        return JsonResponse({"message": f"{delay}秒後に通知を送信予定"})

    except json.JSONDecodeError:
        return JsonResponse({"error": "無効な JSON データです"}, status=400)
    except Exception as e:
        print(f"[ERROR] 通知送信処理中の例外: {e}")
        return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
def save_fcm_token(request):
    """
    クライアントから受け取った FCM トークンをデータベースに保存する。
    """
    if request.method != "POST":
        return JsonResponse({"error": "無効なリクエストです"}, status=400)

    try:
        data = json.loads(request.body)
        token = data.get("token")

        if not token:
            return JsonResponse({"error": "FCM トークンが指定されていません"}, status=400)

        obj, created = FCMToken.objects.get_or_create(token=token)
        print(f"[INFO] FCM トークン保存: {token} (新規: {created})")
        return JsonResponse({"message": "FCM トークンが保存されました", "created": created})

    except json.JSONDecodeError:
        return JsonResponse({"error": "無効な JSON データです"}, status=400)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
def check_fcm_token(request):
    """
    クライアントから受け取った FCM トークンがデータベースに存在するか確認する。
    """
    if request.method != "GET":
        return JsonResponse({"error": "無効なリクエストです"}, status=400)

    try:
        token = request.GET.get("token")
        if not token:
            print("[ERROR] FCM トークンが指定されていません")
            return JsonResponse({"error": "FCM トークンが指定されていません"}, status=400)

        exists = FCMToken.objects.filter(token=token).exists()
        print(f"[INFO] FCM トークンの存在確認: {token} -> {exists}")
        return JsonResponse({"exists": exists})

    except Exception as e:
        print(f"[ERROR] トークン確認中のエラー: {e}")
        return JsonResponse({"error": str(e)}, status=500)
