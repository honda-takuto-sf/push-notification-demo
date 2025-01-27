from django.db import models

class FCMToken(models.Model):
    token = models.CharField(max_length=255, unique=True)  # FCMトークンを保存
    created_at = models.DateTimeField(auto_now_add=True)  # 登録日時
    updated_at = models.DateTimeField(auto_now=True)  # 更新日時

    def __str__(self):
        return self.token
