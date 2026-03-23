from django.urls import path
from .views import  run_similarity_api,check_edge_weight_table,run_matching_with_iterative_rounding

urlpatterns = [
    # path('run_ilp/', run_matching_with_ILP),
    path('run_edge_weights/', run_similarity_api),
    path('check_edge_weight_table/', check_edge_weight_table),
    path('ilpr/',run_matching_with_iterative_rounding)
]