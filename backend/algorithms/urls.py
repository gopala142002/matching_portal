from django.urls import path
from .views import (
    run_matching_with_ILP,
    run_similarity_api,
    check_edge_weight_table,
    run_matching_with_iterative_rounding,
    run_iterative_assignment
)

urlpatterns = [
    path('run_ilp/',                  run_matching_with_ILP),
    path('run_edge_weights/',         run_similarity_api),
    path('check_edge_weight_table/',  check_edge_weight_table),
    path('run_ilpr/',                 run_matching_with_iterative_rounding),
    path('iterative_assignment/',run_iterative_assignment)
]