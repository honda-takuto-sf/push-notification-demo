from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
import firebase_admin
from firebase_admin import credentials, messaging
from .models import FCMToken
import os

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
    if request.method == "POST":
        try:
            # リクエストデータを JSON 形式で取得
            data = json.loads(request.body)
            token = data.get("token")
            title = data.get("title", "デフォルトタイトル")
            body = data.get("body", "デフォルトメッセージ")

            # トークンが指定されていない場合、エラーレスポンスを返す
            if not token:
                return JsonResponse({"error": "FCM トークンが指定されていません"}, status=400)

            # Firebase でプッシュ通知を作成
            try:
                message = messaging.Message(
                    notification=messaging.Notification(title=title, body=body),
                    token=token,
                )
                response = messaging.send(message)  # 通知を送信
                print("FCM 通知送信成功:", response)
                return JsonResponse({"message": "通知が送信されました", "response": response})
            except Exception as e:
                print("FCM 通知送信エラー:", str(e))
                return JsonResponse({"error": str(e)}, status=500)

        except json.JSONDecodeError:
            return JsonResponse({"error": "無効な JSON データです"}, status=400)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    
    return JsonResponse({"error": "無効なリクエストです"}, status=400)

@csrf_exempt
def save_fcm_token(request):
    """
    クライアントから FCM トークンを受け取り、データベースに保存する。
    """
    if request.method == "POST":
        try:
            # リクエストデータを JSON 形式で取得
            data = json.loads(request.body)
            token = data.get("token")

            # トークンが指定されていない場合、エラーレスポンスを返す
            if not token:
                return JsonResponse({"error": "FCM トークンが指定されていません"}, status=400)

            # 既存のトークンがあるかチェックし、なければ新規登録
            obj, created = FCMToken.objects.get_or_create(token=token)

            return JsonResponse({"message": "FCM トークンが保存されました", "created": created})
        except json.JSONDecodeError:
            return JsonResponse({"error": "無効な JSON データです"}, status=400)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    
    return JsonResponse({"error": "無効なリクエストです"}, status=400)