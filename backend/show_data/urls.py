from django.urls import path
from .views import paper_reviewer_table

urlpatterns = [
    path("table/", paper_reviewer_table),
]