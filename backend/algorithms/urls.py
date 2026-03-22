from django.urls import path
from .views import run_matching, run_similarity_api

urlpatterns = [
    path('run-matching/', run_matching),
    path('run-similarity/', run_similarity_api),
]