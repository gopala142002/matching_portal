from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.db import connection
from django.http import JsonResponse

from .services.ILP import main as run_ilp
from .services.paper_reviewer_edge import main as run_similarity
from .services.lp_with_iterative_rounding import main as run_lp_with_iterative_rounding
from .services.Iterative_max_flow_fair import main as run_iterative_assignment_algo
from .services.network_flow import main as run_network_flow


# ---------------------------------------------------------------------------
# Network Flow
# ---------------------------------------------------------------------------
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def run_network_flow_algo(request):
    try:
        result = run_network_flow()
        return Response(result)
    except Exception as e:
        return Response(
            {"status": "error", "message": str(e)},
            status=500
        )


# ---------------------------------------------------------------------------
# ILP matcher
# ---------------------------------------------------------------------------
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def run_matching_with_ILP(request):
    try:
        result = run_ilp()
        return Response(result)
    except Exception as e:
        return Response(
            {"status": "error", "message": str(e)},
            status=500
        )


# ---------------------------------------------------------------------------
# Iterative Max-Min Flow Assignment
# ---------------------------------------------------------------------------
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def run_iterative_assignment(request):
    try:
        result = run_iterative_assignment_algo()
        return Response(result)
    except Exception as e:
        return Response(
            {"status": "error", "message": str(e)},
            status=500
        )


# ---------------------------------------------------------------------------
# Simple ILP (same as ILP but direct call)
# ---------------------------------------------------------------------------
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def run_matching(request):
    try:
        return Response(run_ilp())
    except Exception as e:
        return Response(
            {"status": "error", "message": str(e)},
            status=500
        )


# ---------------------------------------------------------------------------
# Similarity / edge-weight computation
# ---------------------------------------------------------------------------
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def run_similarity_api(request):
    try:
        result = run_similarity()
        return Response(result)
    except Exception as e:
        return Response(
            {"status": "error", "message": str(e)},
            status=500
        )


# ---------------------------------------------------------------------------
# Iterative LP Rounding
# ---------------------------------------------------------------------------
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def run_matching_with_iterative_rounding(request):
    try:
        result = run_lp_with_iterative_rounding()
        return Response(result)
    except Exception as e:
        return Response(
            {"status": "error", "message": str(e)},
            status=500
        )


# ---------------------------------------------------------------------------
# Utility: check whether edge-weight table exists and has data
# ---------------------------------------------------------------------------
@api_view(['GET'])
@permission_classes([AllowAny])
def check_edge_weight_table(request):
    try:
        tables = connection.introspection.table_names()

        if 'paper_to_reviewer' not in tables:
            return JsonResponse({"doesExist": False})

        with connection.cursor() as cursor:
            cursor.execute(
                'SELECT EXISTS (SELECT 1 FROM paper_to_reviewer LIMIT 1);'
            )
            has_data = cursor.fetchone()[0]

        return JsonResponse({"doesExist": bool(has_data)})

    except Exception as e:
        return JsonResponse(
            {"doesExist": False, "error": str(e)},
            status=500
        )