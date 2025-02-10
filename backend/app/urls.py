from django.http import JsonResponse
from django.urls import path
from .views import send_notification, send_scheduled_notification, save_fcm_token, check_fcm_token

urlpatterns = [
    path("send-notification/", send_notification, name="send_notification"),
    path("send-scheduled-notification/", send_scheduled_notification, name="send_scheduled_notification"),
    path("save-fcm-token/", save_fcm_token, name="save_fcm_token"),
    path("check-fcm-token/", check_fcm_token, name="check_fcm_token"),
]