from django.urls import path
from .views import run_matching, run_similarity_api,check_edge_weight_table

urlpatterns = [
    path('run_matching/', run_matching),
    path('run_edge_weights/', run_similarity_api),
    path('check_edge_weight_table/', check_edge_weight_table),
]