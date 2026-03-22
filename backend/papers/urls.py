from django.urls import path
from .views import PaperCreateView, PaperListView, PaperDetailView

urlpatterns = [
    path("create/", PaperCreateView.as_view(), name="paper_create"),
    path("", PaperListView.as_view(), name="get_papers"),
    path("<int:pk>/", PaperDetailView.as_view(), name="paper_detail"),
]
