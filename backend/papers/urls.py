from django.urls import path
from .views import PaperCreateView, PaperListView, PaperDetailView

urlpatterns = [
    path("", PaperListView.as_view(), name="paper_list"),   
    path("create/", PaperCreateView.as_view(), name="paper_create"), 
    path("<int:pk>/", PaperDetailView.as_view(), name="paper_detail"),
]