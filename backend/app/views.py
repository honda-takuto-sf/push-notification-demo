from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
import firebase_admin
from firebase_admin import credentials, messaging
from .models import FCMToken
import os
import threading
import time

# Firebase の認証情報を読み込む
firebase_credentials_path = os.getenv("FIREBASE_CREDENTIALS_PATH")
if not firebase_credentials_path:
    raise ValueError("FIREBASE_CREDENTIALS_PATH が .env に設定されていません")

cred = credentials.Certificate(firebase_credentials_path)
firebase_admin.initialize_app(cred)

@csrf_exempt
def send_notification(request):
    """
    クライアントからのリクエストを受け取り、指定された FCM トークンにプッシュ通知を送信する。
    """
    if request.method != "POST":
        return JsonResponse({"error": "無効なリクエストです"}, status=400)

    try:
        # リクエストボディを JSON としてパース
        data = json.loads(request.body)
        token = data.get("token")
        title = data.get("title", "デフォルトタイトル")
        body = data.get("body", "デフォルトメッセージ")

        print(f"[INFO] 通知送信: {title} - {body}")

        # トークンが指定されていない場合エラーを返す
        if not token:
            return JsonResponse({"error": "FCM トークンが指定されていません"}, status=400)

        # Firebase でプッシュ通知を作成
        message = messaging.Message(
            notification=messaging.Notification(title=title, body=body),
            token=token,
        )

        # 通知を送信
        response = messaging.send(message)
        print(f"[SUCCESS] FCM 通知送信成功: {response}")
        return JsonResponse({"message": "通知が送信されました", "response": response})

    except json.JSONDecodeError:
        return JsonResponse({"error": "無効な JSON データです"}, status=400)
    except Exception as e:
        print(f"[ERROR] FCM 通知送信エラー: {e}")
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def send_scheduled_notification(request):
    """
    指定された FCM トークンに対し、遅延送信のプッシュ通知を送信する。
    """
    if request.method != "POST":
        return JsonResponse({"error": "無効なリクエストです"}, status=400)

    try:
        data = json.loads(request.body)
        token = data.get("token")
        title = data.get("title", "デフォルトタイトル")
        body = data.get("body", "デフォルトメッセージ")
        delay = int(data.get("delay", 30))

        print(f"[INFO] {delay}秒後に通知予定: {title} - {body}")

        if not token:
            return JsonResponse({"error": "FCM トークンが指定されていません"}, status=400)

        # 遅延送信用のスレッドを作成
        def send_delayed_notification():
            time.sleep(delay)
            try:
                message = messaging.Message(
                    notification=messaging.Notification(title=title, body=body),
                    token=token,
                )
                response = messaging.send(message)
                print(f"[SUCCESS] バックグラウンド通知送信成功: {response}")
            except Exception as e:
                print(f"[ERROR] バックグラウンド通知送信エラー: {e}")

        threading.Thread(target=send_delayed_notification).start()

        return JsonResponse({"message": f"{delay}秒後に通知を送信予定"})

    except json.JSONDecodeError:
        return JsonResponse({"error": "無効な JSON データです"}, status=400)
    except Exception as e:
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

        # 既存のトークンがあるかチェックし、なければ新規登録
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
    print(f"[INFO] リクエスト内容: {request.GET}")

    if request.method != "GET":
        return JsonResponse({"error": "無効なリクエストです"}, status=400)

    try:
        print(f"[INFO] リクエストヘッダー: {dict(request.headers)}")
        print(f"[INFO] クエリパラメータ: {request.GET}")

        token = request.GET.get("token")
        if not token:
            print("[ERROR] FCM トークンが指定されていません")
            return JsonResponse({"error": "FCM トークンが指定されていません"}, status=400)

        exists = FCMToken.objects.filter(token=token).exists()
        print(f"[INFO] FCM トークン {token} の存在確認: {exists}")

        return JsonResponse({"exists": exists})

    except Exception as e:
        print(f"[ERROR] FCM トークン確認エラー: {e}")
        return JsonResponse({"error": str(e)}, status=500)
