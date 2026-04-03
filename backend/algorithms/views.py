from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db import connection
from django.http import JsonResponse

from .services.ILP import main as run_ilp
from .services.paper_reviewer_edge import main as run_similarity
from .services.ILP_with_iterative_rounding import main as run_ilpr
from .services.Iterative_max_flow_fair import main as run_iterative_assignment_algo


# ---------------------------------------------------------------------------
# ILP matcher (direct ILP)
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
        assignments, weights, score = run_iterative_assignment_algo()

        return Response({
            "status": "success",
            "score": score,
            "assignments": assignments,
            "total_weights": weights
        })

    except Exception as e:
        return Response(
            {"status": "error", "message": str(e)},
            status=500
        )


# ---------------------------------------------------------------------------
# Simple ILP (no auth)
# ---------------------------------------------------------------------------

@api_view(['POST'])
def run_matching(request):
    return Response(run_ilp())


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

    data       = request.data or {}
    k          = int(data.get("k", 3))
    max_load   = int(data.get("max_load", 6))
    epsilon    = float(data.get("epsilon", 0))
    time_limit = data.get("time_limit", None)

    if time_limit is not None:
        time_limit = float(time_limit)

    try:
        result = run_ilpr(
            k=k,
            max_load=max_load,
            epsilon=epsilon,
            time_limit=time_limit,
        )
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