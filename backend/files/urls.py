from django.urls import path
from .views import ImageKitAuthView

urlpatterns = [
    path("upload_auth/", ImageKitAuthView.as_view()),
]