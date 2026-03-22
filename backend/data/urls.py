from django.urls import path
from .views import MetadataAPIView

urlpatterns = [
    path("list/", MetadataAPIView.as_view(), name="metadata-list"),
]