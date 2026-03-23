from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db import connection
from .services.ILP import main as run_ilp
from .services.paper_reviewer_edge import main as run_similarity
from .services.ILP_with_iterative_rounding import main_iterative as run_ilpr
from django.http import JsonResponse

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def run_matching_with_ILP(request):
    return Response(run_ilp())


@api_view(['POST'])
# @permission_classes([IsAuthenticated])
def run_matching(request):
    return Response(run_ilp())


@api_view(['POST'])
# @permission_classes([IsAuthenticated])
def run_similarity_api(request):
    return Response(run_similarity())

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def run_matching_with_iterative_rounding(request):
    return Response(run_ilpr)


def check_edge_weight_table(request):

    with connection.cursor() as cursor:
        tables = connection.introspection.table_names()

        if 'paper_to_reviewer' not in tables:
            return JsonResponse({
                "doesExist": False,
            })

        cursor.execute('''SELECT EXISTS (SELECT 1 FROM paper_to_reviewer LIMIT 1);''')
        has_data = cursor.fetchone()[0]

    return JsonResponse({
        "doesExist": has_data
    })