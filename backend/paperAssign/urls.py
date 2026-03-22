from django.urls import path
from .views import run_assignment
urlpatterns=[
    path("run/",run_assignment,name="run_assignment")
]