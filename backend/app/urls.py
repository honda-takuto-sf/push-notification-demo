from django.urls import path
from .views import send_notification, save_fcm_token

urlpatterns = [
    path("send-notification/", send_notification, name="send_notification"),
    path("save-fcm-token/", save_fcm_token, name="save_fcm_token"),
]
